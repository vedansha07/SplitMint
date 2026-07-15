import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      if (ok) navigate('/dashboard');
      else { setError('Invalid email or password'); setLoading(false); }
    }, 280);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Left panel — decorative */}
      <div style={{ flex: '1 1 45%', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px', position: 'relative', overflow: 'hidden' }} className="login-left">
        {/* Pink blob */}
        <div className="blob" style={{ width: 300, height: 300, top: '10%', left: '-80px', opacity: 0.4 }} />
        <div className="blob" style={{ width: 200, height: 200, bottom: '15%', right: '-40px', opacity: 0.25 }} />

        <span style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 900, fontSize: '28px', color: '#f5ede6', position: 'relative' }}>splitmint</span>

        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,237,230,0.4)', marginBottom: '16px' }}>✦ tagline</div>
          <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#f5ede6', lineHeight: 1.25, margin: 0 }}>
            Split without<br />the awkward.
          </p>
        </div>

        {/* Decorative star */}
        <div style={{ position: 'absolute', bottom: 40, right: 40, fontFamily: 'Playfair Display, serif', fontSize: '80px', color: 'rgba(245,237,230,0.06)', fontWeight: 900, lineHeight: 1 }}>✦</div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: '1 1 55%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div className="fade-up delay-1" style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '40px' }}>
            <p className="label-micro" style={{ marginBottom: '12px' }}>welcome back</p>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: 'var(--text)' }}>Sign in</h1>
          </div>

          {error && (
            <div style={{ background: 'rgba(201,64,64,0.07)', border: '1px solid rgba(201,64,64,0.2)', borderRadius: '3px', padding: '12px 16px', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '46px', marginTop: '8px', fontSize: '14px', justifyContent: 'center' }}>
              {loading ? <span className="spinner">✦</span> : <>Sign in <span>↗</span></>}
            </button>
          </form>

          <p style={{ marginTop: '28px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-mid)', textAlign: 'center' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>Create one ↗</Link>
          </p>
        </div>
      </div>

      <style>{`@media(max-width:640px){.login-left{display:none}}`}</style>
    </div>
  );
};

export default LoginPage;
