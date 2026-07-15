import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Participant, Expense } from '../types';
import { formatCurrency } from '../utils/format';

interface ContributionChartProps {
  participants: Participant[];
  expenses: Expense[];
}

export const ContributionChart = ({ participants, expenses }: ContributionChartProps) => {
  const data = useMemo(() => {
    return participants.map(p => {
      const totalPaid = expenses
        .filter(e => e.payerId === p.id && e.category !== 'settlement')
        .reduce((s, e) => s + e.amount, 0);
      const exactShare = expenses
        .filter(e => e.category !== 'settlement')
        .reduce((s, e) => {
          const share = e.shares.find(sh => sh.participantId === p.id);
          return s + (share ? share.amount : 0);
        }, 0);
      return { name: p.name, color: p.color || '#999080', totalPaid, exactShare };
    });
  }, [participants, expenses]);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dark)',
      borderRadius: '4px',
      padding: '20px',
      height: '280px',
      width: '100%',
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 4 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-mid)', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            axisLine={{ stroke: 'var(--border-dark)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-light)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
            axisLine={{ stroke: 'var(--border-dark)' }}
            tickLine={false}
            tickFormatter={val => formatCurrency(val)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(17,16,8,0.04)' }}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: 'var(--border-dark)',
              color: 'var(--text)',
              borderRadius: '4px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              boxShadow: '0 4px 20px rgba(17,16,8,0.10)',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [formatCurrency(Number(value ?? 0)), 'Paid']}
          />
          <Bar dataKey="totalPaid" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
