const jwt = require('jsonwebtoken');
const User = require('../models/User');  // User model
const BlacklistedToken = require('../models/BlacklistedToken');  // Token blacklist model
const secretKey = process.env.JWT_SECRET || 'your-secret-key';  // Fallback to hardcoded key if env var is missing

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header contains Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];  // Extract token from header

      // Check if the token is blacklisted
      const blacklisted = await BlacklistedToken.findOne({ token });
      if (blacklisted) {
        return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
      }

      // Verify the token
      const decoded = jwt.verify(token, secretKey);

      // Fetch user details and attach to request object
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      next();  // Proceed to the next middleware or route
    } catch (error) {
      console.error('Authentication error:', error.message);

      // Handle specific token errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please log in again.' });
      }
      res.status(401).json({ error: 'Invalid token. Authorization denied.' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized, no token provided.' });
  }
};

module.exports = { protect };
