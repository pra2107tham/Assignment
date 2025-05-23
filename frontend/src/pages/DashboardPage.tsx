import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { statisticsService } from '../services/statistics';
import type { TaskStatistics, TimeStatistics, ProductivityMetrics } from '../services/statistics';
import { formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';

const DashboardPage = () => {
  const { user } = useAuth();
  const targetDate = new Date();
  const [isLoading, setIsLoading] = useState(true);
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null);
  const [timeStats, setTimeStats] = useState<TimeStatistics | null>(null);
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [taskData, timeData, productivityData] = await Promise.all([
          statisticsService.getTaskStatistics(targetDate),
          statisticsService.getTimeStatistics(targetDate),
          statisticsService.getProductivityMetrics(targetDate)
        ]);

        setTaskStats(taskData);
        setTimeStats(timeData);
        setProductivityMetrics(productivityData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTimeTracked = (ms: number) => {
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

  const hasProductivityData = productivityMetrics && 
    (productivityMetrics.total_completed_tasks > 0 || 
     Object.keys(productivityMetrics.tasks_per_day).length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name}!</h1>
        <p className="mt-2 text-gray-400">Here's an overview of your tasks and time tracking</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tasks */}
        <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Total Tasks</dt>
                  <dd className="text-lg font-medium text-white">
                    {taskStats?.total_tasks || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Completed Tasks</dt>
                  <dd className="text-lg font-medium text-white">
                    {hasProductivityData ? productivityMetrics?.total_completed_tasks : taskStats?.completed_tasks || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Time Tracked */}
        <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Time Tracked Today</dt>
                  <dd className="text-lg font-medium text-white">
                    {formatTimeTracked(timeStats?.total_time_ms || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Tasks Per Day */}
        <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">Avg Tasks/Day</dt>
                  <dd className="text-lg font-medium text-white">
                    {hasProductivityData ? productivityMetrics?.average_tasks_per_day?.toFixed(1) : '0.0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      {hasProductivityData && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Current Streak */}
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-white mb-2">Current Streak</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          Streak
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-white">
                          {productivityMetrics?.current_streak || 0} days
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                      <div
                        style={{ width: `${(productivityMetrics?.current_streak || 0) * 10}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-white mb-2">Longest Streak</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                          Best Streak
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-white">
                          {productivityMetrics?.longest_streak || 0} days
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                      <div
                        style={{ width: `${(productivityMetrics?.longest_streak || 0) * 10}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Per Day Chart */}
      {hasProductivityData && Object.keys(productivityMetrics?.tasks_per_day || {}).length > 0 && (
        <div className="mt-8">
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg font-medium text-white mb-4">Tasks Completed Per Day</h3>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(productivityMetrics?.tasks_per_day || {}).map(([date, count]) => (
                  <div key={date} className="text-center">
                    <div className="text-sm text-gray-400">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-lg font-medium text-white">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DashboardPage; 