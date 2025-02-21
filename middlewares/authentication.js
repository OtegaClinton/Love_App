const jwt = require('jsonwebtoken');

exports.authenticator = async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token provided or invalid token format. Authorization denied." });
        }
        
        const token = authHeader.split(" ")[1];

        // Verify the token
        const data = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user data to request object
        req.user = data; // You can access req.user in subsequent middleware/controllers

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: "Invalid token. Authentication failed." });
        }
        // Log the error for debugging purposes
        console.error('Authentication Error:', error);
        res.status(500).json({ message: error.message });
    }
};


