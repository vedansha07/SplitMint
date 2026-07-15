import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { Participant } from '../types';
import { formatCurrency } from '../utils/format';
import { format } from 'date-fns';

const CAT_COLORS: Record<string, string> = {
  Food: '#e07340', Transport: '#6366f1', Entertainment: '#ec4899',
  Accommodation: '#14b8a6', Shopping: '#f59e0b', Utilities: '#3b82f6',
  Healthcare: '#22c55e', Other: '#999080', settlement: '#ccc0b0',
};

const History = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentUser = useAppStore((s) => s.currentUser);
  const groups = useAppStore((s) => s.groups);
  const expenses = useAppStore((s) => s.expenses);

  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState(searchParams.get('groupId') || 'all');
  const [participantId, setParticipantId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');

  const allParticipants = useMemo(() => {
    const map = new Map<string, Participant>();
    groups.forEach(g => g.participants.forEach(p => { if (!map.has(p.id)) map.set(p.id, p); }));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (groupId !== 'all' && e.groupId !== groupId) return false;
      if (search.trim() && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (participantId !== 'all') {
        if (e.payerId !== participantId && !e.shares.some(s => s.participantId === participantId && s.amount > 0)) return false;
      }
      if (minAmt !== '' && e.amount < parseFloat(minAmt)) return false;
      if (maxAmt !== '' && e.amount > parseFloat(maxAmt)) return false;
      if (dateFrom !== '' && new Date(e.date) < new Date(dateFrom)) return false;
      if (dateTo !== '') {
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999);
        if (new Date(e.date) > end) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, groupId, search, participantId, minAmt, maxAmt, dateFrom, dateTo]);

  const hasFilters = search || groupId !== 'all' || participantId !== 'all' || dateFrom || dateTo || minAmt || maxAmt;

  const clearFilters = () => {
    setSearch(''); setGroupId('all'); setParticipantId('all');
    setDateFrom(''); setDateTo(''); setMinAmt(''); setMaxAmt('');
    setSearchParams({});
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = filtered.map(e => {
      const g = groups.find(gr => gr.id === e.groupId);
      const payer = g?.participants.find(p => p.id === e.payerId)?.name || 'Unknown';
      return [new Date(e.date).toLocaleDateString(), `"${e.description.replace(/"/g, '""')}"`, `"${(g?.name || 'Unknown').replace(/"/g, '""')}"`, e.category || '', `"${payer}"`, e.amount, e.splitMode].join(',');
    });
    const csv = ['Date,Description,Group,Category,Payer,Amount,SplitMode', ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `splitmint_${format(new Date(), 'yyyyMMdd')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // Pill style that matches the template's filter pills
  const filterPill = (active: boolean): React.CSSProperties => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px', fontWeight: 500,
    height: '32px', padding: '0 14px',
    borderRadius: '2px',
    border: `1px solid ${active ? 'var(--text)' : 'var(--border-dark)'}`,
    background: active ? 'var(--text)' : 'var(--bg-card)',
    color: active ? 'var(--bg)' : 'var(--text-mid)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    outline: 'none',
    transition: 'all 180ms ease',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '40px 28px 0' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn-back" style={{ marginBottom: '24px' }}>← back</button>

        {/* Hero header */}
        <div className="fade-up delay-1" style={{ borderBottom: '1px solid var(--border-dark)', paddingBottom: '32px', marginBottom: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p className="label-micro" style={{ marginBottom: '10px' }}>transaction history</p>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '36px', fontWeight: 700, margin: 0 }}>
              History
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-mid)', margin: '8px 0 0' }}>
              {filtered.length} of {expenses.length} expenses
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-outline" style={{ height: '36px', padding: '0 14px', fontSize: '12px', justifyContent: 'center' }}>
                Clear filters
              </button>
            )}
            <button onClick={exportCSV} disabled={!filtered.length} className="btn btn-primary"
              style={{ height: '36px', padding: '0 16px', fontSize: '12px', justifyContent: 'center', opacity: filtered.length ? 1 : 0.4 }}>
              Export CSV ↗
            </button>
          </div>
        </div>
      </div>

      {/* Watermark divider */}
      <div style={{ overflow: 'hidden' }}>
        <div className="watermark-row">
          {['history', 'history', 'history', 'history', 'history'].map((w, i) => (
            <span key={i} className="section-watermark">{w}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '0 28px' }}>

        {/* Filter row — horizontal scrollable, like template's tab-bar */}
        <div className="fade-up delay-2" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '24px 0 20px', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
          <input type="text" placeholder="Search descriptions…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...filterPill(Boolean(search)), minWidth: '160px', paddingLeft: '12px' }} />
          <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ ...filterPill(groupId !== 'all'), minWidth: '120px' }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={participantId} onChange={e => setParticipantId(e.target.value)} style={{ ...filterPill(participantId !== 'all'), minWidth: '110px' }}>
            <option value="all">Anyone</option>
            {allParticipants.map(p => <option key={p.id} value={p.id}>{p.name}{currentUser?.id === p.id ? ' (You)' : ''}</option>)}
          </select>
          <input type="number" placeholder="Min ₹" value={minAmt} onChange={e => setMinAmt(e.target.value)} style={{ ...filterPill(Boolean(minAmt)), width: '80px', textAlign: 'center' }} />
          <input type="number" placeholder="Max ₹" value={maxAmt} onChange={e => setMaxAmt(e.target.value)} style={{ ...filterPill(Boolean(maxAmt)), width: '80px', textAlign: 'center' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...filterPill(Boolean(dateFrom)), colorScheme: 'light' }} title="From date" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...filterPill(Boolean(dateTo)), colorScheme: 'light' }} title="To date" />
        </div>

        {/* Results */}
        <div className="fade-up delay-3" style={{ marginTop: '20px' }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', color: 'var(--border-dark)', marginBottom: '20px', lineHeight: 1 }}>🔍</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '22px', marginBottom: '8px' }}>Nothing found</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-mid)' }}>Try widening your filters.</p>
            </div>
          ) : (
            /* Flush grid like the template's "success cases" */
            <div style={{ border: '1px solid var(--border-dark)', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-card)' }}>
              {filtered.map((expense, idx) => {
                const g = groups.find(gr => gr.id === expense.groupId);
                const payerP = g?.participants.find(p => p.id === expense.payerId);
                const catColor = CAT_COLORS[expense.category || 'Other'] || '#999080';

                return (
                  <div key={expense.id}
                    onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                    style={{
                      padding: '16px 22px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      transition: 'background 160ms ease',
                      background: 'var(--bg-card)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}>

                    {/* Date block */}
                    <div style={{ textAlign: 'center', minWidth: '36px', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                        {format(new Date(expense.date), 'MMM')}
                      </p>
                      <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', margin: 0, lineHeight: 1 }}>
                        {format(new Date(expense.date), 'd')}
                      </p>
                    </div>

                    {/* Vertical divider */}
                    <div style={{ width: 1, height: 32, background: 'var(--border-dark)', flexShrink: 0 }} />

                    {/* Category dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {expense.description}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-light)', margin: '3px 0 0' }}>
                        {g?.name || '—'}
                        <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                        {payerP?.name}{currentUser?.id === payerP?.id ? ' (You)' : ''} paid
                        {expense.category && <span className="ai-tag" style={{ marginLeft: '8px' }}>✦ {expense.category}</span>}
                      </p>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', margin: 0 }}>
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>

                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-light)', flexShrink: 0 }}>↗</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
