import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { User, JWTPayload } from '../types/index.js';
import logger from '../config/logger.js';

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: false, // Set to false for development
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      logger.error('Error fetching current user:', { error });
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Error in getCurrentUser:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ message: 'Error fetching current user' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    logger.info('Registration attempt', { email, name });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      logger.warn('Registration failed: User already exists', { email });
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    logger.debug('Password hashed successfully');

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          name
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error('Database error during registration', { error });
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email } as JWTPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    logger.debug('JWT token generated for new user');

    // Set auth cookie
    setAuthCookie(res, token);

    logger.info('User registered successfully', { userId: user.id, email: user.email });
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    logger.error('Registration error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    logger.info('Login attempt', { email });

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      logger.warn('Login failed: User not found', { email });
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      logger.warn('Login failed: Invalid password', { email });
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email } as JWTPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    logger.debug('JWT token generated for login');

    // Set auth cookie
    setAuthCookie(res, token);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    logger.error('Login error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('auth_token');
  logger.info('User logged out');
  res.json({ message: 'Logged out successfully' });
  return;
}; 