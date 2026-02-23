const jwt = require('jsonwebtoken');

function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
  if (!secret) throw new Error('JWT_SECRET is missing in .env');

  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing in .env');
  return jwt.verify(token, secret);
}

function getUserFromAuthHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (scheme !== 'Bearer' || !token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

function isAuthRequired() {
  const val = (process.env.AUTH_REQUIRED ?? 'true').toString().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes';
}

module.exports = { signToken, verifyToken, getUserFromAuthHeader, isAuthRequired };
