const SUPABASE_URL="https://xdszveoxdrdnwwzzvkav.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_xwUE0aN1g0rb7aOLyXPAsA_kOAX9bOA";
window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.AULA_API=SUPABASE_URL+"/functions/v1/school-attendance-api";