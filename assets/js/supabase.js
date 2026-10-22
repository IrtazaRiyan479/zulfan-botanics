window.ZULFAN_SUPABASE_URL = window.ZULFAN_SUPABASE_URL || (window.ZULFAN_SUPABASE_CONFIG && window.ZULFAN_SUPABASE_CONFIG.url) || '';
window.ZULFAN_SUPABASE_ANON_KEY = window.ZULFAN_SUPABASE_ANON_KEY || (window.ZULFAN_SUPABASE_CONFIG && window.ZULFAN_SUPABASE_CONFIG.anonKey) || '';
if (window.supabase && window.supabase.createClient && window.ZULFAN_SUPABASE_URL && window.ZULFAN_SUPABASE_ANON_KEY) {
  window.ZulfanSupabase = window.supabase.createClient(window.ZULFAN_SUPABASE_URL, window.ZULFAN_SUPABASE_ANON_KEY);
}
