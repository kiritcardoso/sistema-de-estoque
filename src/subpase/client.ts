import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yvaojquxsqzpdjguzfoe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YW9qcXV4c3F6cGRqZ3V6Zm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Mzg5MTUsImV4cCI6MjA2NTIxNDkxNX0.zfN0wpDZJKIxkkSfSDAcSQIdwF32TcbCKkej73o53-g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
