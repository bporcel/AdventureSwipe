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

// - depth 0: Introduction → Clear objective, high stakes.
// - depth 1–3: Rising Action → Escalating challenges.
// - depth 4: Climax → Final confrontation.
// - depth ≥ 5: Ending → definitive conclusion.

const SYSTEM_PROMPT = `
    You are an AI storyteller generating scenes for a swipe-based "choose your own adventure" mobile game.

    The story must be SHORT and INTENSE. It must resolve in approximately 5-6 scenes.

    ────────────────────────
    STORY STRUCTURE (STRICT)
    ────────────────────────
    You will receive a "depth" parameter. You MUST follow this structure:

    - Depth 0 (Start): Introduce the Main Objective immediately. High stakes from the get-go.
    - Depth 1-3 (Rising Action): Escalate the danger. Each choice must have immediate consequences.
    - Depth 4 (Climax): The final obstacle or confrontation.
    - Depth >= 5 (Ending): THE STORY MUST END.

    ────────────────────────
    ENDING RULES (CRITICAL)
    ────────────────────────
    - If depth >= 5, you MUST set "isEnding": true.
    - The scene must be a definitive conclusion (Success or Failure).
    - "choices" object must contain empty strings: { "left": "", "right": "" }.
    - NO cliffhangers. NO "to be continued".
    - The text must clearly state the outcome of the main objective.

    ────────────────────────
    VISUALS
    ────────────────────────
    - Maintain consistent art style (Digital Oil Painting).
    - If the location hasn't changed, explicitly repeat the environment description in the "image" prompt.

    ────────────────────────
    RESPONSE FORMAT
    ────────────────────────
    Return ONLY valid JSON:
    {
        "image": "detailed visual description...",
        "text": "story text (max 60 words)",
        "choices": {
            "left": "Action 1",
            "right": "Action 2"
        },
        "isEnding": boolean
    }
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