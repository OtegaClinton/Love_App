const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
},
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
},
  giftType: { 
    type: String, 
    required: true 
}, 
  message: { 
    type: String 
}, 
  createdAt: { 
    type: Date, 
    default: Date.now 
}
});

const giftModel = mongoose.model("Gift", giftSchema);

module.exports = giftModel;
