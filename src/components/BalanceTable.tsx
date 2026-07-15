import { useMemo } from 'react';
import type { Participant, Expense } from '../types';
import { calculateSettlements, calculateNetBalances } from '../utils/splitCalculator';
import { formatCurrency } from '../utils/format';
import { useAppStore } from '../store';

interface BalanceTableProps {
  participants: Participant[];
  expenses: Expense[];
}

export const BalanceTable = ({ participants, expenses }: BalanceTableProps) => {
  const currentUser = useAppStore((s) => s.currentUser);

  const matrix = useMemo(() => {
    const { balances } = calculateNetBalances(expenses);
    const settlements = calculateSettlements(balances);
    const m: Record<string, Record<string, number>> = {};
    participants.forEach(p1 => {
      m[p1.id] = {};
      participants.forEach(p2 => { m[p1.id][p2.id] = 0; });
    });
    settlements.forEach(({ from, to, amount }) => {
      if (m[from]?.[to] !== undefined) m[from][to] = amount;
    });
    return m;
  }, [participants, expenses]);

  if (participants.length < 2) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-mid)', fontSize: '14px' }}>
          Add more participants to see the balance matrix.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      overflowX: 'auto',
      border: '1px solid var(--border-dark)',
      borderRadius: '4px',
      background: 'var(--bg-card)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-dark)' }}>
            <th style={{
              padding: '12px 18px', textAlign: 'left',
              background: 'var(--bg)',
              fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-light)', whiteSpace: 'nowrap',
            }}>
              From ↓ · To →
            </th>
            {participants.map(p => (
              <th key={p.id} style={{ padding: '12px 18px', textAlign: 'center', background: 'var(--bg)', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || '#999080', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                  {currentUser?.id === p.id && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'var(--text-light)', fontWeight: 400 }}>(You)</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map((rowP, ri) => (
            <tr key={rowP.id} style={{ borderBottom: ri < participants.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <th style={{
                padding: '14px 18px', textAlign: 'left',
                fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                color: 'var(--text)', whiteSpace: 'nowrap', background: 'var(--bg)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: rowP.color || '#999080', flexShrink: 0 }} />
                  {rowP.name}
                  {currentUser?.id === rowP.id && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'var(--text-light)', fontWeight: 400 }}>(You)</span>
                  )}
                </div>
              </th>
              {participants.map(colP => {
                if (rowP.id === colP.id) {
                  return (
                    <td key={colP.id} style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-light)', background: 'rgba(17,16,8,0.02)' }}>—</td>
                  );
                }
                const amt = matrix[rowP.id]?.[colP.id] ?? 0;
                return (
                  <td key={colP.id} style={{ padding: '14px 18px', textAlign: 'center', background: amt > 0 ? 'rgba(201,64,64,0.04)' : 'transparent' }}>
                    {amt > 0 ? (
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 700, color: 'var(--accent-red)' }}>
                        {formatCurrency(amt)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--border-dark)', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--text-light)' }}>
        Read as: row person owes column person. <span style={{ color: 'var(--accent-red)' }}>Red = debt.</span>
      </div>
    </div>
  );
};
