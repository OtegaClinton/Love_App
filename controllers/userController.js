const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const reportModel = require("../models/reportModel"); 
const sendMail = require("../helpers/email");

exports.signUp = async (req, res) => {
  try {
    let {
      firstName = '',
      lastName = '',
      username = '',
      email = '',
      password = '',
      confirmPassword = '',
      phoneNumber = '',
      gender = '',
      interestedIn = '',
      hobbies = []
    } = req.body;

    // Check for missing or empty fields
    if (!firstName.trim()) return res.status(400).json({ message: 'First name is required.' });
    if (!lastName.trim()) return res.status(400).json({ message: 'Last name is required.' });
    if (!username.trim()) return res.status(400).json({ message: 'Username is required.' });
    if (!email.trim()) return res.status(400).json({ message: 'Email is required.' });
    if (!password) return res.status(400).json({ message: 'Password is required.' });
    if (!confirmPassword) return res.status(400).json({ message: 'Confirm password is required.' });
    if (!phoneNumber.trim()) return res.status(400).json({ message: 'Phone number is required.' });
    if (!gender.trim()) return res.status(400).json({ message: 'Gender is required.' });
    if (!interestedIn.trim()) return res.status(400).json({ message: 'InterestedIn field is required.' });

    // Trim and sanitize input
    firstName = firstName.trim();
    lastName = lastName.trim();
    username = username.trim();
    email = email.trim().toLowerCase();
    phoneNumber = phoneNumber.trim();
    gender = gender.trim().toLowerCase();
    interestedIn = interestedIn.trim().toLowerCase();

    // Define regex patterns
    const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;  // Allows only letters and spaces, no consecutive spaces
    const usernamePattern = /^(?!.*[_.]{2})[A-Za-z0-9_.]+$/; // Allows letters, numbers, _, . but no consecutive _ or .
    const passwordPattern = /^(?!.*[\W_]{2})(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneNumberPattern = /^\d{11}$/;

    // Validate input
    if (!namePattern.test(firstName)) return res.status(400).json({ message: 'Invalid first name format.' });
    if (!namePattern.test(lastName)) return res.status(400).json({ message: 'Invalid last name format.' });
    if (!usernamePattern.test(username)) return res.status(400).json({ message: 'Invalid username format.' });
    if (!emailPattern.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
    if (!passwordPattern.test(password)) return res.status(400).json({ message: 'Password must be at least 6 characters, contain an uppercase letter, one special character, and no consecutive special characters.' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
    if (!phoneNumberPattern.test(phoneNumber)) return res.status(400).json({ message: 'Phone number must be exactly 11 digits.' });

    // Ensure gender and interestedIn are valid
    const validGenders = ["male", "female", "other"];
    const validInterestedIn = ["male", "female", "both"];
    if (!validGenders.includes(gender)) return res.status(400).json({ message: "Invalid gender value." });
    if (!validInterestedIn.includes(interestedIn)) return res.status(400).json({ message: "Invalid interestedIn value." });

    // Check if user already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { phoneNumber }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ message: 'Email already in use.' });
      if (existingUser.phoneNumber === phoneNumber) return res.status(400).json({ message: 'Phone number already in use.' });
      if (existingUser.username === username) return res.status(400).json({ message: 'Username already in use.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new userModel({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      gender,
      interestedIn,
      hobbies
    });

    // Save the user to the database
    await newUser.save();

    // Generate a JWT token
    const userToken = jwt.sign(
      { id: newUser._id, email: newUser.email, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Construct the verification link
    const verifyLink = `${req.protocol}://${req.get('host')}/api/v1/verify/${newUser._id}/${userToken}`;

    // Generate email template
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; background-color: #fff0f0; padding: 20px; text-align: center; border-radius: 10px;">
        <h2 style="color: #e63946;">❤️ Welcome to MatchMate, ${newUser.firstName}! ❤️</h2>
        <p style="color: #333; font-size: 16px;">
          You've taken the first step toward finding meaningful connections! 💕  
          To unlock the full experience and start matching with amazing people, verify your email by clicking the button below:
        </p>
        <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; font-size: 18px; 
          background-color: #e63946; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          💌 Verify Your Email
        </a>
        <p style="color: #555; font-size: 14px;">
          If you didn’t sign up for MatchMate, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #777; font-size: 14px;">
          &copy; ${new Date().getFullYear()} MatchMate. Where love begins. 💖
        </p>
      </div>
    `;

    // Send verification email
    await sendMail({
      subject: 'Kindly verify your email.',
      to: newUser.email,
      html: emailTemplate
    });

    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        gender: newUser.gender,
        interestedIn: newUser.interestedIn,
        hobbies: newUser.hobbies
      }
    });

  } catch (error) {
    console.error('Error during sign-up:', error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email, phone number, or username already in use.' });
    }

    res.status(500).json({ message: 'An error occurred during sign-up.' });
  }
};




exports.verifyEmail = async (req, res) => {
  try {
    const { id, token } = req.params;

    // Find the user by ID
    const findUser = await userModel.findById(id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // If already verified, notify user
    if (findUser.isVerified) {
      return res.status(200).json({ message: "Your account has already been verified." });
    }

    // Verify the token
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Send a new verification email if the token is expired
      const verifyLink = `${req.protocol}://${req.get("host")}/api/v1/newemail/${findUser._id}`;
      await sendMail({
        subject: "💖 Verify Your Love App Account",
        to: findUser.email,
        html: `
          <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #e63946;">💌 Hello, ${findUser.firstName}! 💌</h2>
            <p>Oops! Your previous verification link has expired. But don't worry, we've got a new one just for you! 🌹</p>
            <p>Click the button below to verify your email and start your journey of love! ❤️</p>
            <a href="${verifyLink}" style="background-color: #e63946; color: white; padding: 12px 24px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; display: inline-block;">
              Verify My Email 💕
            </a>
            <p>Looking forward to seeing you connect with amazing people! 😍</p>
          </div>
        `,
      });

      return res.status(400).json({
        message: "This link has expired. A new verification link has been sent to your email.",
      });
    }

    // Mark user as verified
    findUser.isVerified = true;
    await findUser.save();

    // Success response with auto-redirect to login
    const redirectUrl = "https://love-app.vercel.app/#/Login";
    const successPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - Love App</title>
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #ffe6e6; text-align: center; padding: 50px; }
            .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); display: inline-block; }
            h2 { color: #e63946; }
            p { font-size: 16px; color: #333; }
            a { display: inline-block; padding: 12px 24px; background-color: #e63946; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-size: 16px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🎉 Welcome to Love App, ${findUser.firstName}! 💖</h2>
            <p>Your email has been verified! You’re now ready to explore love and meaningful connections. 💕</p>
            <p>You will be redirected to the login page in <span id="countdown">10</span> seconds.</p>
            <a href="${redirectUrl}">Go to Login 💘</a>
        </div>

        <script>
            let countdown = 10;
            const countdownElement = document.getElementById('countdown');
            setInterval(() => {
                if (countdown > 0) {
                    countdown--;
                    countdownElement.textContent = countdown;
                } else {
                    window.location.href = "${redirectUrl}";
                }
            }, 1000);
        </script>
    </body>
    </html>`;

    res.status(200).send(successPage);
  } catch (error) {
    return res.status(500).json({ message: "An error occurred during verification." });
  }
};




exports.newEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Ensure email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Normalize email (convert to lowercase)
    const normalizedEmail = email.toLowerCase();

    // Find the user by email
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new JWT token
    const userToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Token valid for 24 hours
    );

    // Create the verification link
    const reverifyLink = `${req.protocol}://${req.get("host")}/api/v1/verify/${user._id}/${userToken}`;

    // Love-themed email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - LoveMatch</title>
          <style>
              body { font-family: 'Arial', sans-serif; background-color: #fff0f5; text-align: center; padding: 50px; }
              .container { background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); display: inline-block; }
              h2 { color: #e63946; font-size: 24px; }
              p { font-size: 16px; color: #333; }
              .love-button {
                  display: inline-block;
                  padding: 12px 25px;
                  background-color: #e63946;
                  color: white;
                  text-decoration: none;
                  border-radius: 50px;
                  font-weight: bold;
                  font-size: 18px;
                  margin-top: 20px;
                  transition: 0.3s ease-in-out;
              }
              .love-button:hover {
                  background-color: #d62839;
                  transform: scale(1.05);
              }
              .footer {
                  margin-top: 20px;
                  font-size: 14px;
                  color: #888;
              }
              .heart {
                  color: #e63946;
                  font-size: 24px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>💖 Verify Your LoveMatch Account 💖</h2>
              <p>Hello ${user.firstName},</p>
              <p>Your previous verification link has expired. Click the button below to verify your email and start your love journey! ❤️</p>
              <a href="${reverifyLink}" class="love-button">Verify My Email</a>
              <p class="footer">Love is in the air! &copy; ${new Date().getFullYear()} LoveMatch. All rights reserved.</p>
          </div>
      </body>
      </html>
    `;

    // Send the email
    await sendMail({
      subject: "Verify Your Email Again - LoveMatch ❤️",
      to: user.email,
      html: emailHtml,
    });

    // Response
    res.status(200).json({
      message: "A new verification email has been sent. Please check your inbox ❤️",
    });

  } catch (error) {
    res.status(500).json({ message: "An error occurred while sending the email." });
  }
};




exports.logIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: "Password is required." });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Ensure user is verified before allowing login
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email to log in." });
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove sensitive data before sending response
    const { password: _, ...userData } = user.toObject();

    return res.status(200).json({
      message: "Login successful.",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "An error occurred during login." });
  }
};




exports.getUsersByInterest = async (req, res) => {
  try {
    // Get user ID from token (set by the authenticator middleware)
    const loggedInUserId = req.user.id;

    // Get the filter option from the query parameter (male, female, or both)
    const { interestedIn } = req.query;

    // Validate input
    if (!interestedIn || !["male", "female", "both"].includes(interestedIn.toLowerCase())) {
      return res.status(400).json({ message: "Invalid filter. Choose 'male', 'female', or 'both'." });
    }

    // Find the logged-in user's details
    const loggedInUser = await userModel.findById(loggedInUserId);
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Define query based on interestedIn filter
    let filter = {};
    if (interestedIn.toLowerCase() === "both") {
      filter = { gender: { $in: ["male", "female"] } };
    } else {
      filter = { gender: interestedIn.toLowerCase() };
    }

    // Exclude the logged-in user from the results
    filter._id = { $ne: loggedInUserId };

    // Query the database
    const matchedUsers = await userModel.find(filter).select("-password");

    res.status(200).json({
      message: `Users interested in ${interestedIn} found.`,
      users: matchedUsers,
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "An error occurred while fetching users." });
  }
};




exports.getUsersByHobbies = async (req, res) => {
  try {
    const { hobbies } = req.query; 
    const userId = req.user.id; 

    if (!hobbies || hobbies.length === 0) {
      return res.status(400).json({ message: "Please provide at least one hobby to search." });
    }

    // Convert hobbies to an array (if not already)
    const hobbiesArray = Array.isArray(hobbies) ? hobbies : hobbies.split(",");

    // Find users with at least one matching hobby, excluding the logged-in user
    const users = await userModel.find({
      hobbies: { $in: hobbiesArray }, // Matches users with any of the provided hobbies
      _id: { $ne: userId }, // Exclude the logged-in user
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found with the specified hobbies." });
    }

    res.status(200).json({ message: "Users fetched successfully.", data: users });
  } catch (error) {
    console.error("Error fetching users by hobbies:", error);
    res.status(500).json({ message: "An error occurred while fetching users." });
  }
};



exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id; 

    // Find user by ID and exclude password from the response
    const user = await userModel.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User details fetched successfully.", data: user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "An error occurred while fetching user details." });
  }
};




exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id; 

    // Find and delete the user
    const deletedUser = await userModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "An error occurred while deleting the account." });
  }
};




exports.reportUser = async (req, res) => {
  try {
    const reporterId = req.user.id; 
    const { reportedUserId, reason, details } = req.body;

    // Validate input
    if (!reportedUserId) {
      return res.status(400).json({ message: "Reported user ID is required." });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason for reporting is required." });
    }

    // Check if the reported user exists
    const reportedUser = await userModel.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: "User to be reported not found." });
    }

    // Prevent self-reporting
    if (reporterId === reportedUserId) {
      return res.status(400).json({ message: "You cannot report yourself." });
    }

    // Create the report
    const newReport = new reportModel({
      reporter: reporterId,
      reportedUser: reportedUserId,
      reason: reason.trim(),
      details: details ? details.trim() : "",
    });

    // Save report to the database
    await newReport.save();

    res.status(201).json({ message: "Profile reported successfully. Our team will review the report." });
  } catch (error) {
    console.error("Error reporting user:", error);
    res.status(500).json({ message: "An error occurred while reporting the profile." });
  }
};
