const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'your-secret-key';
})();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRE || '7d';
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};
const verifyToken = (
  token
) => {
  return jwt.verify(token, JWT_SECRET);
};
const extractTokenFromHeader = (
  authHeader
) => {
  if (!authHeader) return null;

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

module.exports = { generateToken, verifyToken, extractTokenFromHeader };
