const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

// Middleware function to authenticate users
exports.authenticateUser = async (req, res, next) => {
  try {
    // Log incoming request headers for debugging
    console.log('Request Headers:', req.headers);

    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header'); // Debug log
      return res.status(401).json({ success: false, error: 'Authorization header is missing' });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      console.error('Token not provided'); // Debug log
      return res.status(401).json({ success: false, error: 'No token provided, authorization denied' });
    }

    // Verify the token using the secret key
    console.log('Verifying token:', token); // Debug log
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user associated with the token
    console.log('Decoded token:', decoded); // Debug log
    const user = await User.findById(decoded.id).select('-password'); // Exclude password
    if (!user) {
      console.error('User not found for token:', decoded.id); // Debug log
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Attach user information to the request object
    console.log('Authenticated user:', user); // Debug log
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Authentication error:', error.message); // Debug log

    // Handle specific token errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Handle generic errors
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
};
