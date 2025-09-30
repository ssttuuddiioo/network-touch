import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// SETUP INSTRUCTIONS:
// 1. Go to https://supabase.com and create a new project
// 2. Go to Settings > API in your Supabase dashboard
// 3. Copy your Project URL and anon/public key
// 4. Replace the values below with your actual credentials

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dkblpgulxnaczvfnjcwf.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYmxwZ3VseG5hY3p2Zm5qY3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzM0NDMsImV4cCI6MjA3MjAwOTQ0M30.8tSH-Li9dbVIHaXuVm-RH1DlQFlhmIKvfMFVd3TbIs4';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Table name for companies
export const COMPANIES_TABLE = 'companies';
// Table name for stakeholders
export const STAKEHOLDERS_TABLE = 'stakeholders';

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseKey !== 'your-anon-key-here' &&
         supabaseUrl && 
         supabaseKey;
};
