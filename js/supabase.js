// js/supabase.js
const SUPABASE_URL = 'https://rhnmqipfrzmxjuybzhqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobm1xaXBmcnpteGp1eWJ6aHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjAyNjAsImV4cCI6MjA3MzczNjI2MH0.xTIpvfQmqTuDte5BVE1DHEEcntyV1G6IScMatq_YHAE'; // la clave del paso 1

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);