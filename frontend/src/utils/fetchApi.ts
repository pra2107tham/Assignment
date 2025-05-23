import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for handling cookies
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Main fetchApi function
export const fetchApi = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await api(url, config);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Resource not found');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied');
      }
      if (error.response?.status === 500) {
        throw new Error('Internal server error');
      }
      // Throw the error message from the server if available
      throw new Error(error.response?.data?.message || error.message);
    }
    // Handle non-axios errors
    throw error;
  }
}; 