import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const userAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    let token;
    if (authHeader) {
      // Remove possible colon after Bearer (case-insensitive)
      const cleaned = authHeader.replace(/^Bearer:?/i, '').trim();
      token = cleaned.length > 0 ? cleaned : undefined;
    }

    // console.log(token);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token Not Found'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user info to request
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 