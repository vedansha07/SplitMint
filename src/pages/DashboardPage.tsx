import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { calculateNetBalances } from '../utils/splitCalculator';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const groups = useAppStore((s) => s.groups);
  const expenses = useAppStore((s) => s.expenses);
  const addGroup = useAppStore((s) => s.addGroup);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !currentUser || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      const g = addGroup(newName.trim(), []);
      setNewName(''); setIsCreating(false); setSubmitting(false);
      toast.success(`"${g.name}" created`);
      navigate(`/groups/${g.id}`);
    }, 280);
  };

  let totalPaid = 0, youOwe = 0, owedToYou = 0;
  if (currentUser) {
    groups.forEach(g => {
      const gExp = expenses.filter(e => e.groupId === g.id);
      const { balances } = calculateNetBalances(gExp);
      const b = balances[currentUser.id] || 0;
      totalPaid += gExp.filter(e => e.payerId === currentUser.id && e.category !== 'settlement').reduce((s, e) => s + e.amount, 0);
      if (b < 0) youOwe += Math.abs(b);
      else if (b > 0) owedToYou += b;
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '100px' }}>

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '52px 28px 0' }}>
        <div className="fade-up delay-1" style={{ borderBottom: '1px solid var(--border-dark)', paddingBottom: '40px', marginBottom: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p className="label-micro" style={{ marginBottom: '14px' }}>welcome back</p>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.1 }}>
              {currentUser?.name} <span style={{ opacity: 0.15 }}>✦</span>
            </h1>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-mid)', maxWidth: '280px', lineHeight: 1.6, margin: 0 }}>
            Your financial overview — track, split, and settle with ease.
          </p>
        </div>
      </div>

      {/* ── Stats section with watermark ─────────────────────────────────── */}
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Watermark */}
        <div className="watermark-row" style={{ margin: 0 }}>
          {['overview', 'overview', 'overview', 'overview', 'overview'].map((w, i) => (
            <span key={i} className="section-watermark">{w}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0 28px' }}>

        {/* Summary cards — styled like the template's "about us / services / contacts" row */}
        <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', border: '1px solid var(--border-dark)', borderRadius: '4px', overflow: 'hidden', marginBottom: '52px', background: 'var(--bg-card)' }}>
          {[
            { label: 'you paid', value: totalPaid, color: 'var(--text)', note: 'total across all groups' },
            { label: 'you owe',  value: youOwe,    color: 'var(--accent-red)', note: 'net outstanding debt' },
            { label: "you're owed", value: owedToYou, color: 'var(--accent-green)', note: 'net credit from groups' },
          ].map(({ label, value, color, note }, i) => (
            <div key={label} style={{ padding: '28px 28px', borderLeft: i > 0 ? '1px solid var(--border-dark)' : 'none', position: 'relative' }}>
              <p className="label-micro" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {label} <span style={{ opacity: 0.5 }}>↗</span>
              </p>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, color, margin: '0 0 8px', lineHeight: 1 }}>
                {formatCurrency(value)}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>{note}</p>
            </div>
          ))}
        </div>

        {/* ── Groups section ────────────────────────────────────────────── */}
        <div className="fade-up delay-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <p className="label-micro" style={{ marginBottom: '8px' }}>your groups</p>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '28px', fontWeight: 700, margin: 0 }}>Groups</h2>
            </div>
            <button onClick={() => setIsCreating(v => !v)} className="btn-arrow">
              {isCreating ? 'Cancel' : <>+ new group <span>↗</span></>}
            </button>
          </div>

          {/* Inline create */}
          {isCreating && (
            <form onSubmit={handleCreate} className="fade-up delay-1 card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
              <input autoFocus className="input" style={{ flex: 1 }} type="text" placeholder="e.g. Goa Trip, House Rent…" value={newName} onChange={e => setNewName(e.target.value)} required />
              <button type="submit" disabled={submitting || !newName.trim()} className="btn btn-primary" style={{ height: '44px', padding: '0 20px', justifyContent: 'center', flexShrink: 0 }}>
                {submitting ? <span className="spinner">✦</span> : <>Create ↗</>}
              </button>
            </form>
          )}

          {/* Empty state */}
          {groups.length === 0 ? (
            <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', color: 'var(--border-dark)', marginBottom: '20px', lineHeight: 1 }}>✦</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '24px', marginBottom: '10px' }}>No groups yet</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-mid)', marginBottom: '28px' }}>Create your first group to start splitting expenses</p>
              <button onClick={() => setIsCreating(true)} className="btn btn-primary" style={{ height: '44px', padding: '0 24px', justifyContent: 'center' }}>
                Create first group ↗
              </button>
            </div>
          ) : (
            /* Groups grid — like the template's "success cases" 3-column grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: 'var(--border-dark)', border: '1px solid var(--border-dark)', borderRadius: '4px', overflow: 'hidden' }}>
              {groups.map(group => {
                const gExp = expenses.filter(e => e.groupId === group.id);
                const { totalSpent, balances } = calculateNetBalances(gExp);
                const myBal = balances[currentUser?.id ?? ''] || 0;

                return (
                  <Link key={group.id} to={`/groups/${group.id}`}
                    style={{ background: 'var(--bg-card)', padding: '28px', textDecoration: 'none', display: 'block', transition: 'background 180ms ease', position: 'relative' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}>

                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div>
                        <p className="label-micro" style={{ marginBottom: '8px' }}>group</p>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                          {group.name}
                        </h3>
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-light)', marginTop: '2px' }}>↗</span>
                    </div>

                    {/* Avatar stack */}
                    <div style={{ display: 'flex', marginBottom: '20px' }}>
                      {group.participants.slice(0, 4).map((p, i) => (
                        <div key={p.id} className="avatar" style={{ backgroundColor: p.color || '#999080', marginLeft: i > 0 ? '-8px' : 0, zIndex: i, border: '2px solid var(--bg-card)' }}>
                          {p.avatar}
                        </div>
                      ))}
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-light)', alignSelf: 'center', marginLeft: '10px' }}>
                        {group.participants.length} member{group.participants.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Bottom stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                      <div>
                        <p className="label-micro" style={{ marginBottom: '4px' }}>total spent</p>
                        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{formatCurrency(totalSpent)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="label-micro" style={{ marginBottom: '4px' }}>your balance</p>
                        {myBal === 0
                          ? <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>settled ✓</p>
                          : <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, color: myBal > 0 ? 'var(--accent-green)' : 'var(--accent-red)', margin: 0 }}>
                              {myBal > 0 ? '+' : '−'}{formatCurrency(Math.abs(myBal))}
                            </p>
                        }
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Decorative footer watermark ───────────────────────────────────── */}
      <div style={{ marginTop: '80px', overflow: 'hidden' }}>
        <div className="watermark-row">
          {['splitmint', 'splitmint', 'splitmint', 'splitmint', 'splitmint'].map((w, i) => (
            <span key={i} className="section-watermark">{w}</span>
          ))}
        </div>
      </div>

      {/* FAB */}
      <Link to="/expenses/new" className="fab" title="Add expense">+</Link>
    </div>
  );
};

export default DashboardPage;
