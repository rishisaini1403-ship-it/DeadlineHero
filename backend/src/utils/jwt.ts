import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (
  token: string
): JwtPayload & { userId: string } => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload & {
    userId: string;
  };
};

export const extractTokenFromHeader = (
  authHeader?: string
): string | null => {
  if (!authHeader) return null;

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};