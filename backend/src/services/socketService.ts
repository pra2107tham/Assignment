import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../config/logger.js';

class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Join user's room for private messages
      socket.on('join', (userId: string) => {
        socket.join(`user_${userId}`);
        logger.info('User joined room', { userId, socketId: socket.id });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });

    logger.info('Socket.IO server initialized');
  }

  // Task events
  public emitTaskCreated(task: any): void {
    if (!this.io) return;
    this.io.to(`user_${task.user_id}`).emit('task:created', task);
    logger.debug('Task created event emitted', { taskId: task.id });
  }

  public emitTaskUpdated(task: any): void {
    if (!this.io) return;
    this.io.to(`user_${task.user_id}`).emit('task:updated', task);
    logger.debug('Task updated event emitted', { taskId: task.id });
  }

  public emitTaskDeleted(taskId: string): void {
    if (!this.io) return;
    this.io.emit('task:deleted', { taskId });
    logger.debug('Task deleted event emitted', { taskId });
  }

  // Time tracking events
  public emitTimeTrackingStarted(timeEntry: any): void {
    if (!this.io) return;
    this.io.to(`user_${timeEntry.user_id}`).emit('time:started', timeEntry);
    logger.debug('Time tracking started event emitted', { timeEntryId: timeEntry.id });
  }

  public emitTimeTrackingStopped(timeEntry: any): void {
    if (!this.io) return;
    this.io.to(`user_${timeEntry.user_id}`).emit('time:stopped', timeEntry);
    logger.debug('Time tracking stopped event emitted', { timeEntryId: timeEntry.id });
  }

  // Statistics events
  public emitStatisticsUpdated(userId: string, statistics: any): void {
    if (!this.io) return;
    this.io.to(`user_${userId}`).emit('statistics:updated', statistics);
    logger.debug('Statistics updated event emitted', { userId });
  }
}

export default SocketService; 