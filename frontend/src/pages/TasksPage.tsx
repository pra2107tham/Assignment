import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace('/api', '');

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}

const defaultNewTask = {
  title: '',
  description: '',
  priority: 'medium',
  due_date: ''
};

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ ...defaultNewTask });
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editing, setEditing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tasks`, { withCredentials: true });
      setTasks(response.data);
    } catch (err) {
      setError('Failed to load tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;
    if (user && user.id) {
      socket.emit('join', user.id);
    }
    socket.on('task:created', fetchTasks);
    socket.on('task:updated', fetchTasks);
    socket.on('task:deleted', fetchTasks);
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/status`, { status }, { withCredentials: true });
      // No optimistic update; rely on socket event
    } catch (err) {
      setError('Failed to update task status.');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, { withCredentials: true });
      // No optimistic update; rely on socket event
    } catch (err) {
      setError('Failed to delete task.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload = {
        ...newTask,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : undefined
      };
      await axios.post(`${API_URL}/tasks`, payload, { withCredentials: true });
      setShowModal(false);
      setNewTask({ ...defaultNewTask });
      // fetchTasks(); // Will be handled by socket event
    } catch (err) {
      setError('Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditTask({ ...task, due_date: task.due_date ? task.due_date.slice(0, 10) : '' });
    setShowEditModal(true);
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    setEditing(true);
    setError(null);
    try {
      const payload = {
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        due_date: editTask.due_date ? new Date(editTask.due_date).toISOString() : undefined
      };
      await axios.put(`${API_URL}/tasks/${editTask.id}`, payload, { withCredentials: true });
      setShowEditModal(false);
      setEditTask(null);
      // fetchTasks(); // Will be handled by socket event
    } catch (err) {
      setError('Failed to update task.');
    } finally {
      setEditing(false);
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">All Tasks</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          + New Task
        </button>
      </div>
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-3 py-1 rounded ${filter === 'in_progress' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 rounded ${filter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Completed
        </button>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <p className="text-gray-400">No tasks found.</p>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex-1">
                <h3 className="text-white font-medium">{task.title}</h3>
                <p className="text-sm text-gray-400">{task.description}</p>
                <p className="text-xs text-gray-400">
                  Priority: <span className={`font-bold ${task.priority === 'high' ? 'text-red-400' : task.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>{task.priority}</span>
                  {task.due_date && <> | Due: {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}</>}
                </p>
                <p className="text-xs text-gray-400">Status: <span className="font-bold">{task.status.replace('_', ' ')}</span></p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Status change buttons based on current status */}
                {task.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      In Progress
                    </button>
                  </>
                )}
                {task.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'pending')}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      Set Pending
                    </button>
                  </>
                )}
                {/* Completed: only Edit/Delete */}
                <button
                  onClick={() => openEditModal(task)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for creating a new task */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <form
            onSubmit={handleCreateTask}
            className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create New Task</h2>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                required
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Description</label>
              <textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for editing a task */}
      {showEditModal && editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <form
            onSubmit={handleEditTask}
            className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-white mb-4">Edit Task</h2>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={editTask.title}
                onChange={e => setEditTask({ ...editTask, title: e.target.value } as Task)}
                required
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Description</label>
              <textarea
                value={editTask.description}
                onChange={e => setEditTask({ ...editTask, description: e.target.value } as Task)}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Priority</label>
              <select
                value={editTask.priority}
                onChange={e => setEditTask({ ...editTask, priority: e.target.value as 'low' | 'medium' | 'high' } as Task)}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={editTask.due_date || ''}
                onChange={e => setEditTask({ ...editTask, due_date: e.target.value } as Task)}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={editing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={editing}
              >
                {editing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
};

export default TasksPage; 