import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const TopNav = () => {
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '';
  const firstName = currentUser?.name?.split(' ')[0] ?? '';

  return (
    <>
      <nav style={{
        height: '60px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Left: brand — italic serif "splitmint" like "insider" */}
        <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontStyle: 'italic', fontWeight: 900,
            fontSize: '22px', letterSpacing: '-0.5px',
            color: 'var(--text)', lineHeight: 1,
          }}>splitmint</span>
        </NavLink>

        {/* Center: nav links with ↗ arrows */}
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }} className="nav-center">
          {[
            { label: 'dashboard', to: '/dashboard' },
            { label: 'history', to: '/history' },
          ].map(({ label, to }) => (
            <NavLink key={to} to={to}
              end={to === '/dashboard'}
              style={({ isActive }) => ({
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px', fontWeight: 500,
                color: isActive ? 'var(--text)' : 'var(--text-mid)',
                textDecoration: 'none',
                padding: '6px 14px',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-dark)' : 'transparent',
                borderRadius: '3px',
                display: 'flex', alignItems: 'center', gap: '5px',
                transition: 'all 160ms ease',
              })}
            >
              {label} <span style={{ fontSize: '11px', opacity: 0.6 }}>↗</span>
            </NavLink>
          ))}
        </div>

        {/* Right: avatar + name + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="nav-user">
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: 'var(--bg)' }}>
                  {initials}
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: 'var(--text-mid)' }}>
                  {firstName}
                </span>
              </div>
              <button onClick={handleLogout}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', transition: 'color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-light)')}>
                logout
              </button>
              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(true)} className="nav-burger"
                style={{ background: 'none', border: '1px solid var(--border-dark)', borderRadius: '3px', color: 'var(--text)', cursor: 'pointer', padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: '16px', display: 'none' }}>
                ☰
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Sheet */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,16,8,0.5)', zIndex: 60, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderTop: '1px solid var(--border-dark)', padding: '32px 28px 52px' }}>
            <div style={{ width: 36, height: 3, background: 'var(--border-dark)', borderRadius: '2px', margin: '0 auto 28px' }} />
            {[{ label: 'dashboard', to: '/dashboard' }, { label: 'history', to: '/history' }].map(({ label, to }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                style={{ display: 'block', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '28px', color: 'var(--text)', textDecoration: 'none', marginBottom: '16px' }}>
                {label} ↗
              </NavLink>
            ))}
            <button onClick={handleLogout} style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginTop: '8px' }}>
              logout
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .nav-center { display: none !important; }
          .nav-user   { display: none !important; }
          .nav-burger { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default TopNav;
