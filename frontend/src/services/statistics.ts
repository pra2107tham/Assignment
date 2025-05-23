import axios from 'axios';
import { startOfDay, endOfDay } from 'date-fns';

export interface TaskStatistics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  tasks_by_priority: {
    high: number;
    medium: number;
    low: number;
  };
  completion_rate_by_priority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface TimeStatistics {
  total_time_ms: number;
  total_time_hours: number;
  time_by_priority: {
    [key: string]: number;
  };
  average_time_per_task_ms: number;
  average_time_per_task_hours: number;
  time_by_day: {
    [key: string]: number;
  };
}

export interface ProductivityMetrics {
  total_completed_tasks: number;
  tasks_per_day: {
    [date: string]: number;
  };
  average_tasks_per_day: number;
  current_streak: number;
  longest_streak: number;
}

const API_URL = 'http://localhost:3000/api';

export const statisticsService = {
  async getTaskStatistics(date: Date = new Date()): Promise<TaskStatistics> {
    const params = new URLSearchParams({
      start_date: startOfDay(date).toISOString(),
      end_date: endOfDay(date).toISOString()
    });
    const response = await axios.get(`${API_URL}/statistics/tasks?${params}`, {
      withCredentials: true
    });
    return response.data;
  },

  async getTimeStatistics(date: Date = new Date()): Promise<TimeStatistics> {
    const params = new URLSearchParams({
      start_date: startOfDay(date).toISOString(),
      end_date: endOfDay(date).toISOString()
    });
    const response = await axios.get(`${API_URL}/statistics/time?${params}`, {
      withCredentials: true
    });
    return response.data;
  },

  async getProductivityMetrics(date: Date = new Date()): Promise<ProductivityMetrics> {
    try {
      // For productivity metrics, we want to look at a longer period to calculate streaks
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - 30); // Look back 30 days for streak calculation
      
      const params = new URLSearchParams({
        start_date: startOfDay(startDate).toISOString(),
        end_date: new Date().toISOString() // Use current timestamp for end_date
      });
      
      const response = await axios.get(`${API_URL}/statistics/productivity?${params}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      // If there's an error (like no tasks), return default values
      return {
        total_completed_tasks: 0,
        tasks_per_day: {},
        average_tasks_per_day: 0,
        current_streak: 0,
        longest_streak: 0
      };
    }
  }
}; 