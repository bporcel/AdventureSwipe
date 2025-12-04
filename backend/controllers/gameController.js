const gameService = require("../services/gameService");
const { buildTestResult } = require("../utils/testUtils");

const nextScene = async (req, res) => {
    try {
        const { currentNode, choice, history = [], depth } = req.body;

        // Input Validation
        if (!currentNode || !currentNode.id) {
            return res.status(400).json({ error: "Invalid request: currentNode is required." });
        }
        if (!choice) {
            return res.status(400).json({ error: "Invalid request: choice is required." });
        }

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
            gameService.cancelPreload(otherKey);

            try {
                let result;

                // Check if we have a pending preload for THIS choice
                const pendingPreload = gameService.getPendingPreload(preloadKey);
                if (pendingPreload) {
                    console.log(`⚡ Joining pending preload for ${preloadKey}`);
                    result = await pendingPreload.promise;
                } else {
                    result = gameService.getPreload(preloadKey);
                    console.log(preloadKey)
                    if (result) {
                        console.log(`⚡ Returning preloaded node for ${preloadKey}`);
                    } else {
                        result = await gameService.generateNodeForChoice({ currentNode, choice, history, depth });
                    }
                }

                res.json(result);

                gameService.preloadChoice(result, "left", [...(history || []), result], depth + 1);
                gameService.preloadChoice(result, "right", [...(history || []), result], depth + 1);
            } catch (e) {
                console.error("Generation failed with error => ", e)
                res.status(500).json({ error: "Server error generating story", details: e.message });
            }
        }
    } catch (err) {
        console.error("Critical error in /next endpoint:", err);
        res.status(500).json({ error: "Server error generating story", details: err.message });
    }
};

const newGame = async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'dev') {
            const result = buildTestResult();
            res.json(result);
        } else {
            const prompt = 'Create a new game. Dark fantasy oriented.';
            const result = await gameService.generateNodeForChoice({ forcedPrompt: prompt });
            res.json(result);

            try {
                gameService.preloadChoice(result, "right", [result], 1);
                gameService.preloadChoice(result, "left", [result], 1);
            } catch (e) {
                console.error("Preload failed after new game with error => ", e)
            }
        }
    } catch (err) {
        console.error("Critical error in /new-game endpoint:", err);
        res.status(500).json({ error: "Server error generating story", details: err.message });
    }
};

module.exports = {
    nextScene,
    newGame
};
