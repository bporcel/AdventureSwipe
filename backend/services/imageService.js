const { GoogleGenAI } = require("@google/genai");
const NodeCache = require("node-cache");
const Bottleneck = require("bottleneck");
const crypto = require("crypto");
const { SYSTEM_IMAGE_PROMPT, CACHE_TTL, RATE_LIMIT_MS } = require("../config");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const imageCache = new NodeCache({ stdTTL: CACHE_TTL.IMAGE }); // cached images by prompt hash
const limiter = new Bottleneck({ minTime: RATE_LIMIT_MS });  // at least 1.5s between image requests

const getImage = async (prompt, referenceImage, inventory = []) => {
    console.log("🖼️ Generating new Gemini image:");
    if (process.env.NODE_ENV === 'test_gpt') return;

    return await limiter.schedule(async () => {
        const parts = [];

        const inventoryText = inventory.length > 0 ? inventory.join(", ") : "None";
        parts.push({
            text: SYSTEM_IMAGE_PROMPT.replace("{prompt}", prompt).replace("{inventory}", inventoryText),
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
        }).catch(err => {
            console.error("Gemini API Error:", err);
            return null; // Return null on image generation failure to allow story to proceed without image
        });
    });
};

const getCachedImage = (key) => {
    return imageCache.get(key);
};

const cacheImage = (key, value) => {
    imageCache.set(key, value);
};

module.exports = {
    getImage,
    getCachedImage,
    cacheImage
};
