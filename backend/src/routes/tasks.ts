import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} from '../controllers/taskController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const taskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority level'),
  body('due_date').optional().isISO8601().withMessage('Invalid date format')
];

const statusValidation = [
  param('id').isUUID().withMessage('Invalid task ID'),
  body('status').isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status')
];

// Routes
router.post('/', taskValidation, validateRequest, createTask);
router.get('/', getTasks);
router.get('/:id', param('id').isUUID().withMessage('Invalid task ID'), validateRequest, getTask);
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid task ID'),
  ...taskValidation
], validateRequest, updateTask);
router.patch('/:id/status', statusValidation, validateRequest, updateTaskStatus);
router.delete('/:id', param('id').isUUID().withMessage('Invalid task ID'), validateRequest, deleteTask);

export default router; 