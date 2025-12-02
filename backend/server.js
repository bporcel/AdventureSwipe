const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const NodeCache = require("node-cache");
const Bottleneck = require("bottleneck");
const crypto = require("crypto");
const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");


dotenv.config();

const app = express();
app.use(cors());

app.use(express.json({ limit: '50mb' }));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const storyCache = new NodeCache({ stdTTL: 3600 }); // cached story nodes by prompt hash
const imageCache = new NodeCache({ stdTTL: 24 * 3600 }); // cached images by prompt hash
const preloadCache = new NodeCache({ stdTTL: 3600 }); // preloaded nodes keyed by `${nodeId}:${choice}`
const pendingPreloads = new Map(); // Key: `${nodeId}:${choice}`, Value: { promise, controller }
const limiter = new Bottleneck({ minTime: 1500 });  // at least 1.5s between image requests

// - depth 0–4: Exploration → introduce world, clarify objective, light obstacles.
// - depth 5–9: Rising Tension → strong challenges, discoveries, growing stakes.
// - depth 10–13: Climax → confront main threat or final barrier.
// - depth ≥ 14: Ending → always produce a conclusive ending node.

const SYSTEM_PROMPT = `
    You are an AI storyteller generating scenes for a swipe-based "choose your own adventure" mobile game.

    The story must ALWAYS revolve around a clear MAIN OBJECTIVE chosen at the beginning
    (e.g., escape a forest, recover a lost relic, reach a distant tower, find a missing person).
    This objective must stay consistent for the entire adventure unless the player completes or fails it.

    ────────────────────────
    STORY RULES
    ────────────────────────

    1. **Main Objective**
    - Introduce a clear main objective in the first scene.
    - Every scene must logically advance, challenge, or clarify this objective.
    - Never forget, replace, or contradict the main objective.

    2. **Scene Progression**
    - Each new node must follow naturally from the player’s previous action.
    - Scenes must feel directional, not random.
    - The world should react to player actions (consequences, discoveries, dangers, progression).
    - The story must gradually move toward a resolution: either achieving the main objective (success) or failing it (failure).
    - Introduce escalating tension, obstacles, and clues so the player can reach an ending within a reasonable number of choices.

    3. **Story Arc & Depth** 
    - You will receive a numeric "depth" value representing how far the player is into the story.
    - Use this to shape the narrative arc:
    - depth 0–2: Exploration → introduce world, clarify objective, light obstacles.
    - depth 2–3: Rising Tension → strong challenges, discoveries, growing stakes.
    - depth ≥ 4: Ending → always produce a conclusive ending node.
    - When in the Ending stage, set "isEnding": true and resolve the main objective with success or failure.
    - Never stall, loop, or reset the arc.

    4. **Tone & Style**
    - Use atmospheric, sensory descriptions.
    - Keep text concise (max 80 words).
    - Avoid repeating phrases or recapping previous scenes.

    5. **Visual Consistency & Transitions**
    - The "image" field description is CRITICAL.
    - If the player stays in the same area, REPEAT the key visual elements (e.g., "The same bioluminescent forest, green fog, mossy trees").
    - Do not assume the artist knows the previous context. You must explicitly restate the environment style in every image prompt.
    - Only change the environment keywords if the story explicitly moves to a new location (e.g., entering a cave).

    ────────────────────────
    ENDING RULES (STRICT)
    ────────────────────────
    - When you set "isEnding": true, the scene must be a complete and final conclusion.
    - Do NOT include any choices or questions. The "choices" object must contain empty strings.
    - The text must resolve the main objective with a clear success or failure.
    - No ambiguity, no cliffhangers, no invitations for further action.
    - The ending should feel like the last scene of an adventure, not a setup for another choice.

    ────────────────────────
    ENDING GUIDANCE
    ────────────────────────
    - Ensure the player is always progressing toward an eventual ending.
    - Build in opportunities for success or failure related to the main objective.
    - Avoid loops that prevent the story from reaching a conclusion.
    - Introduce subtle narrative signals that indicate progress or setbacks toward the final outcome.

    ────────────────────────
    CHOICE RULES
    ────────────────────────

    1. The player only has two actions: **left** and **right**.
    2. Each choice must be:
    - Clear and actionable
    - Distinct from the other
    - Relevant to the main objective
    3. Never use vague verbs like “continue” or “keep going.”
    Choices must describe *meaningful actions*, such as:
    - “Investigate the glowing symbol”
    - “Speak with the hooded figure”
    - “Take the high path toward the tower”
    - “Hide behind the fallen tree”

    ────────────────────────
    RESPONSE FORMAT
    ────────────────────────

    Always respond **ONLY** with valid JSON:

    {
        "image": "detailed visual description for an oil painting. Include lighting, colors, and key elements. (max 40 words)",
        "text": "next part of the story (max 80 words)",
        "choices": {
            "left": "action text for swiping left",
            "right": "action text for swiping right"
        },
        "isEnding": boolean (true || false) "indicates when the ending is reached."
    }

    - No extra text outside the JSON.
    - No commentary.
    - No explanations.
    - No markdown formatting.
    - Keep responses coherent, atmospheric, choice-driven, and consistently tied to the main objective.
`;

app.post("/next", async (req, res) => {
    try {
        const { currentNode, choice, history = [], depth } = req.body;

        if (currentNode.isEnding === true) {
            console.log('ending reached');
            res.json(currentNode);
            return;
        };

        if (process.env.NODE_ENV === 'dev') {
            const result = buildTestResult();

            res.json(result);
        } else {
            const preloadKey = `${currentNode.id}:${choice}`;

            // Cancel unchosen paths
            const otherChoice = choice === 'left' ? 'right' : 'left';
            const otherKey = `${currentNode.id}:${otherChoice}`;
            if (pendingPreloads.has(otherKey)) {
                console.log(`🗑️ Cancelling unchosen preload: ${otherKey}`);
                pendingPreloads.get(otherKey).controller.abort();
            }

            try {
                let result;

                // Check if we have a pending preload for THIS choice
                if (pendingPreloads.has(preloadKey)) {
                    console.log(`⚡ Joining pending preload for ${preloadKey}`);
                    result = await pendingPreloads.get(preloadKey).promise;
                } else {
                    result = preloadCache.get(preloadKey);
                    console.log(preloadKey)
                    if (result) {
                        console.log(`⚡ Returning preloaded node for ${preloadKey}`);
                    } else {
                        result = await generateNodeForChoice({ currentNode, choice, history, depth });
                    }
                }

                res.json(result);

                preloadChoice(result, "left", [...(history || []), result], depth + 1);
                preloadChoice(result, "right", [...(history || []), result], depth + 1);
            } catch (e) {
                console.error("Generation failed with error => ", e)
                res.status(500).json({ error: "Server error generating story" });
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error generating story" });
    }
});

app.get("/new-game", async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'dev') {
            const result = buildTestResult();

            res.json(result);
        } else {
            const prompt = 'Create a new game. Dark fantasy oriented.';
            const result = await generateNodeForChoice({ forcedPrompt: prompt });
            res.json(result);

            try {
                preloadChoice(result, "right", [result], 1);
                preloadChoice(result, "left", [result], 1);
            } catch (e) {
                console.error("Preload failed after new game with error => ", e)
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error generating story" });
    }
});

async function generateNodeForChoice({ currentNode = null, choice = 'start', history = [], forcedPrompt = null, depth = 0, signal }) {
    const recentHistory = history.slice(-5).map((n, i) => `(${i + 1}) ${n.text}`).join("\n");
    const prompt = createPrompt(recentHistory, currentNode, choice, forcedPrompt, depth);

    const storyKey = crypto.createHash("sha256").update(prompt).digest("hex");
    const cachedStory = storyCache.get(storyKey);

    if (cachedStory && choice !== 'start') {
        return JSON.parse(JSON.stringify(cachedStory));
    }

    const story = await getStory(prompt, signal);
    const message = story.choices[0].message.content;
    const match = message.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : { text: message, image: "", choices: { left: "Left", right: "Right" }, isEnding: false };

    const imgKey = crypto.createHash("sha256").update(json.image).digest("hex");
    let imageUrl = imageCache.get(imgKey);

    if (!imageUrl) {
        const imgResp = await getImage(json.image, currentNode?.image);

        if (imgResp) {
            const base64Image = imgResp.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            imageUrl = `data:${base64Image.inlineData.mimeType};base64,${base64Image.inlineData.data}`;
            imageCache.set(imgKey, imageUrl);
        }
    }

    const result = {
        id: `${Date.now()}:${choice}`,
        text: json.text.trim(),
        image: imageUrl || "https://placehold.co/400x400/png",
        choices: {
            right: json.choices.right,
            left: json.choices.left,
        },
        isEnding: json.isEnding
    }

    storyCache.set(storyKey, result);
    return JSON.parse(JSON.stringify(result));
}

async function preloadChoice(currentNode, choice, history = [], depth) {
    try {
        if (!currentNode) return;

        const preloadKey = `${currentNode.id}:${choice}`;

        if (preloadCache.get(preloadKey) || pendingPreloads.has(preloadKey)) {
            console.log(`🗃️ Preload already exists or pending for ${preloadKey}`);
            return;
        }

        console.log(`⏱️ Preloading branch [${choice}] for node ${preloadKey}`);

        const controller = new AbortController();
        const promise = generateNodeForChoice({ currentNode, choice, history, depth, signal: controller.signal });

        pendingPreloads.set(preloadKey, { promise, controller });

        try {
            const node = await promise;
            preloadCache.set(preloadKey, node);
            console.log(`✅ Node ${preloadKey} stored in cache`);
        } catch (err) {
            if (err.name === 'AbortError' || err.name === 'APIUserAbortError') {
                console.log(`🛑 Preload aborted for ${preloadKey}`);
            } else {
                console.error("Preload error:", err);
            }
        } finally {
            pendingPreloads.delete(preloadKey);
        }
    } catch (err) {
        console.error("Preload setup error:", err);
    }
}

const createPrompt = (recentHistory, currentNode, choice, forcedPrompt, depth) => {
    console.log("DEPTH => ", depth)
    const prompt = forcedPrompt || `
    Previous scenes: ${recentHistory}
    Current scene: ${currentNode.text}
    Player swiped: ${choice} - ${currentNode.choices[choice]}.
    Current depth: ${depth}
    Describe what happens next.
`;

    return prompt
}

const getStory = async (prompt, signal) => {
    console.log("Generating new user story:");
    return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
        ],
        temperature: 0.8,
    }, { signal });
}

const getImage = async (prompt, referenceImage) => {
    console.log("🖼️ Generating new Gemini image:");
    if (process.env.NODE_ENV === 'test_gpt') return;

    return await limiter.schedule(async () => {
        const parts = [];

        parts.push({
            text: `
            You are a lead concept artist for a dark fantasy RPG.
            
            TASK: Generate the NEXT frame in a continuous story.
            
            INPUT CONTEXT:
            - The user has provided a reference image (the previous scene).
            - STRICTLY maintain the same: Art style (Digital Oil Painting), Color Palette, Lighting conditions, and Environmental details.
            - CHANGE only: The action or perspective described in the prompt below.
            
            PROMPT: ${prompt}
            
            STYLE GUIDE:
            - Digital oil painting, visible brushstrokes.
            - Cinematic rim lighting.
            - Gritty, weathered details.
            - No photorealism, no 3D render look.
            `
        });

        if (referenceImage) {
            const cleanBase64 = referenceImage.replace(/^data:image\/\w+;base64,/, "");

            parts.push({
                inlineData: {
                    mimeType: "image/png",
                    data: cleanBase64
                }
            });
        }

        return await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
                {
                    role: "user",
                    parts: parts
                }
            ],
            config: {
                responseModalities: ["IMAGE"],
                generationConfig: {
                    temperature: 0.7,
                }
            }
        });
    });
}

function buildTestResult() {
    return {
        id: `${Date.now()}`,
        text: `Lorem ipsum dolor sit amet, 
        consectetur adipiscing elit,
        laboris nisi ut aliquip ex ea commodo consequat. - ${Math.random()}`,
        image: "https://placehold.co/400x400/png",
        choices: {
            right: 'very very longo jejejejejejej right',
            left: 'same lmao lmoa lmao lmao lma left',
        },
        depth: 0,
        isEnding: false,
    }
}

app.get("/", (req, res) => {
    res.send("AdventureSwipe backend is healthy.");
});

app.listen(process.env.PORT || 5000, () =>
    console.log(`✅ ${process.env.NODE_ENV} environment => Backend running on port ${process.env.PORT || 5000}`)
);


// setInterval(() => {
//     console.log("Story cache size:", storyCache.getStats().keys, "Image cache size:", imageCache.getStats().keys);
//   }, 10000);