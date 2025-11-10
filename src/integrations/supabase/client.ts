import { createClient } from '@supabase/supabase-js';

// Directly using the provided Supabase URL and anonymous key
const supabaseUrl = 'https://bseizmqiqxqcsvslulqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZWl6bXFpcXhxY3N2c2x1bHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDc0NTYsImV4cCI6MjA3ODEyMzQ1Nn0.fBdxBiXjGgw1T2VDTjtXvJOPmOMQLwFhz1ZDqfDuuwo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);