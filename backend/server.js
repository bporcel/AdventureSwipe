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

const storyCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
const imageCache = new NodeCache({ stdTTL: 24 * 3600 }); // 24 hours for image reuse
const limiter = new Bottleneck({ minTime: 1500 });  // at least 1.5s between image requests

const SYSTEM_PROMPT = `
    You are an AI storyteller for a "choose your own adventure" game.
    Always respond in JSON with:
    {
        "image": "short image description for background",
        "text": "next part of the story (max 80 words)"
    }
    Keep responses concise and atmospheric.
    Avoid repetition. Assume each turn follows naturally from the last.
`;

app.post("/next", async (req, res) => {
    try {
        const { currentNode, choice, history = [] } = req.body;

        const recentHistory = history.slice(-5).map((n, i) => `(${i + 1}) ${n.text}`).join("\n");

        const prompt = createPrompt(recentHistory, currentNode, choice);

        // const storyKey = crypto.createHash("sha256").update(prompt).digest("hex");
        // const cachedStory = storyCache.get(storyKey);
        // if (cachedStory) {
        //     console.log("⚡ Using cached story node");
        //     return res.json(cachedStory);
        // }

        const openaiResponse = await getText(prompt);
        const message = openaiResponse.choices[0].message.content;
        const match = message.match(/\{[\s\S]*\}/);
        const json = match ? JSON.parse(match[0]) : { text: message, image: "" };

        // if (!json.image) json.image = "fantasy forest";

        // const imgKey = crypto.createHash("sha256").update(json.image).digest("hex");
        // let imageUrl = imageCache.get(imgKey);

        // if (!imageUrl) {
        console.log("🖼️ Generating new Gemini image:", json.image);

        // const imgResp = await limiter.schedule(() =>
        //     ai.models.generateImages({
        //         model: "imagen-4.0-generate-001",
        //         prompt: json.image,
        //         config: {
        //             numberOfImages: 1,
        //             outputMimeType: "image/jpeg",
        //             aspectRatio: "1:1",
        //         },
        //     })
        // );
        
        const imgResponse = await getImage(json.image);
        const base64Image = imgResponse.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        // imageCache.set(imgKey, imageUrl);
        // } else {
        //     console.log("🗃️ Using cached image:", json.image);
        // }

        const result = {
            id: `${Date.now()}-${choice}`,
            text: json.text.trim(),
            image: imageUrl || "",
        }

        // storyCache.set(storyKey, result);

        // const result = {
        //     id: `${Date.now()}-${choice}`,
        //     text: `Test text - ${Math.random()}`,
        //     image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3&s=7c5b81a5b03a6c2e1e6f7d1f4d7b9b1d"
        // }

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error generating story" });
    }
});


const createPrompt = (recentHistory, currentNode, choice) => {

    const prompt = `
    Previous scenes: ${recentHistory || "None yet."}
    Current scene: ${currentNode?.text || "The story begins."}
    Player swiped: ${choice}.
    Describe what happens next.
`;

    return prompt
}

const getText = async (prompt) => {
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
    res.send("AdventureSwipe backend is running.");
  });

app.listen(process.env.PORT || 5000, () =>
    console.log(`✅ Backend running on port ${process.env.PORT || 5000}`)
);


// setInterval(() => {
//     console.log("Story cache size:", storyCache.getStats().keys, "Image cache size:", imageCache.getStats().keys);
//   }, 10000);