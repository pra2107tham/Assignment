import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';
import logger from '../config/logger.js';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // First try to get token from cookie
  const token = req.cookies.auth_token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = decoded;
    logger.debug('Token verified successfully', {
      userId: decoded.id,
      email: decoded.email,
    });
    next();
  } catch (error) {
    logger.error('Authentication failed: Invalid token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
    });
    res.status(403).json({ message: 'Invalid token.' });
  }
}; 