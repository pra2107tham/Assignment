import { Request, Response } from 'express';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import SocketService from '../services/socketService.js';

export const startTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_id } = req.params;
    const userId = req.user!.id;

    // Check if task exists and belongs to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', task_id)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check if there's already an active time entry
    const { data: activeEntry, error: activeError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (activeEntry) {
      res.status(400).json({ message: 'Time tracking already started for this task' });
      return;
    }

    // Create new time entry
    const startTime = new Date().toISOString();
    const { data: timeEntry, error: createError } = await supabase
      .from('time_entries')
      .insert([
        {
          task_id,
          user_id: userId,
          start_time: startTime
        }
      ])
      .select()
      .single();

    if (createError) throw createError;

    // Emit time tracking started event
    SocketService.getInstance().emitTimeTrackingStarted(timeEntry);

    logger.info('Time tracking started', { taskId: task_id, userId });
    res.json(timeEntry);
  } catch (error) {
    logger.error('Error starting time tracking:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.task_id,
      userId: req.user!.id
    });
    res.status(500).json({ message: 'Error starting time tracking' });
  }
};

export const stopTimeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_id } = req.params;
    const userId = req.user!.id;

    // Find active time entry
    const { data: timeEntry, error: findError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (findError || !timeEntry) {
      res.status(404).json({ message: 'No active time tracking found for this task' });
      return;
    }

    // Update time entry with end time
    const endTime = new Date().toISOString();
    const { data: updatedEntry, error: updateError } = await supabase
      .from('time_entries')
      .update({ end_time: endTime })
      .eq('id', timeEntry.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Emit time tracking stopped event
    SocketService.getInstance().emitTimeTrackingStopped(updatedEntry);

    logger.info('Time tracking stopped', { taskId: task_id, userId });
    res.json(updatedEntry);
  } catch (error) {
    logger.error('Error stopping time tracking:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.task_id,
      userId: req.user!.id
    });
    res.status(500).json({ message: 'Error stopping time tracking' });
  }
};

export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_id } = req.params;
    const userId = req.user!.id;

    // Check if task exists and belongs to user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', task_id)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Get all time entries for the task
    const { data: timeEntries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (entriesError) throw entriesError;

    logger.info('Time entries retrieved', { taskId: task_id, userId, count: timeEntries.length });
    res.json(timeEntries);
  } catch (error) {
    logger.error('Error retrieving time entries:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.task_id,
      userId: req.user!.id
    });
    res.status(500).json({ message: 'Error retrieving time entries' });
  }
};

export const getTimeReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('time_entries')
      .select(`
        *,
        tasks (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .not('end_time', 'is', null);

    if (start_date) {
      query = query.gte('start_time', start_date);
    }
    if (end_date) {
      query = query.lte('end_time', end_date);
    }

    const { data: timeEntries, error } = await query.order('start_time', { ascending: false });

    if (error) throw error;

    // Calculate total time spent
    const totalTime = timeEntries.reduce((total, entry) => {
      const start = new Date(entry.start_time);
      const end = new Date(entry.end_time);
      return total + (end.getTime() - start.getTime());
    }, 0);

    logger.info('Time report generated', { userId, entryCount: timeEntries.length });
    res.json({
      time_entries: timeEntries,
      total_time_ms: totalTime,
      total_time_hours: totalTime / (1000 * 60 * 60)
    });
  } catch (error) {
    logger.error('Error generating time report:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user!.id
    });
    res.status(500).json({ message: 'Error generating time report' });
  }
}; 