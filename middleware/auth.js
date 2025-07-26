const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  console.log('Auth middleware running...');
  
  // Get token from header
  const token = req.header('x-auth-token');
  console.log('Token received:', token ? `${token.substring(0, 10)}...` : 'No token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const jwtSecret = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';
    console.log('Using JWT secret:', jwtSecret.substring(0, 3) + '...');
      const decoded = jwt.verify(token, jwtSecret);
    console.log('Token decoded successfully:', decoded);
    
    // The decoded token can contain user info directly or in a 'user' property
    // Let's handle both cases to be more resilient
    if (decoded.id) {
      // Case 1: id is directly in the payload (preferred format)
      req.user = decoded;
      console.log('Using id directly from token payload');
    } else if (decoded.user && decoded.user.id) {
      // Case 2: id is in a user property
      req.user = decoded.user;
      console.log('Using id from user object in token payload');
    } else {
      // No id found in any expected location
      console.error('Decoded token missing id field:', decoded);
      return res.status(401).json({ msg: 'Invalid token format - missing user id' });
    }
    
    // Double-check that we have a user id
    if (!req.user.id) {
      console.error('req.user missing id after processing:', req.user);
      return res.status(401).json({ msg: 'Invalid token format - missing user id after processing' });
    }
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
