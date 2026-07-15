import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { Expense, Participant } from '../types';
import { formatCurrency } from '../utils/format';

interface LedgerProps {
  expenses: Expense[];
  participants: Participant[];
  currentUser?: { id: string };
  onDeleteExpense: (id: string) => void;
}

const CAT_COLORS: Record<string, string> = {
  Food: '#e07340', Transport: '#6366f1', Entertainment: '#ec4899',
  Accommodation: '#14b8a6', Shopping: '#f59e0b', Utilities: '#3b82f6',
  Healthcare: '#22c55e', Other: '#999080', settlement: '#ccc0b0',
};

export const Ledger = ({ expenses, participants, currentUser, onDeleteExpense }: LedgerProps) => {
  const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getRoleLabel = (expense: Expense) => {
    if (!currentUser) return null;
    const myShare = expense.shares.find(s => s.participantId === currentUser.id);
    const iPaid = expense.payerId === currentUser.id;
    if (!myShare && !iPaid) return null;
    if (iPaid && myShare) {
      if (expense.amount === myShare.amount) return { text: 'Paid for yourself', color: 'var(--text-light)' };
      return { text: `Lent ${formatCurrency(expense.amount - myShare.amount)}`, color: 'var(--accent-green)' };
    }
    if (iPaid) return { text: `Lent ${formatCurrency(expense.amount)}`, color: 'var(--accent-green)' };
    if (myShare) return { text: `Owe ${formatCurrency(myShare.amount)}`, color: 'var(--accent-red)' };
    return null;
  };

  return (
    <div style={{
      border: '1px solid var(--border-dark)',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
    }}>
      {sorted.map((expense, idx) => {
        const payer = participants.find(p => p.id === expense.payerId);
        const roleLabel = getRoleLabel(expense);
        const catColor = CAT_COLORS[expense.category || 'Other'] || '#999080';
        const isSettlement = expense.category === 'settlement';

        return (
          <div key={expense.id}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
              opacity: isSettlement ? 0.55 : 1,
              background: 'var(--bg-card)',
              transition: 'background 160ms ease',
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

            {/* Vertical rule */}
            <div style={{ width: 1, height: 32, background: 'var(--border-dark)', flexShrink: 0 }} />

            {/* Category dot */}
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {expense.description}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-light)', margin: '2px 0 0' }}>
                {payer?.name}{currentUser?.id === payer?.id ? ' (You)' : ''} paid
                {expense.category && !isSettlement && (
                  <span className="ai-tag" style={{ marginLeft: '8px' }}>✦ {expense.category}</span>
                )}
              </p>
            </div>

            {/* Amount + role */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '17px', color: 'var(--text)', margin: 0 }}>
                {formatCurrency(expense.amount)}
              </p>
              {roleLabel && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: roleLabel.color, margin: '2px 0 0' }}>
                  {roleLabel.text}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <Link to={`/expenses/${expense.id}/edit`}
                style={{ width: 28, height: 28, border: '1px solid var(--border-dark)', borderRadius: '3px', color: 'var(--text-light)', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dark)'; e.currentTarget.style.color = 'var(--text-light)'; }}>
                ✎
              </Link>
              <button onClick={() => onDeleteExpense(expense.id)}
                style={{ width: 28, height: 28, border: '1px solid var(--border-dark)', borderRadius: '3px', color: 'var(--text-light)', background: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-red)'; e.currentTarget.style.color = 'var(--accent-red)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dark)'; e.currentTarget.style.color = 'var(--text-light)'; }}>
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
