window.ZULFAN_SUPABASE_URL = '';
window.ZULFAN_SUPABASE_ANON_KEY = '';
if (window.supabase && window.supabase.createClient && window.ZULFAN_SUPABASE_URL && window.ZULFAN_SUPABASE_ANON_KEY) {
  window.ZulfanSupabase = window.supabase.createClient(window.ZULFAN_SUPABASE_URL, window.ZULFAN_SUPABASE_ANON_KEY);
}
