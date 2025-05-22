import express from 'express';
import { param, query } from 'express-validator';
import { validateRequest } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  startTimeTracking,
  stopTimeTracking,
  getTimeEntries,
  getTimeReport
} from '../controllers/timeController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const taskIdValidation = [
  param('task_id').isUUID().withMessage('Invalid task ID')
];

const dateValidation = [
  query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end date format')
];

// Routes
router.post('/tasks/:task_id/start', taskIdValidation, validateRequest, startTimeTracking);
router.post('/tasks/:task_id/stop', taskIdValidation, validateRequest, stopTimeTracking);
router.get('/tasks/:task_id/entries', taskIdValidation, validateRequest, getTimeEntries);
router.get('/report', dateValidation, validateRequest, getTimeReport);

export default router; 