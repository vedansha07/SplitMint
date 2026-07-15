import { useMemo } from 'react';
import type { Participant } from '../types';
import { formatCurrency } from '../utils/format';

interface SummaryCardsProps {
  totalSpent: number;
  balances: Record<string, number>;
  currentUser?: { id: string; name: string };
  participants: Participant[];
}

export const SummaryCards = ({ totalSpent, balances, currentUser }: SummaryCardsProps) => {
  const { youOwe, owedToYou } = useMemo(() => {
    if (!currentUser) return { youOwe: 0, owedToYou: 0 };
    const b = balances[currentUser.id] || 0;
    return { youOwe: b < 0 ? Math.abs(b) : 0, owedToYou: b > 0 ? b : 0 };
  }, [balances, currentUser]);

  const cards = [
    { label: 'group spend',   value: totalSpent,  color: 'var(--text)',         note: 'total paid in group' },
    { label: 'you owe',       value: youOwe,      color: 'var(--accent-red)',   note: 'outstanding debt' },
    { label: "you're owed",   value: owedToYou,   color: 'var(--accent-green)', note: 'net credit' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0',
      border: '1px solid var(--border-dark)',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
      marginBottom: '28px',
    }}>
      {cards.map(({ label, value, color, note }, i) => (
        <div key={label} style={{
          padding: '22px 24px',
          borderLeft: i > 0 ? '1px solid var(--border-dark)' : 'none',
        }}>
          <p className="label-micro" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {label} <span style={{ opacity: 0.5 }}>↗</span>
          </p>
          <p style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(22px, 2.5vw, 30px)',
            fontWeight: 700,
            color,
            margin: '0 0 6px',
            lineHeight: 1.1,
          }}>
            {formatCurrency(value)}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
            {note}
          </p>
        </div>
      ))}
    </div>
  );
};
