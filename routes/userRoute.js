const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController"); 
const { authenticator } = require("../middlewares/authentication");

// User Sign-up Route
router.post("/signup", userController.signUp);

// User Login Route (Add this)
router.post("/login", userController.logIn);

// Route for verifying email
router.get("/verify/:id/:token", userController.verifyEmail);

// Route to resend email verification
router.post("/newemail", userController.newEmail);

// Route to fetch users based on interestedIn
router.get("/users", authenticator, userController.getUsersByInterest);

// Route to fetch users based on hobbies
router.get("/users-by-hobbies", authenticator, userController.getUsersByHobbies);

// Route to fetch users details
router.get("/user/:id?", authenticator, userController.getUserDetails);

// Route to delete user account or profile 
router.delete("/user/delete", authenticator, userController.deleteUserAccount);

// Route to report a user 
router.post("/report", authenticator, userController.reportUser);




module.exports = router;
