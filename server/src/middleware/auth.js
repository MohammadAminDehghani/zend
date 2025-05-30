const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user data to request
    req.user = decoded;
    req.headers['x-user-id'] = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = authMiddleware; 