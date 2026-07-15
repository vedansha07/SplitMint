import { useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { calculateNetBalances, calculateSettlements } from '../utils/splitCalculator';
import { formatCurrency } from '../utils/format';
import { generateGroupSummary, explainSettlements } from '../services/mintSense';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import type { Settlement } from '../types';

import { SummaryCards } from '../components/SummaryCards';
import { BalanceTable } from '../components/BalanceTable';
import { Ledger } from '../components/Ledger';
import { ContributionChart } from '../components/ContributionChart';
import { Settlements } from '../components/Settlements';
import { ConfirmModal } from '../components/ConfirmModal';
import { AiModal } from '../components/AiModal';

type TabId = 'overview' | 'expenses' | 'balances' | 'settle';

const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const currentUser = useAppStore((s) => s.currentUser);
  const groups = useAppStore((s) => s.groups);
  const allExpenses = useAppStore((s) => s.expenses);
  const updateGroup = useAppStore((s) => s.updateGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const deleteExpense = useAppStore((s) => s.deleteExpense);
  const addExpense = useAppStore((s) => s.addExpense);

  const group = groups.find(g => g.id === id);
  const expenses = allExpenses.filter(e => e.groupId === id);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(group?.name || '');
  const [newMember, setNewMember] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteExp, setConfirmDeleteExp] = useState<string | null>(null);
  const [aiModal, setAiModal] = useState<{ title: string; content: string; loading: boolean; error?: string } | null>(null);

  if (!group) return <Navigate to="/dashboard" replace />;

  const { totalSpent, balances } = calculateNetBalances(expenses);
  const settlements = calculateSettlements(balances);

  const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];

  const handleSaveName = () => {
    if (editName.trim()) updateGroup(group.id, { name: editName.trim() });
    else setEditName(group.name);
    setEditingName(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.trim() || group.participants.length >= 4) return;
    const np = {
      id: uuidv4(), name: newMember.trim(),
      color: COLORS[group.participants.length % 4],
      avatar: newMember.trim().slice(0, 2).toUpperCase()
    };
    updateGroup(group.id, { participants: [...group.participants, np] });
    setNewMember(''); setShowAddMember(false);
    toast.success(`${np.name} added`);
  };

  const triggerRemove = (pid: string, pname: string) => {
    const involved = expenses.filter(e =>
      e.payerId === pid || e.shares.some(s => s.participantId === pid && s.amount > 0)
    );
    if (involved.length > 0) {
      toast.error(`Can't remove — appears in: ${involved.slice(0, 3).map(e => e.description).join(', ')}`);
      return;
    }
    setConfirmRemove({ id: pid, name: pname });
  };

  const execRemove = () => {
    if (!confirmRemove) return;
    updateGroup(group.id, { participants: group.participants.filter(p => p.id !== confirmRemove.id) });
    toast.success(`${confirmRemove.name} removed`);
  };

  const handleMarkSettled = (settlement: Settlement) => {
    const fromP = group.participants.find(p => p.id === settlement.from);
    const toP = group.participants.find(p => p.id === settlement.to);
    if (!fromP || !toP) return;
    if (window.confirm(`Record ${formatCurrency(settlement.amount)} from ${fromP.name} → ${toP.name}?`)) {
      addExpense({
        groupId: group.id,
        description: `Settled: ${fromP.name} → ${toP.name}`,
        amount: settlement.amount,
        date: new Date().toISOString(),
        payerId: settlement.from,
        splitMode: 'custom',
        shares: [{ participantId: settlement.to, amount: settlement.amount }],
        category: 'settlement',
      });
      toast.success('Settlement recorded');
    }
  };

  const handleAiSummary = async () => {
    setAiModal({ title: 'Group Summary', content: '', loading: true });
    try {
      const s = await generateGroupSummary(group, expenses, balances);
      setAiModal({ title: 'Group Summary', content: s, loading: false });
    } catch {
      setAiModal({ title: 'Group Summary', content: '', loading: false, error: 'Could not generate summary.' });
    }
  };

  const handleAiExplain = async () => {
    if (!settlements.length) { toast('Everyone is settled up! 🎉'); return; }
    setAiModal({ title: 'Settlement Explanation', content: '', loading: true });
    try {
      const s = await explainSettlements(settlements, group.participants);
      setAiModal({ title: 'Settlement Explanation', content: s, loading: false });
    } catch {
      setAiModal({ title: 'Settlement Explanation', content: '', loading: false, error: 'Could not generate explanation.' });
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'balances', label: 'Balances' },
    { id: 'settle', label: 'Settle Up' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '100px' }}>

      {/* Modals */}
      <ConfirmModal isOpen={confirmDeleteGroup} title="Delete Group"
        message="This will permanently delete the group and all its expenses."
        confirmLabel="Delete Everything" onConfirm={() => { deleteGroup(group.id); toast.success('Group deleted'); navigate('/dashboard'); }}
        onCancel={() => setConfirmDeleteGroup(false)} />
      <ConfirmModal isOpen={!!confirmRemove} title="Remove Participant"
        message={`Remove ${confirmRemove?.name}?`} confirmLabel="Remove"
        onConfirm={execRemove} onCancel={() => setConfirmRemove(null)} />
      <ConfirmModal isOpen={!!confirmDeleteExp} title="Delete Expense"
        message="Permanently delete this expense?" confirmLabel="Delete"
        onConfirm={() => { if (confirmDeleteExp) deleteExpense(confirmDeleteExp); toast.success('Deleted'); }}
        onCancel={() => setConfirmDeleteExp(null)} />
      {aiModal && (
        <AiModal isOpen title={aiModal.title} content={aiModal.content}
          isLoading={aiModal.loading} error={aiModal.error}
          onClose={() => setAiModal(null)} />
      )}

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '40px 28px 0' }}>

        <button onClick={() => navigate('/dashboard')} className="btn-back" style={{ marginBottom: '24px' }}>
          ← back
        </button>

        <div style={{ borderBottom: '1px solid var(--border-dark)', paddingBottom: '32px', marginBottom: '0' }}>
          {/* Name + actions row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <p className="label-micro" style={{ marginBottom: '10px' }}>group</p>
              {editingName ? (
                <input autoFocus type="text" value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '32px', fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid var(--text)', outline: 'none', color: 'var(--text)', padding: '0 4px' }}
                />
              ) : (
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '32px', fontWeight: 700, margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' }}
                  onClick={() => setEditingName(true)}>
                  {group.name}
                  <span style={{ color: 'var(--text-light)', fontSize: '18px' }}>✎</span>
                </h1>
              )}
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-mid)', margin: '8px 0 0' }}>
                {group.participants.length} members · {expenses.filter(e => e.category !== 'settlement').length} expenses · {formatCurrency(totalSpent)} total
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={handleAiSummary}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, background: 'var(--bg-dark)', border: '1px solid var(--bg-dark)', color: '#f5ede6', borderRadius: '3px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'opacity 180ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                ✦ AI Summary
              </button>

              {group.participants.length > 1 ? (
                <Link to="/expenses/new" state={{ groupId: group.id }} className="btn-arrow">
                  + add expense ↗
                </Link>
              ) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-light)', border: '1px solid var(--border)', borderRadius: '3px', padding: '8px 12px' }}>
                  Add members to start
                </span>
              )}

              <button onClick={() => setConfirmDeleteGroup(true)}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, background: 'rgba(201,64,64,0.06)', border: '1px solid rgba(201,64,64,0.2)', color: 'var(--accent-red)', borderRadius: '3px', padding: '8px 14px', cursor: 'pointer', transition: 'all 180ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,64,64,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,64,64,0.06)'; }}>
                Delete
              </button>
            </div>
          </div>

          {/* Participants row */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {group.participants.map(p => {
              const bal = balances[p.id] || 0;
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', position: 'relative' }}>
                  <div className="avatar avatar-md" style={{ backgroundColor: p.color || '#999080' }}>{p.avatar}</div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--text-mid)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {p.name}{currentUser?.id === p.id ? ' (You)' : ''}
                  </span>
                  {bal !== 0 && (
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '12px', fontWeight: 700, color: bal > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {bal > 0 ? '+' : '−'}{formatCurrency(Math.abs(bal))}
                    </span>
                  )}
                  {p.id !== group.createdBy && (
                    <button onClick={() => triggerRemove(p.id, p.name)}
                      style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border-dark)', color: 'var(--text-light)', fontSize: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-red)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = 'none'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-light)'; e.currentTarget.style.border = '1px solid var(--border-dark)'; }}>
                      ✕
                    </button>
                  )}
                </div>
              );
            })}

            {group.participants.length < 4 && (
              <button onClick={() => setShowAddMember(v => !v)}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: 'var(--text-mid)', background: 'none', border: '1px dashed var(--border-dark)', borderRadius: '3px', padding: '5px 10px', cursor: 'pointer', transition: 'all 150ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dark)'; e.currentTarget.style.color = 'var(--text-mid)'; }}>
                + add member
              </button>
            )}
          </div>

          {showAddMember && (
            <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px', marginTop: '16px', maxWidth: '320px' }}>
              <input autoFocus className="input" type="text" required placeholder="Member name" value={newMember} onChange={e => setNewMember(e.target.value)} style={{ flex: 1, height: '38px', fontSize: '13px' }} />
              <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 16px', fontSize: '13px', justifyContent: 'center' }}>Add</button>
            </form>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0 28px' }}>
        <div className="tab-bar fade-up delay-2" style={{ marginBottom: '28px' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.label}
              {tab.id === 'settle' && settlements.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-red)', color: '#fff', fontSize: '9px', fontWeight: 700, marginLeft: '6px' }}>
                  {settlements.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            <SummaryCards totalSpent={totalSpent} balances={balances} currentUser={currentUser || undefined} participants={group.participants} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>
              <div>
                <p className="label-micro" style={{ marginBottom: '12px' }}>spend by participant</p>
                <ContributionChart participants={group.participants} expenses={expenses} />
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <p className="label-micro" style={{ marginBottom: '14px' }}>quick balances</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {group.participants.map(p => {
                    const bal = balances[p.id] || 0;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ backgroundColor: p.color || '#999080' }}>{p.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{p.name}</p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', margin: '1px 0 0', color: bal === 0 ? 'var(--text-light)' : bal > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {bal === 0 ? 'Settled up' : bal > 0 ? `Gets back ${formatCurrency(bal)}` : `Owes ${formatCurrency(Math.abs(bal))}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Expenses ──────────────────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          expenses.length === 0 ? (
            <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', color: 'var(--border-dark)', marginBottom: '20px', lineHeight: 1 }}>💸</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '22px', marginBottom: '8px' }}>No expenses yet</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-mid)', marginBottom: '24px' }}>Your ledger is clean.</p>
              {group.participants.length > 1 && (
                <Link to="/expenses/new" state={{ groupId: group.id }} className="btn btn-primary" style={{ display: 'inline-flex', height: '44px', padding: '0 24px', justifyContent: 'center', textDecoration: 'none' }}>
                  Add first expense ↗
                </Link>
              )}
            </div>
          ) : (
            <Ledger expenses={expenses} participants={group.participants} currentUser={currentUser || undefined} onDeleteExpense={eid => setConfirmDeleteExp(eid)} />
          )
        )}

        {/* ── Balances ──────────────────────────────────────────────────── */}
        {activeTab === 'balances' && (
          expenses.length > 0
            ? <BalanceTable participants={group.participants} expenses={expenses} />
            : <div className="card" style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}><p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-mid)', fontSize: '14px' }}>Add expenses to see balances.</p></div>
        )}

        {/* ── Settle Up ─────────────────────────────────────────────────── */}
        {activeTab === 'settle' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p className="label-micro" style={{ marginBottom: '8px' }}>settle up</p>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '24px', margin: 0 }}>Settlements</h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-mid)', margin: '6px 0 0' }}>Minimum transactions to clear all debts</p>
              </div>
              <button onClick={handleAiExplain}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, background: 'var(--bg-dark)', border: '1px solid var(--bg-dark)', color: '#f5ede6', borderRadius: '3px', padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                ✦ Explain ↗
              </button>
            </div>
            <Settlements participants={group.participants} settlements={settlements} onMarkSettled={handleMarkSettled} />
          </div>
        )}
      </div>

      {/* Watermark */}
      <div style={{ marginTop: '80px', overflow: 'hidden' }}>
        <div className="watermark-row">
          {[group.name, group.name, group.name, group.name, group.name].map((w, i) => (
            <span key={i} className="section-watermark">{w}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
