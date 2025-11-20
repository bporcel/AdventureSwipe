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
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const storyCache = new NodeCache({ stdTTL: 3600 }); // cached story nodes by prompt hash
const imageCache = new NodeCache({ stdTTL: 24 * 3600 }); // cached images by prompt hash
const preloadCache = new NodeCache({ stdTTL: 3600 }); // preloaded nodes keyed by `${nodeId}:${choice}`
const limiter = new Bottleneck({ minTime: 1500 });  // at least 1.5s between image requests


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

    3. **Tone & Style**
    - Use atmospheric, sensory descriptions.
    - Keep text concise (max 80 words).
    - Avoid repeating phrases or recapping previous scenes.

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
        "image": "short description for background art",
        "text": "next part of the story (max 80 words)",
        "choices": {
            "left": "action text for swiping left",
            "right": "action text for swiping right"
        }
    }

    No extra text outside the JSON.
    No commentary.
    No explanations.
    No markdown formatting.

    Keep responses coherent, atmospheric, choice-driven, and consistently tied to the main objective.
`;

app.post("/next", async (req, res) => {
    try {
        const { currentNode, choice, history = [] } = req.body;

        if (process.env.NODE_ENV === 'dev') {
            const result = {
                id: `${Date.now()}:${choice}`,
                text: `Lorem ipsum dolor sit amet, 
                consectetur adipiscing elit,
                laboris nisi ut aliquip ex ea commodo consequat. - ${Math.random()}`,
                image: "https://placehold.co/400x400/png",
                choices: {
                    right: 'very very longo jejejejejejej right',
                    left: 'same lmao lmoa lmao lmao lma left',
                }
            }

            res.json(result);
        } else {
            const preloadKey = `${currentNode.id}:${choice}`;
            try {
                let result = preloadCache.get(preloadKey);
                console.log(preloadKey)
                if (result) {
                    console.log(`⚡ Returning preloaded node for ${preloadKey}`);
                } else {
                    result = await generateNodeForChoice({ currentNode, choice, history });
                }

                res.json(result);
                preloadChoice(result, "left", [...(history || []), result]);
                preloadChoice(result, "right", [...(history || []), result]);
            } catch (e) {
                console.error("Preload failed with error => ", e)
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
            const result = {
                id: Date.now(),
                text: `Lorem ipsum dolor sit amet, 
                consectetur adipiscing elit,
                laboris nisi ut aliquip ex ea commodo consequat. - ${Math.random()}`,
                image: "https://placehold.co/400x400/png",
                choices: {
                    right: 'right',
                    left: 'left',
                }
            }

            res.json(result);
        } else {
            const prompt = 'Create a new game. Dark fantasy oriented.';
            const result = await generateNodeForChoice({ forcedPrompt: prompt });
            res.json(result);

            try {
                preloadChoice(result, "right", [result]);
                preloadChoice(result, "left", [result]);
            } catch (e) {
                console.error("Preload failed after new game with error => ", e)
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error generating story" });
    }
});

async function generateNodeForChoice({ currentNode = null, choice = 'start', history = [], forcedPrompt = null }) {
    const recentHistory = history.slice(-5).map((n, i) => `(${i + 1}) ${n.text}`).join("\n");
    const prompt = createPrompt(recentHistory, currentNode, choice, forcedPrompt);

    const storyKey = crypto.createHash("sha256").update(prompt).digest("hex");
    const cachedStory = storyCache.get(storyKey);

    if (cachedStory) {
        return JSON.parse(JSON.stringify(cachedStory));
    }

    const story = await getStory(prompt);
    const message = story.choices[0].message.content;
    const match = message.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : { text: message, image: "", choices: { left: "Left", right: "Right" } };

    const imgKey = crypto.createHash("sha256").update(json.image).digest("hex");
    let imageUrl = imageCache.get(imgKey);

    if (!imageUrl) {
        const imgResp = await getImage(json.image);

        const base64Image = imgResp.generatedImages[0].image.imageBytes;
        imageUrl = `data:image/jpeg;base64,${base64Image}`;
        imageCache.set(imgKey, imageUrl);
    }

    const result = {
        id: `${Date.now()}:${choice}`,
        text: json.text.trim(),
        image: imageUrl || "",
        choices: {
            right: json.choices.right,
            left: json.choices.left,
        }
    }

    storyCache.set(storyKey, result);
    return JSON.parse(JSON.stringify(result));
}

async function preloadChoice(currentNode, choice, history = []) {
    try {
        if (!currentNode) return;

        const preloadKey = `${currentNode.id}:${choice}`;

        if (preloadCache.get(preloadKey)) {
            console.log(`🗃️ Preload already exists for ${preloadKey}`);
            return;
        }

        console.log(`⏱️ Preloading branch [${choice}] for node ${preloadKey}`);
        const node = await generateNodeForChoice({ currentNode, choice, history });

        preloadCache.set(preloadKey, node);
        console.log(`✅ Node ${preloadKey} stored in cache`);
    } catch (err) {
        console.warn("Preload error:", err);
    }
}

const createPrompt = (recentHistory, currentNode, choice, forcedPrompt) => {
    const prompt = forcedPrompt || `
    Previous scenes: ${recentHistory || "None yet."}
    Current scene: ${currentNode?.text || "The story begins."}
    Player swiped: ${choice}.
    Describe what happens next.
`;

    return prompt
}

const getStory = async (prompt) => {
    console.log("Generating new user story:");
    return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
        ],
        temperature: 0.8,
    });
}

const getImage = async (image) => {
    console.log("🖼️ Generating new Gemini image:");
    return await limiter.schedule(() =>
        ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: image,
            config: {
                numberOfImages: 1,
                outputMimeType: "image/jpeg",
                aspectRatio: "1:1",
            },
        })
    );
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