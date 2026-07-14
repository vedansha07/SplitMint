import type { Expense, SplitShare, Settlement } from '../types';

/**
 * Calculates algorithmic splits preventing penny fraction bleed.
 */
export const calculateShares = (
  amount: number,
  mode: 'equal' | 'custom' | 'percentage',
  participants: string[],
  customValues?: number[]
): SplitShare[] => {
  if (participants.length === 0) return [];
  if (amount <= 0) return participants.map((p) => ({ participantId: p, amount: 0 }));

  if (mode === 'equal') {
    const totalPaise = Math.round(amount * 100);
    const splitPaise = Math.floor(totalPaise / participants.length);
    let remainderPaise = totalPaise - splitPaise * participants.length;

    return participants.map((participantId) => {
      let finalPaise = splitPaise;
      if (remainderPaise > 0) {
        finalPaise += 1;
        remainderPaise -= 1;
      }
      return { participantId, amount: finalPaise / 100 };
    });
  }

  if (mode === 'percentage' && customValues) {
    const totalPaise = Math.round(amount * 100);
    let allocatedPaise = 0;

    const shares = participants.map((participantId, idx) => {
      const pct = customValues[idx] || 0;
      const sharePaise = Math.round(totalPaise * (pct / 100));
      allocatedPaise += sharePaise;
      return { participantId, amount: sharePaise / 100 };
    });

    // Remainder trap (if percentages slightly overshoot or undershoot 100% physically)
    const diffPaise = totalPaise - allocatedPaise;
    shares[0].amount = Math.round(shares[0].amount * 100 + diffPaise) / 100;
    return shares;
  }

  // Custom Mode
  if (mode === 'custom' && customValues) {
    return participants.map((participantId, idx) => ({
      participantId,
      amount: customValues[idx] || 0,
    }));
  }

  return [];
};

/**
 * Iterates expenses and calculates how much someone technically paid overhead vs their actual usage.
 */
export const calculateNetBalances = (
  expenses: Expense[]
): { totalSpent: number; balances: Record<string, number> } => {
  let totalSpent = 0;
  const balances: Record<string, number> = {};

  expenses.forEach((expense) => {
    // Only count actual overhead towards the group's "Total Spent" metric (ignore debt transfers)
    if (expense.category !== 'settlement') {
      totalSpent += expense.amount;
    }
    
    // They get credited exactly what they threw into the pot
    balances[expense.payerId] = (balances[expense.payerId] || 0) + expense.amount;

    // They get subtracted exactly what their logical "take" is defined as
    expense.shares.forEach((share) => {
      balances[share.participantId] = (balances[share.participantId] || 0) - share.amount;
    });
  });

  return { totalSpent, balances };
};

/**
 * Synthesizes a record of balances into Greedy matched settlement routes.
 */
export const calculateSettlements = (netBalances: Record<string, number>): Settlement[] => {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(netBalances)) {
    // Only care about floating point offsets over a penny
    if (balance > 0.01) creditors.push({ id, amount: balance });
    else if (balance < -0.01) debtors.push({ id, amount: Math.abs(balance) });
  }

  // Sort descending to tackle biggest chunks first (greedy)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(amount * 100) / 100, // force 2 decimal cutoff
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    // Move to next if tapped out
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
};
