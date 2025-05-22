import { Request, Response } from 'express';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import SocketService from '../services/socketService.js';

export const getTaskStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { start_date, end_date } = req.query;

    // Build base query
    let taskQuery = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    // Apply date filters if provided
    if (start_date) {
      taskQuery = taskQuery.gte('created_at', start_date);
    }
    if (end_date) {
      taskQuery = taskQuery.lte('created_at', end_date);
    }

    // Get all tasks
    const { data: tasks, error: tasksError } = await taskQuery;
    if (tasksError) throw tasksError;

    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate tasks by priority
    const tasksByPriority = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length
    };

    // Calculate completion rate by priority
    const completionRateByPriority = {
      high: tasksByPriority.high > 0 
        ? (tasks.filter(task => task.priority === 'high' && task.status === 'completed').length / tasksByPriority.high) * 100 
        : 0,
      medium: tasksByPriority.medium > 0 
        ? (tasks.filter(task => task.priority === 'medium' && task.status === 'completed').length / tasksByPriority.medium) * 100 
        : 0,
      low: tasksByPriority.low > 0 
        ? (tasks.filter(task => task.priority === 'low' && task.status === 'completed').length / tasksByPriority.low) * 100 
        : 0
    };

    const statistics = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      pending_tasks: pendingTasks,
      completion_rate: completionRate,
      tasks_by_priority: tasksByPriority,
      completion_rate_by_priority: completionRateByPriority
    };

    // Emit statistics updated event
    SocketService.getInstance().emitStatisticsUpdated(userId, statistics);

    logger.info('Task statistics retrieved', { userId });
    res.json(statistics);
  } catch (error) {
    logger.error('Error retrieving task statistics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user!.id
    });
    res.status(500).json({ message: 'Error retrieving task statistics' });
  }
};

export const getTimeStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { start_date, end_date } = req.query;

    // Build base query
    let timeQuery = supabase
      .from('time_entries')
      .select(`
        *,
        tasks (
          id,
          title,
          priority,
          status
        )
      `)
      .eq('user_id', userId)
      .not('end_time', 'is', null);

    // Apply date filters if provided
    if (start_date) {
      timeQuery = timeQuery.gte('start_time', start_date);
    }
    if (end_date) {
      timeQuery = timeQuery.lte('end_time', end_date);
    }

    // Get all time entries
    const { data: timeEntries, error: timeError } = await timeQuery;
    if (timeError) throw timeError;

    // Calculate total time spent
    const totalTimeMs = timeEntries.reduce((total, entry) => {
      const start = new Date(entry.start_time);
      const end = new Date(entry.end_time);
      return total + (end.getTime() - start.getTime());
    }, 0);

    // Calculate time spent by priority
    const timeByPriority = timeEntries.reduce((acc, entry) => {
      const priority = entry.tasks.priority;
      const duration = new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime();
      acc[priority] = (acc[priority] || 0) + duration;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average time per task
    const uniqueTasks = new Set(timeEntries.map(entry => entry.task_id));
    const averageTimePerTask = uniqueTasks.size > 0 ? totalTimeMs / uniqueTasks.size : 0;

    // Calculate time distribution by day of week
    const timeByDay = timeEntries.reduce((acc, entry) => {
      const day = new Date(entry.start_time).toLocaleDateString('en-US', { weekday: 'long' });
      const duration = new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime();
      acc[day] = (acc[day] || 0) + duration;
      return acc;
    }, {} as Record<string, number>);

    logger.info('Time statistics retrieved', { userId });
    res.json({
      total_time_ms: totalTimeMs,
      total_time_hours: totalTimeMs / (1000 * 60 * 60),
      time_by_priority: timeByPriority,
      average_time_per_task_ms: averageTimePerTask,
      average_time_per_task_hours: averageTimePerTask / (1000 * 60 * 60),
      time_by_day: timeByDay
    });
  } catch (error) {
    logger.error('Error retrieving time statistics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user!.id
    });
    res.status(500).json({ message: 'Error retrieving time statistics' });
  }
};

export const getProductivityMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { start_date, end_date } = req.query;

    // Get tasks completed in the period
    let taskQuery = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (start_date) {
      taskQuery = taskQuery.gte('updated_at', start_date);
    }
    if (end_date) {
      taskQuery = taskQuery.lte('updated_at', end_date);
    }

    const { data: completedTasks, error: tasksError } = await taskQuery;
    if (tasksError) throw tasksError;

    // Calculate tasks completed per day
    const tasksPerDay = completedTasks.reduce((acc, task) => {
      const day = new Date(task.updated_at).toLocaleDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average tasks per day
    const uniqueDays = Object.keys(tasksPerDay).length;
    const averageTasksPerDay = uniqueDays > 0 
      ? completedTasks.length / uniqueDays 
      : 0;

    // Calculate completion streak
    const dates = Object.keys(tasksPerDay).map(date => new Date(date));
    dates.sort((a, b) => a.getTime() - b.getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
        continue;
      }

      const diffDays = Math.floor((dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Check if the streak is current
    const lastDate = dates[dates.length - 1];
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    currentStreak = diffDays <= 1 ? tempStreak : 0;

    logger.info('Productivity metrics retrieved', { userId });
    res.json({
      total_completed_tasks: completedTasks.length,
      tasks_per_day: tasksPerDay,
      average_tasks_per_day: averageTasksPerDay,
      current_streak: currentStreak,
      longest_streak: longestStreak
    });
  } catch (error) {
    logger.error('Error retrieving productivity metrics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user!.id
    });
    res.status(500).json({ message: 'Error retrieving productivity metrics' });
  }
}; 