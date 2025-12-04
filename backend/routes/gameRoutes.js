const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

router.post("/next", gameController.nextScene);
router.get("/new-game", gameController.newGame);

module.exports = router;
