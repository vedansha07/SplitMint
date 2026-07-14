export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // stored as plain text for this demo
}

export interface Participant {
  id: string;
  name: string;
  color?: string; // hex color string
  avatar?: string; // initials fallback
}

export interface Group {
  id: string;
  name: string;
  participants: Participant[]; // max 3 + primary user = 4 total
  createdBy: string; // user id
  createdAt: string;
}

export interface SplitShare {
  participantId: string;
  amount: number; // always in rupees with 2 decimal places
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  date: string; // ISO string
  payerId: string; // participant id
  splitMode: 'equal' | 'custom' | 'percentage';
  shares: SplitShare[]; // must sum to expense.amount
  category?: string;
  createdAt: string;
}

export interface Balance {
  fromId: string; // who owes
  toId: string;   // who is owed
  amount: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
