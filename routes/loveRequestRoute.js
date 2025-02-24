const express = require("express");
const router = express.Router();
const loveRequestController = require("../controllers/loveRequestController");
const { authenticator } = require("../middlewares/authentication");

// Send a love request
router.post("/love-request/send", authenticator, loveRequestController.sendLoveRequest);

// Route to send a gift
router.post("/send-gift", authenticator, loveRequestController.sendGift);

module.exports = router;
