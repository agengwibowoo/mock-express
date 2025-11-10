const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Token blacklist reference (will be set by the main app)
let tokenBlacklist = null;

/**
 * Set the token blacklist reference
 * @param {Set} blacklist - The token blacklist Set
 */
const setTokenBlacklist = (blacklist) => {
  tokenBlacklist = blacklist;
};

/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header and checks blacklist
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Check if token is blacklisted (logged out)
    if (tokenBlacklist && tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired or been invalidated'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user information to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
module.exports.setTokenBlacklist = setTokenBlacklist;

