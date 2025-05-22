import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import logger from '../config/logger.js';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation error:', {
      errors: errors.array(),
      path: req.path,
      method: req.method
    });
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
}; 