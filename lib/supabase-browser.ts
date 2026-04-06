import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ANON_STORAGE_KEY = 'ot_anon_session';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase browser client missing env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseBrowser =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: true, persistSession: true } })
    : null;

type StoredSession = { access_token: string; refresh_token: string };

function persistAnonSession(session: Session) {
  const { access_token, refresh_token, user } = session;
  if (user?.is_anonymous && access_token && refresh_token && typeof localStorage !== 'undefined') {
    localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify({ access_token, refresh_token }));
  }
}

async function restoreAnonSession(): Promise<Session | null> {
  if (!supabaseBrowser || typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(ANON_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.access_token || !parsed.refresh_token) return null;
    const { data, error } = await supabaseBrowser.auth.setSession(parsed);
    if (error || !data.session) return null;
    return data.session;
  } catch {
    return null;
  }
}

export async function getOrCreateSession(): Promise<Session | null> {
  if (!supabaseBrowser) return null;
  const { data } = await supabaseBrowser.auth.getSession();
  if (data.session) {
    persistAnonSession(data.session);
    return data.session;
  }

  const restored = await restoreAnonSession();
  if (restored) {
    persistAnonSession(restored);
    return restored;
  }

  const { data: anonData, error } = await supabaseBrowser.auth.signInAnonymously();
  if (error || !anonData.session) return null;
  persistAnonSession(anonData.session);
  return anonData.session;
}

export { persistAnonSession };
