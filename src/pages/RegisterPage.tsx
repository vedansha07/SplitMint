import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAppStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!name || !email || !password || !confirm) { setError('All fields are required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Valid email required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try { register(name, email, password); navigate('/dashboard'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Left decorative */}
      <div style={{ flex: '1 1 45%', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px', position: 'relative', overflow: 'hidden' }} className="auth-left">
        <div className="blob" style={{ width: 280, height: 280, top: '20%', left: '-60px', opacity: 0.35 }} />
        <span style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontWeight: 900, fontSize: '28px', color: '#f5ede6', position: 'relative' }}>splitmint</span>
        <div style={{ position: 'relative' }}>
          <div className="label-micro" style={{ color: 'rgba(245,237,230,0.4)', marginBottom: '16px' }}>✦ get started</div>
          <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, color: '#f5ede6', lineHeight: 1.3, margin: 0 }}>
            Join and start<br />splitting smarter.
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 40, right: 40, fontFamily: 'Playfair Display, serif', fontSize: '80px', color: 'rgba(245,237,230,0.06)', fontWeight: 900, lineHeight: 1 }}>*</div>
      </div>

      {/* Right form */}
      <div style={{ flex: '1 1 55%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div className="fade-up delay-1" style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '36px' }}>
            <p className="label-micro" style={{ marginBottom: '12px' }}>create account</p>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: 'var(--text)' }}>Register</h1>
          </div>

          {error && (
            <div style={{ background: 'rgba(201,64,64,0.07)', border: '1px solid rgba(201,64,64,0.2)', borderRadius: '3px', padding: '12px 16px', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--accent-red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Full Name', type: 'text', val: name, set: setName, ph: 'Your name', ac: 'name' },
              { label: 'Email', type: 'email', val: email, set: setEmail, ph: 'you@example.com', ac: 'email' },
              { label: 'Password', type: 'password', val: password, set: setPassword, ph: '••••••••', ac: 'new-password' },
              { label: 'Confirm Password', type: 'password', val: confirm, set: setConfirm, ph: '••••••••', ac: 'new-password' },
            ].map(({ label, type, val, set, ph, ac }) => (
              <div key={label}>
                <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>{label}</label>
                <input className="input" type={type} placeholder={ph} value={val} onChange={e => set(e.target.value)} autoComplete={ac} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '46px', marginTop: '8px', fontSize: '14px', justifyContent: 'center' }}>
              {loading ? <span className="spinner">✦</span> : <>Create account <span>↗</span></>}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-mid)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign in ↗</Link>
          </p>
        </div>
      </div>
      <style>{`@media(max-width:640px){.auth-left{display:none}}`}</style>
    </div>
  );
};

export default RegisterPage;
