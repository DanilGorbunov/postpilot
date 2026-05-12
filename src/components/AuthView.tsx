import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { setSession, type User } from '../lib/auth';

interface Props {
  onBack: () => void;
  onSuccess: (user: User, isNew: boolean) => void;
}

function tabStyle(active: boolean): CSSProperties {
  return { flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: active ? '2px solid var(--ac)' : '2px solid transparent', color: active ? 'var(--t1)' : 'var(--t3)', fontFamily: 'var(--head)', fontSize: 14, fontWeight: active ? 600 : 500, cursor: 'pointer', marginBottom: -1 };
}

const s: Record<string, CSSProperties> = {
  root: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 'var(--r2)', padding: 40, width: '100%', maxWidth: 420, animation: 'fadeIn .25s ease' },
  backBtn: { background: 'none', border: 'none', color: 'var(--t3)', fontSize: 13, cursor: 'pointer', padding: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 6 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { width: 36, height: 36, borderRadius: 9, background: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff' },
  logoText: { fontFamily: 'var(--head)', fontSize: 22, fontWeight: 800, color: 'var(--t1)' },
  logoAccent: { color: 'var(--ac2)' },
  tabs: { display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 28 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 'var(--r)', color: 'var(--t1)', fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', background: 'var(--ac)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontFamily: 'var(--head)', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  error: { background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 13, color: 'var(--err)', marginBottom: 16 },
  info: { fontSize: 12, color: 'var(--t3)', textAlign: 'center' as const, marginTop: 16, lineHeight: 1.5 },
};

export default function AuthView({ onBack, onSuccess }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const upsertUser = useMutation(api.users.upsertUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (tab === 'register' && !name.trim()) { setError('Enter your name'); return; }
    setLoading(true);
    setError('');
    try {
      const displayName = tab === 'register' ? name.trim() : email.split('@')[0];
      const result = await upsertUser({ email: email.trim().toLowerCase(), name: displayName });
      const user: User = { _id: result.userId, email: email.trim().toLowerCase(), name: displayName };
      setSession(user);
      onSuccess(user, result.isNew);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div style={s.logo}>
          <div style={s.logoIcon}>P</div>
          <span style={s.logoText}>Post<span style={s.logoAccent}>Pilot</span></span>
        </div>
        <div style={s.tabs}>
          <button style={tabStyle(tab === 'login')} onClick={() => setTab('login')}>Sign In</button>
          <button style={tabStyle(tab === 'register')} onClick={() => setTab('register')}>Create Account</button>
        </div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div>
              <label style={s.label}>Full name</label>
              <input style={s.input} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required onFocus={e => (e.target.style.borderColor = 'var(--ac)')} onBlur={e => (e.target.style.borderColor = 'var(--bd)')} />
            </div>
          )}
          <div>
            <label style={s.label}>Email address</label>
            <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required onFocus={e => (e.target.style.borderColor = 'var(--ac)')} onBlur={e => (e.target.style.borderColor = 'var(--bd)')} />
          </div>
          <button type="submit" style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Loading...' : tab === 'login' ? 'Continue →' : 'Create Account →'}
          </button>
        </form>
        <p style={s.info}>No password required — just your email.</p>
      </div>
    </div>
  );
}
