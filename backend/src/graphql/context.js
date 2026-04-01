const jwt = require('jsonwebtoken');

const getUser = (token) => {
  if (!token) return null;

  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

const context = ({ req }) => {
  // Get token from Authorization header
  const token = req.headers.authorization || '';
  const user = getUser(token);

  return { user };
};

module.exports = context;
