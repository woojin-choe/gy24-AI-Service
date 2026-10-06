import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { DEMO } from '../supabase/functions/_shared/data.mjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let client: SupabaseClient | undefined;
function backend() {
  if (!url || !key) throw Error('Supabase 연결 설정이 필요합니다.');
  if (!client) client = createClient(url, key, {
    auth: {
      detectSessionInUrl: true,
      storage: {
        getItem: name => sessionStorage.getItem(name) ?? localStorage.getItem(name),
        setItem: (name, value) => {
          const remember = sessionStorage.getItem('ieum-remember') === 'true' ||
            (sessionStorage.getItem('ieum-remember') === null && localStorage.getItem(name) !== null);
          (remember ? localStorage : sessionStorage).setItem(name, value);
          (remember ? sessionStorage : localStorage).removeItem(name);
        },
        removeItem: name => { localStorage.removeItem(name); sessionStorage.removeItem(name); },
      },
    },
  });
  return client;
}
function account(user: User | null) {
  return user ? { id: user.id, email: user.email || '', name: user.user_metadata?.name || user.email || '' } : null;
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  // The original loopback API remains available only for explicit local development.
  if (process.env.NEXT_PUBLIC_LOCAL_API === 'true') return fetch(path, options);
  const route = path.split('?')[0];
  if (!url || !key) {
    if (route === '/api/auth/me') return json({ user: null });
    if (route === '/api/status') return json({ live: false, llm: false });
    if (route === '/api/notices' && new URL(path, location.origin).searchParams.get('mode') === 'demo') return json({ notices: DEMO, mode: 'demo' });
    return json({ error: 'Supabase 연결 설정이 필요합니다.' }, 503);
  }
  try {
    const supabase = backend();
    const input = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    if (route === '/api/auth/me') {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) return json({ user: null });
      const result = await supabase.auth.getUser();
      if (result.error) throw result.error;
      return json({ user: account(result.data.user) });
    }
    if (route === '/api/auth/login' || route === '/api/auth/signup') {
      sessionStorage.setItem('ieum-remember', String(input.remember === true));
      const result = route.endsWith('signup')
        ? await supabase.auth.signUp({ email: input.email, password: input.password, options: { data: { name: input.name }, emailRedirectTo: location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/' } })
        : await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
      if (result.error) throw result.error;
      return json({ user: result.data.session ? account(result.data.user) : null });
    }
    if (route === '/api/auth/logout') {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      return json({ signedOut: true });
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (route === '/api/profile') {
      if (!data.session) return json({ error: '로그인이 필요합니다.' }, 401);
      const id = data.session.user.id;
      if (options.method === 'POST') {
        const result = await supabase.from('company_profiles').upsert({ user_id: id, profile: input.profile });
        if (result.error) throw result.error;
        return json({ saved: true });
      }
      if (options.method === 'DELETE') {
        const result = await supabase.from('company_profiles').delete().eq('user_id', id);
        if (result.error) throw result.error;
        return json({ deleted: true });
      }
      const result = await supabase.from('company_profiles').select('profile').eq('user_id', id).maybeSingle();
      if (result.error) throw result.error;
      return json({ profile: result.data?.profile || {} });
    }
    const headers = new Headers(options.headers);
    headers.set('apikey', key);
    headers.set('Content-Type', 'application/json');
    if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`);
    return await fetch(`${url}/functions/v1/ieum${path.replace(/^\/api/, '')}`, { ...options, headers });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '요청에 실패했습니다.' }, 400);
  }
}
export async function api(path: string, options: RequestInit = {}) {
  const response = await apiFetch(path, options);
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('ieum-session-expired'));
    throw Error(data.error || '요청에 실패했습니다.');
  }
  return data;
}
