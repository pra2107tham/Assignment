import { Request, Response } from 'express';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import { Task } from '../types/index.js';
import SocketService from '../services/socketService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError, DatabaseError, ValidationError } from '../errors/AppError.js';

export const createTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, description, priority, due_date } = req.body;
  const userId = req.user!.id;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: userId,
        title,
        description,
        priority,
        due_date,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error creating task', { error });
  }

  // Emit task created event
  SocketService.getInstance().emitTaskCreated(task);

  logger.info('Task created successfully', { taskId: task.id, userId });
  res.status(201).json(task);
});

export const getTasks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError('Error retrieving tasks', { error });
  }

  logger.info('Tasks retrieved successfully', { userId, count: tasks.length });
  res.json(tasks);
});

export const getTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new DatabaseError('Error retrieving task', { error });
  }

  if (!task) {
    throw new NotFoundError(`Task with ID ${id} not found`);
  }

  logger.info('Task retrieved successfully', { taskId: id, userId });
  res.json(task);
});

export const updateTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { title, description, priority, due_date } = req.body;

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ title, description, priority, due_date })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error updating task', { error });
  }

  if (!task) {
    throw new NotFoundError(`Task with ID ${id} not found`);
  }

  // Emit task updated event
  SocketService.getInstance().emitTaskUpdated(task);

  logger.info('Task updated successfully', { taskId: id, userId });
  res.json(task);
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { status } = req.body;

  if (!['pending', 'in_progress', 'completed'].includes(status)) {
    throw new ValidationError('Invalid status value', { 
      status,
      allowedValues: ['pending', 'in_progress', 'completed']
    });
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Error updating task status', { error });
  }

  if (!task) {
    throw new NotFoundError(`Task with ID ${id} not found`);
  }

  // Emit task updated event
  SocketService.getInstance().emitTaskUpdated(task);

  logger.info('Task status updated successfully', { taskId: id, userId, status });
  res.json(task);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new DatabaseError('Error deleting task', { error });
  }

  // Emit task deleted event
  SocketService.getInstance().emitTaskDeleted(id);

  logger.info('Task deleted successfully', { taskId: id, userId });
  res.json({ message: 'Task deleted successfully' });
}); 