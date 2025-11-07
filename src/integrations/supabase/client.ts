import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bseizmqiqxqcsvslulqr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZWl6bXFpcXhxY3N2c2x1bHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDc0NTYsImV4cCI6MjA3ODEyMzQ1Nn0.fBdxBiXjGgw1T2VDTjtXvJOPmOMQLwFhz1ZDqfDuuwo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);