import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TimeEntry {
  id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
}

interface TimeReport {
  total_time_ms: number;
  time_by_task: {
    [taskId: string]: {
      task_title: string;
      total_time_ms: number;
    };
  };
  time_by_day: {
    [date: string]: number;
  };
}

const API_URL = 'http://localhost:3000/api';

const TimeTrackingPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [timeReport, setTimeReport] = useState<TimeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchTimeReport();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        withCredentials: true
      });
      setTasks(response.data);
      // Find active time entry
      const active = await findActiveTimeEntry(response.data);
      setActiveTaskId(active?.task_id || null);
    } catch (error) {
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeReport = async () => {
    try {
      const response = await axios.get(`${API_URL}/time/report`, {
        withCredentials: true
      });
      setTimeReport(response.data);
    } catch (error) {
      setError('Failed to load time report');
    }
  };

  const fetchTimeEntries = async (taskId: string) => {
    try {
      const response = await axios.get(`${API_URL}/time/tasks/${taskId}/entries`, {
        withCredentials: true
      });
      // Calculate duration_ms for each entry
      const entries = response.data.map((entry: any) => {
        let duration_ms = null;
        if (entry.start_time && entry.end_time) {
          duration_ms = new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime();
        } else if (entry.start_time && !entry.end_time) {
          duration_ms = Date.now() - new Date(entry.start_time).getTime();
        }
        return { ...entry, duration_ms };
      });
      setTimeEntries(entries);
    } catch (error) {
      setError('Failed to load time entries');
    }
  };

  const findActiveTimeEntry = async (tasks: Task[]) => {
    for (const task of tasks) {
      const response = await axios.get(`${API_URL}/time/tasks/${task.id}/entries`, {
        withCredentials: true
      });
      const entries: TimeEntry[] = response.data;
      const active = entries.find(e => !e.end_time);
      if (active) return active;
    }
    return null;
  };

  const startTimeTracking = async (taskId: string) => {
    setLoadingTaskId(taskId);
    try {
      await axios.post(`${API_URL}/time/tasks/${taskId}/start`, {}, {
        withCredentials: true
      });
      setActiveTaskId(taskId);
      fetchTimeEntries(taskId);
      fetchTimeReport();
    } catch (error) {
      setError('Failed to start time tracking');
    } finally {
      setLoadingTaskId(null);
    }
  };

  const stopTimeTracking = async (taskId: string) => {
    setLoadingTaskId(taskId);
    try {
      await axios.post(`${API_URL}/time/tasks/${taskId}/stop`, {}, {
        withCredentials: true
      });
      setActiveTaskId(null);
      fetchTimeEntries(taskId);
      fetchTimeReport();
    } catch (error) {
      setError('Failed to stop time tracking');
    } finally {
      setLoadingTaskId(null);
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Time Tracking</h1>
        <p className="mt-2 text-gray-400">Track your time spent on tasks. Only one task can be tracked at a time.</p>
      </div>

      {/* Time Report Summary */}
      {timeReport && (
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Total Time Tracked</dt>
                    <dd className="text-lg font-medium text-white">
                      {formatDuration(timeReport.total_time_ms)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task List with Time Tracking */}
      <div className="bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-white mb-4">Tasks</h2>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id}>
                <div
                  className={`flex items-center justify-between p-4 rounded-lg ${activeTaskId === task.id ? 'bg-green-900' : 'bg-gray-700'}`}
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-400">Status: {task.status}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {activeTaskId === task.id ? (
                      <button
                        onClick={() => stopTimeTracking(task.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        disabled={loadingTaskId === task.id}
                      >
                        {loadingTaskId === task.id ? 'Stopping...' : 'Stop Tracking'}
                      </button>
                    ) : (
                      <button
                        onClick={() => startTimeTracking(task.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        disabled={!!activeTaskId || loadingTaskId === task.id}
                      >
                        {loadingTaskId === task.id ? 'Starting...' : 'Start Tracking'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        fetchTimeEntries(task.id);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {selectedTaskId === task.id ? 'Hide Entries' : 'View Entries'}
                    </button>
                  </div>
                </div>
                {/* Inline time entries for this task */}
                {selectedTaskId === task.id && (
                  <div className="mb-4 bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-semibold text-white">Time Entries</h4>
                      <button
                        onClick={() => {
                          setSelectedTaskId(null);
                          setTimeEntries([]);
                        }}
                        className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                      >
                        Close
                      </button>
                    </div>
                    <div className="space-y-2">
                      {timeEntries.length === 0 ? (
                        <p className="text-gray-400">No entries found.</p>
                      ) : (
                        timeEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-2 bg-gray-800 rounded"
                          >
                            <div className="flex-1">
                              <p className="text-white text-sm">
                                Start: {format(new Date(entry.start_time), 'PPp')}
                              </p>
                              {entry.end_time ? (
                                <p className="text-white text-sm">
                                  End: {format(new Date(entry.end_time), 'PPp')}
                                </p>
                              ) : (
                                <p className="text-yellow-400 text-sm">In Progress</p>
                              )}
                            </div>
                            <div className="text-white text-sm">
                              Duration: {entry.duration_ms !== null ? formatDuration(entry.duration_ms) : '—'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TimeTrackingPage; 