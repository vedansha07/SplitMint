import type { Expense, Group, Participant, Settlement } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set');
  return key;
}

interface GroqMessage {
  role: 'system' | 'user';
  content: string;
}

interface GroqRequestBody {
  model: string;
  messages: GroqMessage[];
  max_tokens: number;
  response_format?: { type: 'json_object' };
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  opts: { json?: boolean } = {}
): Promise<string> {
  const key = getApiKey();

  const body: GroqRequestBody = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 1000,
  };

  if (opts.json) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── 1. Parse Expense From Text ────────────────────────────────────────────────

export async function parseExpenseFromText(
  text: string,
  groupParticipants: Participant[]
): Promise<Partial<Expense>> {
  const names = groupParticipants.map((p) => p.name).join(', ');

  const systemPrompt = `You are an expense parser for a bill-splitting app. Extract expense details from natural language. Return ONLY valid JSON with keys: description (string), amount (number), payerName (string matching one of the provided names), participantNames (array of strings), splitMode ('equal' | 'custom' | 'percentage'), category (string). If any field is unclear, omit it.`;

  const userPrompt = `Participants in this group: ${names}. Parse this expense: ${text}`;

  const raw = await callGroq(systemPrompt, userPrompt, { json: true });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AI returned invalid JSON');
  }

  // Match payerName → Participant id
  const result: Partial<Expense> = {};

  if (typeof parsed.description === 'string') result.description = parsed.description;
  if (typeof parsed.amount === 'number') result.amount = parsed.amount;
  if (typeof parsed.category === 'string') result.category = parsed.category;
  if (parsed.splitMode === 'equal' || parsed.splitMode === 'custom' || parsed.splitMode === 'percentage') {
    result.splitMode = parsed.splitMode;
  }

  // Resolve payerName → payerId
  if (typeof parsed.payerName === 'string') {
    const match = groupParticipants.find(
      (p) => p.name.toLowerCase() === (parsed.payerName as string).toLowerCase()
    );
    if (match) result.payerId = match.id;
  }

  return result;
}

// ─── 2. Categorize Expense ─────────────────────────────────────────────────────

export async function categorizeExpense(
  description: string,
  amount: number
): Promise<string> {
  const systemPrompt = `You are an expense categorizer. Return ONLY a single category word from: Food, Transport, Entertainment, Accommodation, Shopping, Utilities, Healthcare, Other. No explanation, no punctuation, just one word.`;

  const userPrompt = `${description} - ₹${amount}`;

  const result = await callGroq(systemPrompt, userPrompt);
  // Strip any stray whitespace / newlines
  return result.trim().split(/\s+/)[0] || 'Other';
}

// ─── 3. Generate Group Summary ──────────────────────────────────────────────────

export async function generateGroupSummary(
  group: Group,
  expenses: Expense[],
  balances: Record<string, number>
): Promise<string> {
  const systemPrompt = `You are a friendly financial assistant. Write a brief 3-4 sentence summary of this group's spending in plain English. Mention total spent, biggest spender, and overall balance situation. Be conversational and concise.`;

  const totalSpent = expenses
    .filter((e) => e.category !== 'settlement')
    .reduce((s, e) => s + e.amount, 0);

  // Biggest spender by paid amount
  const paidByPerson: Record<string, number> = {};
  group.participants.forEach((p) => { paidByPerson[p.name] = 0; });
  expenses
    .filter((e) => e.category !== 'settlement')
    .forEach((e) => {
      const p = group.participants.find((p) => p.id === e.payerId);
      if (p) paidByPerson[p.name] = (paidByPerson[p.name] || 0) + e.amount;
    });

  // Resolve balances to names
  const namedBalances: Record<string, number> = {};
  group.participants.forEach((p) => {
    namedBalances[p.name] = balances[p.id] || 0;
  });

  const recentExpenses = expenses
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((e) => ({
      description: e.description,
      amount: e.amount,
      payer: group.participants.find((p) => p.id === e.payerId)?.name,
    }));

  const payload = {
    groupName: group.name,
    participants: group.participants.map((p) => p.name),
    totalSpent,
    expenseCount: expenses.filter((e) => e.category !== 'settlement').length,
    paidByPerson,
    balances: namedBalances,
    recentExpenses,
  };

  const userPrompt = JSON.stringify(payload);
  return callGroq(systemPrompt, userPrompt);
}

// ─── 4. Explain Settlements ────────────────────────────────────────────────────

export async function explainSettlements(
  settlements: Settlement[],
  participants: Participant[]
): Promise<string> {
  const systemPrompt = `You are a helpful assistant. Convert these settlement transactions into a friendly, readable paragraph that explains who needs to pay whom and how much. Use plain English — no bullet points, no jargon, just clear sentences.`;

  const resolved = settlements.map((s) => ({
    from: participants.find((p) => p.id === s.from)?.name ?? s.from,
    to: participants.find((p) => p.id === s.to)?.name ?? s.to,
    amount: s.amount,
  }));

  const userPrompt = JSON.stringify(resolved);
  return callGroq(systemPrompt, userPrompt);
}
