import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { User, Group, Expense, Participant } from '../types';

// ─── State Shape ────────────────────────────────────────────────────────────

interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: User | null;
  users: User[];

  // ── Data ──────────────────────────────────────────────────────────────────
  groups: Group[];
  expenses: Expense[];

  // ── Auth Actions ──────────────────────────────────────────────────────────

  /** Register a new user. Throws error if email already exists. */
  register: (name: string, email: string, password: string) => User;

  /** Attempt login; returns true on success, false on failure. */
  login: (email: string, password: string) => boolean;

  /** Clear the current session. */
  logout: () => void;

  // ── Group Actions ─────────────────────────────────────────────────────────

  /** Create a new group (max 3 non-primary participants). Returns the new group. */
  addGroup: (name: string, participants: Omit<Participant, 'id'>[]) => Group;

  /** Update an existing group's name or participants. */
  updateGroup: (
    groupId: string,
    updates: Partial<Pick<Group, 'name' | 'participants'>>
  ) => void;

  /** Remove a group and all its associated expenses. */
  deleteGroup: (groupId: string) => void;

  // ── Expense Actions ───────────────────────────────────────────────────────

  /** Add a new expense to a group. Returns the new expense. */
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;

  /** Update an existing expense. */
  updateExpense: (expenseId: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;

  /** Delete a single expense by id. */
  deleteExpense: (expenseId: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────────────────
      currentUser: null,
      users: [],
      groups: [],
      expenses: [],

      // ── Auth ─────────────────────────────────────────────────────────────

      register: (name, email, password) => {
        const { users } = get();
        if (users.some((u) => u.email === email)) {
          throw new Error('Email already registered');
        }

        const newUser: User = { id: uuidv4(), name, email, password };
        set({
          users: [...users, newUser],
          currentUser: newUser,
        });
        return newUser;
      },

      login: (email, password) => {
        const { users } = get();
        const user = users.find(
          (u) => u.email === email && u.password === password
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null }),

      // ── Groups ────────────────────────────────────────────────────────────

      addGroup: (name, participantDrafts) => {
        const { currentUser } = get();
        if (!currentUser) throw new Error('Must be logged in to create a group.');

        // Inject the current user as the first participant
        const primaryParticipant: Participant = {
          id: currentUser.id, // match their real user ID
          name: currentUser.name,
          avatar: currentUser.name.slice(0, 2).toUpperCase(),
          color: '#10b981', // emerald-500 as default
        };

        // Enforce max 3 non-primary participants (4 total including currentUser)
        const capped = participantDrafts.slice(0, 3);

        const additionalParticipants: Participant[] = capped.map((p) => ({
          id: uuidv4(),
          name: p.name,
          color: p.color || '#6b7280', // gray-500 as fallback
          avatar: p.avatar ?? p.name.slice(0, 2).toUpperCase(),
        }));

        const newGroup: Group = {
          id: uuidv4(),
          name,
          participants: [primaryParticipant, ...additionalParticipants],
          createdBy: currentUser.id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ groups: [...state.groups, newGroup] }));
        return newGroup;
      },

      updateGroup: (groupId, updates) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
          expenses: state.expenses.filter((e) => e.groupId !== groupId),
        }));
      },

      // ── Expenses ──────────────────────────────────────────────────────────

      addExpense: (expenseDraft) => {
        const newExpense: Expense = {
          ...expenseDraft,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ expenses: [...state.expenses, newExpense] }));
        return newExpense;
      },

      updateExpense: (expenseId, updates) => {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === expenseId ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteExpense: (expenseId) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== expenseId),
        }));
      },
    }),
    {
      name: 'splitmint-storage', // localStorage key
    }
  )
);
