const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", required: true 
    },
    reportedUser: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", required: true 
    },
    reason: { 
        type: String, 
        required: true 
    },
    details: { 
        type: String 
    },
    status: { 
        type: String, 
        enum: ["pending", "reviewed", "resolved"], 
        default: "pending" }, 
  },
  { timestamps: true }
);

const reportModel = mongoose.model("Report", reportSchema);

module.exports = reportModel
