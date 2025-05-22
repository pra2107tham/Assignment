import { Request, Response } from 'express';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import { Task } from '../types/index.js';
import SocketService from '../services/socketService.js';

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
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
      logger.error('Error creating task', { error });
      res.status(500).json({ error: 'Error creating task' });
      return;
    }

    // Emit task created event
    SocketService.getInstance().emitTaskCreated(task);

    logger.info('Task created successfully', { taskId: task.id, userId });
    res.status(201).json(task);
  } catch (error) {
    logger.error('Unexpected error in createTask', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error retrieving tasks', { error });
      res.status(500).json({ error: 'Error retrieving tasks' });
      return;
    }

    logger.info('Tasks retrieved successfully', { userId, count: tasks.length });
    res.json(tasks);
  } catch (error) {
    logger.error('Unexpected error in getTasks', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Error retrieving task', { error });
      res.status(500).json({ error: 'Error retrieving task' });
      return;
    }

    if (!task) {
      res.status(404).json({ error: `Task with ID ${id} not found` });
      return;
    }

    logger.info('Task retrieved successfully', { taskId: id, userId });
    res.json(task);
  } catch (error) {
    logger.error('Unexpected error in getTask', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
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
      logger.error('Error updating task', { error });
      res.status(500).json({ error: 'Error updating task' });
      return;
    }

    if (!task) {
      res.status(404).json({ error: `Task with ID ${id} not found` });
      return;
    }

    // Emit task updated event
    SocketService.getInstance().emitTaskUpdated(task);

    logger.info('Task updated successfully', { taskId: id, userId });
    res.json(task);
  } catch (error) {
    logger.error('Unexpected error in updateTask', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      res.status(400).json({ 
        error: 'Invalid status value',
        allowedValues: ['pending', 'in_progress', 'completed']
      });
      return;
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating task status', { error });
      res.status(500).json({ error: 'Error updating task status' });
      return;
    }

    if (!task) {
      res.status(404).json({ error: `Task with ID ${id} not found` });
      return;
    }

    // Emit task updated event
    SocketService.getInstance().emitTaskUpdated(task);

    logger.info('Task status updated successfully', { taskId: id, userId, status });
    res.json(task);
  } catch (error) {
    logger.error('Unexpected error in updateTaskStatus', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error deleting task', { error });
      res.status(500).json({ error: 'Error deleting task' });
      return;
    }

    // Emit task deleted event
    SocketService.getInstance().emitTaskDeleted(id);

    logger.info('Task deleted successfully', { taskId: id, userId });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Unexpected error in deleteTask', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}; 