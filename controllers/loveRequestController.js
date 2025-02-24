const userModel = require("../models/userModel"); 
const loveRequestModel = require("../models/loveRequestModel");
const giftModel = require("../models/giftModel");


exports.sendLoveRequest = async (req, res) => {
    try {
      const senderId = req.user.id; // Logged-in user's ID
      const { receiverUsername } = req.body; // Use username to find the receiver
  
      if (!receiverUsername) {
        return res.status(400).json({ message: "Receiver username is required." });
      }
  
      // Find receiver by username
      const receiver = await userModel.findOne({ username: receiverUsername });
      if (!receiver) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Prevent sending request to self
      if (req.user.username === receiverUsername) {
        return res.status(400).json({ message: "You cannot send a love request to yourself." });
      }
  
      // Check if a request already exists
      const existingRequest = await loveRequestModel.findOne({
        sender: senderId,
        receiver: receiver._id
      });
  
      if (existingRequest) {
        return res.status(400).json({ message: "Love request already sent." });
      }
  
      // Create and save the love request
      const newLoveRequest = new loveRequestModel({
        sender: senderId,
        receiver: receiver._id, // Store receiver's ObjectId
      });
  
      await newLoveRequest.save();
  
      res.status(201).json({ message: "Love request sent successfully. 💖" });
    } catch (error) {
      console.error("Error sending love request:", error);
      res.status(500).json({ message: "An error occurred while sending the love request." });
    }
  };
  


 

exports.sendGift = async (req, res) => {
  try {
    const senderId = req.user.id; 
    const { receiverUsername, giftType, message } = req.body;

    if (!receiverUsername || !giftType) {
      return res.status(400).json({ message: "Receiver username and gift type are required." });
    }

    // Find the receiver by username
    const receiver = await userModel.findOne({ username: receiverUsername });
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // Prevent sending gift to self
    if (req.user.username === receiverUsername) {
      return res.status(400).json({ message: "You cannot send a gift to yourself." });
    }

    // Create and save the gift
    const newGift = new giftModel({
      sender: senderId,
      receiver: receiver._id,
      giftType,
      message
    });

    await newGift.save();

    res.status(201).json({ message: `Gift sent successfully to ${receiver.username} 🎁`, gift: newGift });

  } catch (error) {
    console.error("Error sending gift:", error);
    res.status(500).json({ message: "An error occurred while sending the gift." });
  }
};
