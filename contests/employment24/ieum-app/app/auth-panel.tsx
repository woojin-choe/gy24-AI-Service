'use client';
import { useState } from 'react';
export type Account = { id: string; name: string; email: string };
export default function AuthPanel({ onAuthenticated, initialMode = 'login' }: { onAuthenticated: (user: Account) => void; initialMode?: 'login' | 'signup' }) {
 const [signup, setSignup] = useState(initialMode === 'signup');
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [remember, setRemember] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (busy) return;
  setError('');
  if (signup && password !== confirmPassword) { setError('비밀번호 확인이 일치하지 않습니다.'); return; }
  setBusy(true);
  try {
   const response = await fetch(`/api/auth/${signup ? 'signup' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, remember }) });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || '잠시 후 다시 시도해주세요.');
   onAuthenticated(data.user);
  } catch (cause) { setError(cause instanceof Error ? cause.message : '연결하지 못했습니다.'); }
  finally { setBusy(false); }
 }
 return <section className="auth-card panel"><div className="eyebrow">{signup ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</div><h2 id="auth-title">{signup ? '이음과 시작하세요.' : '다시 만나 반가워요.'}</h2><p>{signup ? '계정을 만들면 회사 정보를 저장하고 신청을 준비할 수 있어요.' : '로그인하고 우리 회사의 신청 준비를 이어가세요.'}</p><div className="auth-tabs" aria-label="계정 메뉴"><button type="button" disabled={busy} aria-pressed={!signup} className={!signup ? 'selected' : ''} onClick={() => { setSignup(false); setError(''); setPassword(''); setConfirmPassword(''); }}>로그인</button><button type="button" disabled={busy} aria-pressed={signup} className={signup ? 'selected' : ''} onClick={() => { setSignup(true); setError(''); setPassword(''); }}>회원가입</button></div><form onSubmit={submit}>{signup && <label htmlFor="account-name">이름<input id="account-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={50} required disabled={busy} placeholder="이름을 입력하세요"/></label>}<label htmlFor="account-email">이메일<input id="account-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required disabled={busy} placeholder="name@company.com"/></label><label htmlFor="account-password">비밀번호<input id="account-password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={10} maxLength={128} required disabled={busy} aria-describedby={signup ? 'password-hint' : undefined} placeholder="비밀번호를 입력하세요"/></label>{signup && <><p id="password-hint" className="hint">10자 이상으로 설정해주세요.</p><label htmlFor="account-confirm">비밀번호 확인<input id="account-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={10} maxLength={128} required disabled={busy} placeholder="비밀번호를 한 번 더 입력하세요"/></label></>}<label className="remember-login"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={busy}/>자동 로그인</label>{error && <div className="error" role="alert">{error}</div>}<button type="submit" className="primary full" disabled={busy}>{busy ? '처리 중…' : signup ? '계정 만들기 →' : '로그인 →'}</button></form><p className="auth-footnote">회사 정보와 서명은 내 계정에 저장됩니다.</p></section>;
}
