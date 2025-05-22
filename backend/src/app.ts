import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import timeRoutes from './routes/time.js';
import statisticsRoutes from './routes/statistics.js';
import logger from './config/logger.js';
import SocketService from './services/socketService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
SocketService.getInstance().initialize(httpServer);

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow cookies
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.body,
    query: req.query,
    cookies: req.cookies,
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/statistics', statisticsRoutes);

// Basic route for testing
app.get('/', (req: Request, res: Response) => {
  logger.info('Root endpoint accessed');
  res.json({ message: 'Welcome to Personal Task Dashboard API' });
});


const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
}); 