import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';

const scrypt = promisify(scryptCallback);
const cookieName = 'ieum_session';
const sessionAge = 12 * 60 * 60 * 1000;
const rememberedAge = 30 * 24 * 60 * 60 * 1000;
const digest = value => createHash('sha256').update(value).digest('hex');
const publicUser = user => ({ id: user.id, name: user.name, email: user.email });
const fail = (status, message) => Object.assign(new Error(message), { status });
async function hashPassword(password, salt) {
 return (await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 })).toString('hex');
}
function credentials(input) {
 const email = String(input.email ?? '').trim().toLowerCase();
 const password = typeof input.password === 'string' ? input.password : '';
 if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, '올바른 이메일 주소를 입력해주세요.');
 if (password.length < 10 || password.length > 128) throw fail(400, '비밀번호는 10~128자로 입력해주세요.');
 return { email, password };
}
export function createAuth(root) {
 const filename = path.join(root, '.local', 'accounts.json');
 let queue = Promise.resolve();
 const attempts = new Map();
 async function read() {
  try { return JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { users: [], sessions: [] }; throw error; }
 }
 function update(action) {
  const task = queue.then(async () => {
   const data = await read();
   data.sessions = data.sessions.filter(session => session.expires > Date.now());
   const result = await action(data);
   await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
   const temporary = `${filename}.${randomUUID()}.tmp`;
   await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
   await rename(temporary, filename);
   return result;
  });
  queue = task.catch(() => {});
  return task;
 }
 function token(req) {
  return (req.headers.cookie ?? '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) ?? '';
 }
 function setCookie(req, res, value, maxAge) {
  const secure = req.socket.encrypted ? '; Secure' : '';
  const persistence = maxAge === undefined ? '' : `; Max-Age=${maxAge}`;
  res.setHeader('Set-Cookie', `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax${persistence}${secure}`);
 }
 function limit(req) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const key = req.socket.remoteAddress ?? 'local';
  const value = attempts.get(key) ?? { count: 0, until: now + 15 * 60 * 1000 };
  if (value.count >= 20) throw fail(429, '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.');
  value.count += 1;
  attempts.set(key, value);
 }
 function newSession(data, user, req, res, remember) {
  const raw = randomBytes(32).toString('hex');
  const previous = digest(token(req));
  data.sessions = data.sessions.filter(session => session.hash !== previous);
  data.sessions.push({ hash: digest(raw), userId: user.id, expires: Date.now() + (remember ? rememberedAge : sessionAge) });
  setCookie(req, res, raw, remember ? rememberedAge / 1000 : undefined);
  return publicUser(user);
 }
 return {
  async current(req) {
   const raw = token(req);
   if (!/^[a-f0-9]{64}$/.test(raw)) return null;
   await queue;
   const data = await read();
   const session = data.sessions.find(item => item.hash === digest(raw) && item.expires > Date.now());
   const user = session && data.users.find(item => item.id === session.userId);
   return user ? publicUser(user) : null;
  },
  async signup(input, req, res) {
   limit(req);
   const { email, password } = credentials(input);
   const name = String(input.name ?? '').trim();
   if (name.length < 2 || name.length > 50) throw fail(400, '이름은 2~50자로 입력해주세요.');
   const salt = randomBytes(16).toString('hex');
   const passwordHash = await hashPassword(password, salt);
   return update(data => {
    if (data.users.some(user => user.email === email)) throw fail(409, '이미 가입된 이메일입니다. 로그인해주세요.');
    const user = { id: randomUUID(), name, email, salt, passwordHash, createdAt: new Date().toISOString() };
    data.users.push(user);
    return newSession(data, user, req, res, input.remember === true);
   });
  },
  async login(input, req, res) {
   limit(req);
   const { email, password } = credentials(input);
   await queue;
   const data = await read();
   const user = data.users.find(item => item.email === email);
   const actual = await hashPassword(password, user?.salt ?? 'ieum-missing-user-salt');
   const expected = user?.passwordHash ?? '0'.repeat(128);
   if (!timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex')) || !user) throw fail(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
   return update(current => newSession(current, user, req, res, input.remember === true));
  },
  async logout(req, res) {
   const hash = digest(token(req));
   await update(data => { data.sessions = data.sessions.filter(session => session.hash !== hash); });
   setCookie(req, res, '', 0);
  }
 };
}
