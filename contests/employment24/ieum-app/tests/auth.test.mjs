import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { localApi } from '../server/api.mjs';

async function fixture(t) {
 const root = await mkdtemp(path.join(tmpdir(), 'ieum-auth-'));
 const server = createServer();
 localApi({}, root).configureServer({ middlewares: { use: handler => server.on('request', (req, res) => handler(req, res, () => { res.writeHead(404); res.end(); })) } });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(root, { recursive: true, force: true }); });
 const base = `http://127.0.0.1:${server.address().port}`;
 const request = async (url, { cookie, method = 'GET', data, origin } = {}) => {
  const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) }, body: data && method !== 'GET' ? JSON.stringify(data) : undefined });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie'), response };
 };
 return { root, request };
}
const account = { name: '가상 사용자', email: 'first@example.com', password: 'a-long-test-password' };
const session = result => result.cookie.split(';')[0];

test('signup, persistent login, validation, safe sessions and logout', async t => {
 const { root, request } = await fixture(t);
 assert.equal((await request('/api/auth/me')).data.user, null);
 for (const url of ['/api/profile', '/api/chat', '/api/pdf']) assert.equal((await request(url, { method: url === '/api/profile' ? 'GET' : 'POST', data: {} })).status, 401);
 assert.equal((await request('/api/auth/signup', { method: 'POST', data: { ...account, password: 'short' } })).status, 400);
 const signedUp = await request('/api/auth/signup', { method: 'POST', data: account });
 assert.equal(signedUp.status, 201);
 assert.match(signedUp.cookie, /HttpOnly/);
 assert.match(signedUp.cookie, /SameSite=Lax/);
 assert.doesNotMatch(signedUp.cookie, /Max-Age|Expires/);
 assert.equal(signedUp.data.user.passwordHash, undefined);
 const cookie = session(signedUp);
 assert.equal((await request('/api/auth/me', { cookie })).data.user.email, account.email);
 assert.equal((await request('/api/auth/signup', { method: 'POST', data: { ...account, email: 'FIRST@example.com' } })).status, 409);
 assert.equal((await request('/api/auth/login', { method: 'POST', data: { ...account, password: 'a-wrong-long-password' } })).status, 401);
 assert.equal((await request('/api/auth/login', { method: 'POST', data: { ...account, email: 'missing@example.com' } })).status, 401);
 const login = await request('/api/auth/login', { method: 'POST', data: { ...account, remember: true } });
 assert.equal(login.status, 200);
 assert.match(login.cookie, /Max-Age=2592000/);
 const db = JSON.parse(await readFile(path.join(root, '.local', 'accounts.json'), 'utf8'));
 assert.ok(!JSON.stringify(db).includes(account.password));
 assert.ok(!JSON.stringify(db).includes(cookie.slice('ieum_session='.length)));
 // A new auth instance can read the same persisted session after a restart.
 const { createAuth } = await import('../server/auth.mjs');
 assert.equal((await createAuth(root).current({ headers: { cookie } })).email, account.email);
 assert.equal((await request('/api/profile', { cookie: 'ieum_session=' + '0'.repeat(64) })).status, 401);
 const logout = await request('/api/auth/logout', { method: 'POST', cookie });
 assert.match(logout.cookie, /Max-Age=0/);
 assert.equal((await request('/api/profile', { cookie })).status, 401);
 assert.equal((await request('/api/profile', { cookie: session(login) })).status, 200);
 db.sessions = db.sessions.map(item => ({ ...item, expires: Date.now() - 1 }));
 await writeFile(path.join(root, '.local', 'accounts.json'), JSON.stringify(db));
 assert.equal((await request('/api/profile', { cookie: session(login) })).status, 401);
});

test('company profiles are isolated and cross-origin requests are rejected', async t => {
 const { request } = await fixture(t);
 const first = session(await request('/api/auth/signup', { method: 'POST', data: account }));
 const second = session(await request('/api/auth/signup', { method: 'POST', data: { ...account, email: 'second@example.com' } }));
 assert.equal((await request('/api/profile', { method: 'POST', cookie: first, data: { profile: { company: '첫 번째 회사' } } })).status, 200);
 assert.deepEqual((await request('/api/profile', { cookie: second })).data.profile, {});
 await request('/api/profile', { method: 'POST', cookie: second, data: { profile: { company: '두 번째 회사' } } });
 assert.equal((await request('/api/profile', { cookie: first })).data.profile.company, '첫 번째 회사');
 await request('/api/profile', { method: 'DELETE', cookie: second });
 assert.equal((await request('/api/profile', { cookie: first })).data.profile.company, '첫 번째 회사');
 assert.equal((await request('/api/auth/signup', { method: 'POST', data: account, origin: 'https://example.com' })).status, 403);
 assert.equal((await request('/api/auth/logout', { method: 'POST', cookie: first, origin: 'https://example.com' })).status, 403);
 assert.equal((await request('/api/profile', { cookie: first })).status, 200);
 const chat = await request('/api/chat', { method: 'POST', cookie: first, data: { noticeId: 'demo-01', messages: [{ role: 'user', content: '신규 채용을 준비합니다.' }], profile: { company: '첫 번째 회사' } } });
 assert.equal(chat.status, 200);
});

test('concurrent duplicate registrations cannot overwrite accounts', async t => {
 const { request } = await fixture(t);
 const results = await Promise.all([request('/api/auth/signup', { method: 'POST', data: account }), request('/api/auth/signup', { method: 'POST', data: account })]);
 assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
});

test('repeated authentication failures are rate limited', async t => {
 const { request } = await fixture(t);
 for (let i = 0; i < 20; i++) assert.equal((await request('/api/auth/login', { method: 'POST', data: { ...account, password: 'short' } })).status, 400);
 assert.equal((await request('/api/auth/login', { method: 'POST', data: account })).status, 429);
});
