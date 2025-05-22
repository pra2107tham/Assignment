import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials');
  throw new Error('Missing Supabase credentials');
}

logger.info('Initializing Supabase client');
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 