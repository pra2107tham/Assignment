import express from 'express';
import { query } from 'express-validator';
import { validateRequest } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getTaskStatistics,
  getTimeStatistics,
  getProductivityMetrics
} from '../controllers/statisticsController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const dateValidation = [
  query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end date format')
];

// Routes
router.get('/tasks', dateValidation, validateRequest, getTaskStatistics);
router.get('/time', dateValidation, validateRequest, getTimeStatistics);
router.get('/productivity', dateValidation, validateRequest, getProductivityMetrics);

export default router; 