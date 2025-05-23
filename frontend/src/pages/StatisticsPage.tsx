import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { statisticsService } from '../services/statistics';
import type { TaskStatistics, TimeStatistics, ProductivityMetrics } from '../services/statistics';

const StatisticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null);
  const [timeStats, setTimeStats] = useState<TimeStatistics | null>(null);
  const [productivity, setProductivity] = useState<ProductivityMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const [task, time, prod] = await Promise.all([
          statisticsService.getTaskStatistics(),
          statisticsService.getTimeStatistics(),
          statisticsService.getProductivityMetrics()
        ]);
        setTaskStats(task);
        setTimeStats(time);
        setProductivity(prod);
      } catch (err) {
        setError('Failed to load statistics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Statistics</h1>
        <p className="mt-2 text-gray-400">Your productivity and time tracking analytics</p>
      </div>

      {/* Task Statistics */}
      {taskStats && (
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-800 shadow rounded-lg p-5">
            <h2 className="text-lg font-semibold text-white mb-2">Tasks</h2>
            <ul className="text-gray-300 space-y-1">
              <li>Total: <span className="text-white font-bold">{taskStats.total_tasks}</span></li>
              <li>Completed: <span className="text-green-400 font-bold">{taskStats.completed_tasks}</span></li>
              <li>In Progress: <span className="text-yellow-400 font-bold">{taskStats.in_progress_tasks}</span></li>
              <li>Pending: <span className="text-red-400 font-bold">{taskStats.pending_tasks}</span></li>
              <li>Completion Rate: <span className="text-white font-bold">{(taskStats.completion_rate * 100).toFixed(1)}%</span></li>
            </ul>
            <div className="mt-4">
              <h3 className="text-md text-gray-400 mb-1">By Priority</h3>
              <ul className="text-gray-300 text-sm">
                <li>High: {taskStats.tasks_by_priority.high} ({(taskStats.completion_rate_by_priority.high * 100).toFixed(1)}%)</li>
                <li>Medium: {taskStats.tasks_by_priority.medium} ({(taskStats.completion_rate_by_priority.medium * 100).toFixed(1)}%)</li>
                <li>Low: {taskStats.tasks_by_priority.low} ({(taskStats.completion_rate_by_priority.low * 100).toFixed(1)}%)</li>
              </ul>
            </div>
          </div>

          {/* Time Statistics */}
          {timeStats && (
            <div className="bg-gray-800 shadow rounded-lg p-5">
              <h2 className="text-lg font-semibold text-white mb-2">Time</h2>
              <ul className="text-gray-300 space-y-1">
                <li>Total Tracked: <span className="text-white font-bold">{formatDuration(timeStats.total_time_ms)}</span></li>
                <li>Avg. per Task: <span className="text-white font-bold">{formatDuration(timeStats.average_time_per_task_ms)}</span></li>
              </ul>
              <div className="mt-4">
                <h3 className="text-md text-gray-400 mb-1">By Priority</h3>
                <ul className="text-gray-300 text-sm">
                  {Object.entries(timeStats.time_by_priority).map(([priority, ms]) => (
                    <li key={priority}>{priority}: {formatDuration(ms)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Productivity Metrics */}
          {productivity && (
            <div className="bg-gray-800 shadow rounded-lg p-5">
              <h2 className="text-lg font-semibold text-white mb-2">Productivity</h2>
              <ul className="text-gray-300 space-y-1">
                <li>Total Completed: <span className="text-white font-bold">{productivity.total_completed_tasks}</span></li>
                <li>Avg. per Day: <span className="text-white font-bold">{productivity.average_tasks_per_day.toFixed(2)}</span></li>
                <li>Current Streak: <span className="text-green-400 font-bold">{productivity.current_streak}</span></li>
                <li>Longest Streak: <span className="text-blue-400 font-bold">{productivity.longest_streak}</span></li>
              </ul>
              <div className="mt-4">
                <h3 className="text-md text-gray-400 mb-1">Tasks per Day (last 30d)</h3>
                <ul className="text-gray-300 text-sm max-h-32 overflow-y-auto">
                  {Object.entries(productivity.tasks_per_day).map(([date, count]) => (
                    <li key={date}>{date}: {count}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatisticsPage; 