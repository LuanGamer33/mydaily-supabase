
const SUPABASE_URL = 'https://rhnmqipfrzmxjuybzhqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobm1xaXBmcnpteGp1eWJ6aHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjAyNjAsImV4cCI6MjA3MzczNjI2MH0.xTIpvfQmqTuDte5BVE1DHEEcntyV1G6IScMatq_YHAE';

// Crear y exportar cliente
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ayudante para obtener usuario actual (utilidad compartida)
export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}