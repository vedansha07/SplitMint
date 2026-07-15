import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { calculateShares } from '../utils/splitCalculator';
import { formatCurrency } from '../utils/format';
import { parseExpenseFromText, categorizeExpense } from '../services/mintSense';
import toast from 'react-hot-toast';
import type { Expense } from '../types';

const ExpenseFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const groups = useAppStore((s) => s.groups);
  const expenses = useAppStore((s) => s.expenses);
  const addExpense = useAppStore((s) => s.addExpense);
  const updateExpense = useAppStore((s) => s.updateExpense);
  const existing = isEdit ? expenses.find(e => e.id === id) : null;

  const [description, setDescription] = useState(existing?.description || '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [date, setDate] = useState(existing?.date ? new Date(existing.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [groupId, setGroupId] = useState(existing?.groupId || state?.groupId || '');
  const [payerId, setPayerId] = useState(existing?.payerId || '');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom' | 'percentage'>(existing?.splitMode || 'equal');
  const [category, setCategory] = useState(existing?.category || '');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [customPcts, setCustomPcts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // AI
  const [showAi, setShowAi] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [aiCategory, setAiCategory] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedGroup = groups.find(g => g.id === groupId);

  useEffect(() => {
    if (isEdit && existing && selectedGroup) {
      if (existing.splitMode === 'custom') {
        const m: Record<string, string> = {};
        existing.shares.forEach(s => { m[s.participantId] = String(s.amount); });
        setCustomAmounts(m);
      }
      if (existing.splitMode === 'percentage') {
        const m: Record<string, string> = {};
        existing.shares.forEach(s => { m[s.participantId] = String(Math.round(s.amount / existing.amount * 10000) / 100); });
        setCustomPcts(m);
      }
    }
  }, [isEdit, existing, selectedGroup]);

  useEffect(() => {
    if (selectedGroup && !payerId) setPayerId(selectedGroup.participants[0].id);
  }, [selectedGroup, payerId]);

  useEffect(() => {
    if (!description.trim() || description.length < 3) { setAiCategory(''); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setCategorizing(true);
      try {
        const cat = await categorizeExpense(description, parseFloat(amount) || 0);
        setAiCategory(cat);
        if (!category) setCategory(cat);
      } catch { /* silent */ } finally { setCategorizing(false); }
    }, 800);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim() || !selectedGroup) return;
    setParsing(true);
    try {
      const parsed = await parseExpenseFromText(aiText, selectedGroup.participants);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.payerId) setPayerId(parsed.payerId);
      if (parsed.splitMode) setSplitMode(parsed.splitMode);
      if (parsed.category) { setCategory(parsed.category); setAiCategory(parsed.category); }
      toast.success('Parsed by MintSense ✦');
      setShowAi(false); setAiText('');
    } catch { toast.error('AI parse failed'); } finally { setParsing(false); }
  };

  const numAmt = parseFloat(amount) || 0;
  const pList = selectedGroup?.participants.map(p => p.id) || [];
  const totalCustom = splitMode === 'custom' ? pList.reduce((s, pid) => s + (parseFloat(customAmounts[pid]) || 0), 0) : 0;
  const totalPct = splitMode === 'percentage' ? pList.reduce((s, pid) => s + (parseFloat(customPcts[pid]) || 0), 0) : 0;
  const badCustom = splitMode === 'custom' && Math.abs(totalCustom - numAmt) > 0.01;
  const badPct = splitMode === 'percentage' && Math.abs(totalPct - 100) > 0.01;
  const disabled = submitting || !selectedGroup || !description.trim() || numAmt <= 0 || badCustom || badPct;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setSubmitting(true);
    setTimeout(() => {
      let cv: number[] | undefined;
      if (splitMode === 'custom') cv = pList.map(pid => parseFloat(customAmounts[pid]) || 0);
      if (splitMode === 'percentage') cv = pList.map(pid => parseFloat(customPcts[pid]) || 0);
      const shares = calculateShares(numAmt, splitMode, pList, cv);
      const payload: Omit<Expense, 'id' | 'createdAt'> = { groupId, description, amount: numAmt, date: new Date(date).toISOString(), payerId, splitMode, shares, category };
      if (isEdit && existing) { updateExpense(existing.id, payload); toast.success('Updated'); }
      else { addExpense(payload); toast.success('Saved'); }
      setSubmitting(false);
      navigate(`/groups/${groupId}`);
    }, 280);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '36px 28px 100px' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn-back" style={{ marginBottom: '28px' }}>← back</button>

        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border-dark)', paddingBottom: '28px', marginBottom: '36px' }}>
          <p className="label-micro" style={{ marginBottom: '10px' }}>{isEdit ? 'editing expense' : 'new expense'}</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '36px', fontWeight: 700, margin: 0 }}>
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* Giant amount — centered, like "big number" section in template */}
          <div className="fade-up delay-1" style={{ textAlign: 'center', padding: '40px 0', borderBottom: '1px solid var(--border-dark)', marginBottom: '32px' }}>
            <p className="label-micro" style={{ marginBottom: '20px' }}>amount</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', fontWeight: 400, color: 'var(--text-light)' }}>₹</span>
              <input
                type="number" required value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0" step="0.01" min="0.01"
                style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', fontWeight: 700, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '240px', textAlign: 'center', padding: 0 }}
              />
            </div>
          </div>

          {/* MintSense AI strip — like a "consultancy" banner */}
          <div className="fade-up delay-2" style={{ background: 'var(--bg-dark)', borderRadius: '4px', padding: '18px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f5ede6', margin: '0 0 2px' }}>✦ MintSense AI</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(245,237,230,0.5)', margin: 0 }}>
                {selectedGroup ? 'Describe in plain English — AI fills the form' : 'Select a group first'}
              </p>
            </div>
            {!showAi ? (
              <button type="button" disabled={!selectedGroup} onClick={() => setShowAi(true)}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, background: 'rgba(245,237,230,0.1)', border: '1px solid rgba(245,237,230,0.2)', color: '#f5ede6', borderRadius: '3px', padding: '7px 14px', cursor: 'pointer', opacity: selectedGroup ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '5px' }}>
                Describe it ↗
              </button>
            ) : (
              <div style={{ width: '100%' }}>
                <textarea autoFocus rows={2} value={aiText} onChange={e => setAiText(e.target.value)}
                  placeholder='"Priya paid ₹800 for dinner, split equally"'
                  style={{ width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '13px', background: 'rgba(245,237,230,0.06)', border: '1px solid rgba(245,237,230,0.15)', borderRadius: '3px', padding: '10px 12px', color: '#f5ede6', resize: 'none', outline: 'none', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={handleAiParse as unknown as React.MouseEventHandler}
                    disabled={parsing || !aiText.trim()}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, background: '#f5ede6', color: 'var(--bg-dark)', border: 'none', borderRadius: '3px', padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: (parsing || !aiText.trim()) ? 0.5 : 1 }}>
                    {parsing ? <span className="spinner">✦</span> : <>✦ Parse ↗</>}
                  </button>
                  <button type="button" onClick={() => { setShowAi(false); setAiText(''); }}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', background: 'none', border: '1px solid rgba(245,237,230,0.2)', color: 'rgba(245,237,230,0.6)', borderRadius: '3px', padding: '7px 12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="fade-up delay-3 card" style={{ padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Description with AI category */}
              <div>
                <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>description</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type="text" required value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Dinner at restaurant" style={{ paddingRight: aiCategory ? '110px' : '14px' }} />
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {categorizing && <span className="spinner" style={{ fontSize: '12px', color: 'var(--text-light)' }}>✦</span>}
                    {!categorizing && aiCategory && <span className="ai-tag">✦ {aiCategory}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>date</label>
                  <input className="input" type="date" required value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'light' }} />
                </div>
                <div>
                  <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>group</label>
                  <select className="input" required value={groupId} onChange={e => setGroupId(e.target.value)}>
                    <option value="" disabled>Select</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>paid by</label>
                <select className="input" value={payerId} onChange={e => setPayerId(e.target.value)} disabled={!selectedGroup} style={{ opacity: selectedGroup ? 1 : 0.4 }}>
                  {!selectedGroup ? <option>Select group first</option> : selectedGroup.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Split mode */}
          {selectedGroup && (
            <div className="fade-up delay-4 card" style={{ padding: '24px', marginBottom: '16px' }}>
              <label className="label-micro" style={{ display: 'block', marginBottom: '14px' }}>split mode</label>

              <div style={{ display: 'flex', border: '1px solid var(--border-dark)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
                {(['equal', 'custom', 'percentage'] as const).map((m, i) => (
                  <button key={m} type="button" onClick={() => setSplitMode(m)}
                    style={{ flex: 1, height: '38px', border: 'none', borderLeft: i > 0 ? '1px solid var(--border-dark)' : 'none', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 180ms ease', letterSpacing: '0.05em', textTransform: 'uppercase',
                      background: splitMode === m ? 'var(--bg-dark)' : 'var(--bg-card)',
                      color: splitMode === m ? 'var(--bg)' : 'var(--text-mid)',
                    }}>
                    {m === 'equal' ? 'Equal' : m === 'custom' ? 'Custom' : 'Percent'}
                  </button>
                ))}
              </div>

              {/* Error banners */}
              {badPct && <div style={{ background: 'rgba(201,64,64,0.06)', border: '1px solid rgba(201,64,64,0.18)', borderRadius: '3px', padding: '10px 14px', marginBottom: '14px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--accent-red)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Must equal 100% — now {totalPct.toFixed(1)}%</span><span>Δ {Math.abs(100 - totalPct).toFixed(1)}%</span>
              </div>}
              {badCustom && <div style={{ background: 'rgba(201,64,64,0.06)', border: '1px solid rgba(201,64,64,0.18)', borderRadius: '3px', padding: '10px 14px', marginBottom: '14px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--accent-red)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Must total {formatCurrency(numAmt)}</span><span>Δ {formatCurrency(Math.abs(numAmt - totalCustom))}</span>
              </div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedGroup.participants.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ backgroundColor: p.color || '#999080' }}>{p.avatar}</div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: 'var(--text)', flex: 1, margin: 0 }}>{p.name}</p>
                    {splitMode === 'equal' && (
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: 'var(--text-mid)' }}>
                        {amount ? formatCurrency(numAmt / selectedGroup.participants.length) : '—'}
                      </span>
                    )}
                    {splitMode === 'custom' && (
                      <div style={{ position: 'relative', width: '110px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '13px' }}>₹</span>
                        <input type="number" step="0.01" min="0" value={customAmounts[p.id] || ''} onChange={e => setCustomAmounts({ ...customAmounts, [p.id]: e.target.value })} placeholder="0.00" className="input" style={{ paddingLeft: '26px', fontSize: '14px', height: '38px', padding: '0 10px 0 26px' }} />
                      </div>
                    )}
                    {splitMode === 'percentage' && (
                      <div style={{ position: 'relative', width: '80px' }}>
                        <input type="number" step="0.1" min="0" max="100" value={customPcts[p.id] || ''} onChange={e => setCustomPcts({ ...customPcts, [p.id]: e.target.value })} placeholder="0" className="input" style={{ paddingRight: '24px', fontSize: '14px', height: '38px', padding: '0 24px 0 10px', textAlign: 'right' }} />
                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '13px' }}>%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="fade-up delay-5 card" style={{ padding: '24px', marginBottom: '28px' }}>
            <label className="label-micro" style={{ display: 'block', marginBottom: '8px' }}>
              category {aiCategory && category === aiCategory && <span style={{ opacity: 0.5 }}>✦ ai</span>}
            </label>
            <input className="input" type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Food, Transport, Entertainment…" />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" style={{ flex: 1, height: '48px', justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={disabled} className="btn btn-primary" style={{ flex: 2, height: '48px', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
              {submitting ? <span className="spinner">✦</span> : <>{isEdit ? 'Update' : 'Save'} expense ↗</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseFormPage;
