const NodeCache = require("node-cache");
const crypto = require("crypto");
const { CACHE_TTL } = require("../config");
const storyService = require("./storyService");
const imageService = require("./imageService");
const logger = require("../utils/logger");

const preloadCache = new NodeCache({ stdTTL: CACHE_TTL.PRELOAD }); // preloaded nodes keyed by `${nodeId}:${choice}`
const pendingPreloads = new Map(); // Key: `${nodeId}:${choice}`, Value: { promise, controller }

async function generateNodeForChoice({ currentNode = null, choice = 'start', history = [], forcedPrompt = null, depth = 0, signal }) {
    let contextNodes = history.slice(-5);
    if (history.length > 0 && history[0] && !contextNodes.some(n => n.id === history[0].id)) {
        contextNodes = [history[0], ...contextNodes];
    }
    const recentHistory = contextNodes.map((n, i) => `(${i + 1}) ${n.text}`).join("\n");
    const prompt = storyService.createPrompt(recentHistory, currentNode, choice, forcedPrompt, depth);

    const storyKey = crypto.createHash("sha256").update(prompt).digest("hex");
    const cachedStory = storyService.getCachedStory(storyKey);

    if (cachedStory && choice !== 'start') {
        return JSON.parse(JSON.stringify(cachedStory));
    }

    const story = await storyService.getStory(prompt, signal);
    const message = story.choices[0].message.content;
    const match = message.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : { text: message, image: "", choices: { left: "Left", right: "Right" }, isEnding: false, endingType: "neutral", objectiveScore: 50, inventory: [] };

    const imgKey = crypto.createHash("sha256").update(json.image).digest("hex");
    let imageUrl = imageService.getCachedImage(imgKey);

    if (!imageUrl) {
        const imgResp = await imageService.getImage(json.image, currentNode?.image, json.inventory || []);

        if (imgResp) {
            const base64Image = imgResp.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            imageUrl = `data:${base64Image.inlineData.mimeType};base64,${base64Image.inlineData.data}`;
            imageService.cacheImage(imgKey, imageUrl);
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
        isEnding: json.isEnding,
        endingType: json.endingType || "neutral",
        objectiveScore: json.objectiveScore || 50,
        inventory: json.inventory || []
    }

    storyService.cacheStory(storyKey, result);
    return JSON.parse(JSON.stringify(result));
}

async function preloadChoice(currentNode, choice, history = [], depth) {
    try {
        if (!currentNode) return;

        const preloadKey = `${currentNode.id}:${choice}`;

        if (preloadCache.get(preloadKey) || pendingPreloads.has(preloadKey)) {
            logger.info(`🗃️ Preload already exists or pending for ${preloadKey}`);
            return;
        }

        logger.info(`⏱️ Preloading branch [${choice}] for node ${preloadKey}`);

        const controller = new AbortController();
        const promise = generateNodeForChoice({ currentNode, choice, history, depth, signal: controller.signal });

        pendingPreloads.set(preloadKey, { promise, controller });

        try {
            const node = await promise;
            preloadCache.set(preloadKey, node);
            logger.info(`✅ Node ${preloadKey} stored in cache`);
        } catch (err) {
            if (err.name === 'AbortError' || err.name === 'APIUserAbortError') {
                logger.info(`🛑 Preload aborted for ${preloadKey}`);
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

function getPreload(key) {
    return preloadCache.get(key);
}

function getPendingPreload(key) {
    return pendingPreloads.get(key);
}

function cancelPreload(key) {
    if (pendingPreloads.has(key)) {
        logger.info(`🗑️ Cancelling unchosen preload: ${key}`);
        pendingPreloads.get(key).controller.abort();
    }
}

module.exports = {
    generateNodeForChoice,
    preloadChoice,
    getPreload,
    getPendingPreload,
    cancelPreload
};
