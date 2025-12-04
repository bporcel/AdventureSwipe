const OpenAI = require("openai");
const NodeCache = require("node-cache");
const crypto = require("crypto");
const { SYSTEM_STORY_PROMPT, CACHE_TTL } = require("../config");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const storyCache = new NodeCache({ stdTTL: CACHE_TTL.STORY }); // cached story nodes by prompt hash

const createPrompt = (recentHistory, currentNode, choice, forcedPrompt, depth) => {
    console.log("DEPTH => ", depth)
    const prompt = forcedPrompt || `
    Previous scenes: ${recentHistory}
    Current scene: ${currentNode.text}
    Player swiped: ${choice} - ${currentNode.choices[choice]}.
    Current depth: ${depth}
    Current Objective Score: ${currentNode.objectiveScore || 50}
    Current Inventory: ${JSON.stringify(currentNode.inventory || [])}
    Describe what happens next.
`;

    return prompt
}

const getStory = async (prompt, signal) => {
    console.log("Generating new user story:");
    return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: SYSTEM_STORY_PROMPT },
            { role: "user", content: prompt },
        ],
        temperature: 0.8,
    }, { signal });
}

const getCachedStory = (key) => {
    return storyCache.get(key);
};

const cacheStory = (key, value) => {
    storyCache.set(key, value);
};

module.exports = {
    createPrompt,
    getStory,
    getCachedStory,
    cacheStory
};
