const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phoneNumber: { 
    type: String, 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ["male", "female", "other"], 
    required: true 
  },
  interestedIn: { 
    type: String, 
    enum: ["male", "female", "both"], 
    required: true 
  },
  hobbies: [{ 
    type: String 
  }],
  isVerified: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const userModel = mongoose.model("User", UserSchema);

module.exports = userModel;
