import type { Participant, Settlement } from '../types';
import { formatCurrency } from '../utils/format';
import { useAppStore } from '../store';

interface SettlementsProps {
  participants: Participant[];
  settlements: Settlement[];
  onMarkSettled: (settlement: Settlement) => void;
}

export const Settlements = ({ participants, settlements, onMarkSettled }: SettlementsProps) => {
  const currentUser = useAppStore((s) => s.currentUser);

  if (settlements.length === 0) {
    return (
      <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', color: 'var(--border-dark)', marginBottom: '20px', lineHeight: 1 }}>✦</div>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '22px', marginBottom: '8px' }}>All settled up!</h3>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-mid)' }}>No outstanding debts in this group.</p>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid var(--border-dark)',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
    }}>
      {settlements.map((s, idx) => {
        const fromP = participants.find(p => p.id === s.from);
        const toP = participants.find(p => p.id === s.to);
        if (!fromP || !toP) return null;
        const fromIsMe = currentUser?.id === fromP.id;
        const toIsMe = currentUser?.id === toP.id;

        return (
          <div key={`${s.from}-${s.to}-${idx}`}
            style={{
              padding: '20px 24px',
              borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}>

            {/* From avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
              <div className="avatar avatar-md" style={{ backgroundColor: fromP.color || '#999080' }}>{fromP.avatar}</div>
              <div>
                <p className="label-micro" style={{ marginBottom: '2px' }}>from</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: fromIsMe ? 'var(--accent-red)' : 'var(--text)', margin: 0 }}>
                  {fromP.name}{fromIsMe ? ' (You)' : ''}
                </p>
              </div>
            </div>

            {/* Arrow + amount */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '22px', color: 'var(--text)', margin: 0 }}>
                {formatCurrency(s.amount)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'center' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-dark)', maxWidth: '60px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--text-light)' }}>→</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-dark)', maxWidth: '60px' }} />
              </div>
            </div>

            {/* To avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
              <div className="avatar avatar-md" style={{ backgroundColor: toP.color || '#999080' }}>{toP.avatar}</div>
              <div>
                <p className="label-micro" style={{ marginBottom: '2px' }}>to</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: toIsMe ? 'var(--accent-green)' : 'var(--text)', margin: 0 }}>
                  {toP.name}{toIsMe ? ' (You)' : ''}
                </p>
              </div>
            </div>

            {/* CTA */}
            <button onClick={() => onMarkSettled(s)} className="btn-arrow"
              style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '12px' }}>
              Mark Settled ↗
            </button>
          </div>
        );
      })}
    </div>
  );
};
