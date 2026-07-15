# SplitMint 🌿

> An intelligent bill-splitting app with AI-powered expense parsing, real-time balance tracking, and group financial management — built with React, TypeScript, and Groq AI.

---

## ✨ Feature List

### Core Expense Splitting
- **Groups** — Create up to 4-person groups; each group has its own ledger
- **Equal Split** — Paise-precise division with remainder assigned to first participant
- **Custom Split** — Manually assign exact rupee amounts per person (live validation)
- **Percentage Split** — Assign % shares summing to 100 (live validation)
- **Expense CRUD** — Add, edit, and delete expenses with full balance recalculation
- **Settlements** — Greedy algorithm computes minimum transactions to settle all debts
- **Mark as Settled** — Record repayments directly from the Settle Up tab

### MintSense AI ✦ (Powered by Groq / Llama 3.3)
- **Natural Language Parsing** — Describe an expense in plain English; AI pre-fills the form
- **Auto-Categorization** — 800ms debounced AI categorization as you type the description
- **Group Summary** — 3-4 sentence AI-generated financial summary for any group
- **Explain Settlements** — Plain-English explanation of who needs to pay whom

### Visualizations & Analytics
- **Balance Matrix** — Directional debt table showing who owes whom
- **Contribution Chart** — Recharts bar chart of total paid per participant
- **Summary Cards** — Total spent, you owe, you're owed (per group and globally)
- **Transaction History** — Full filterable, sortable history across all groups with CSV export

### UX & Polish
- **Auth** — Register / Login with localStorage persistence (Zustand + `persist`)
- **Toast Notifications** — Success/error feedback for all actions (react-hot-toast)
- **Confirm Modals** — Custom dark-themed modals replacing `window.confirm`
- **Loading States** — Spinners on all async operations (form submit, AI calls)
- **Empty States** — Contextual CTAs when groups/expenses are empty
- **Participant Guard** — Prevents removing participants linked to existing expenses
- **Mobile Navigation** — Bottom nav bar for mobile viewports
- **`(You)` Labels** — Current user is tagged in all participant lists

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| State / Persistence | Zustand + `persist` middleware (localStorage) |
| Routing | React Router v7 |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Charts | Recharts |
| Date Formatting | date-fns |
| Toast | react-hot-toast |
| IDs | uuid v4 |

---

## 🚀 Setup & Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

> Get a free API key at [console.groq.com](https://console.groq.com)

### 3. Start the development server

```bash
npm run dev
```

App runs at **http://localhost:5173**

### 4. Production build

```bash
npm run build
```

Output is in the `dist/` directory.

---

## ☁️ Deploying to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. Set `VITE_GROQ_API_KEY` in Vercel's **Environment Variables** settings.

### Option B: Vercel Dashboard (recommended)

1. Push the repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Set **Framework Preset** → `Vite`
4. Add environment variable `VITE_GROQ_API_KEY` in **Settings → Environment Variables**
5. Deploy

> The included `vercel.json` handles SPA routing — all paths are rewritten to `index.html`.

---

## 🗄 Data Persistence

SplitMint uses **Zustand's `persist` middleware** to store all state (users, groups, expenses) in `localStorage` under the key `splitmint-storage`.

- **Page refresh** → all data is instantly restored
- **Multiple tabs** → all tabs share the same localStorage state
- **No backend required** — fully client-side

To reset all data, run in the browser console:
```js
localStorage.removeItem('splitmint-storage')
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AiModal.tsx          # MintSense AI result modal
│   ├── BalanceTable.tsx     # Directional debt matrix
│   ├── BottomNav.tsx        # Mobile navigation bar
│   ├── ConfirmModal.tsx     # Reusable confirmation dialog
│   ├── ContributionChart.tsx # Recharts bar visualization
│   ├── Ledger.tsx           # Expense list with color coding
│   ├── ProtectedRoute.tsx   # Auth guard
│   ├── Settlements.tsx      # Settlement list + mark settled
│   └── SummaryCards.tsx     # Balance summary cards
├── pages/
│   ├── DashboardPage.tsx    # Global overview + group list
│   ├── ExpenseFormPage.tsx  # Add/edit expense + AI parse
│   ├── GroupDetailPage.tsx  # Group tabs: overview/expenses/balances/settle
│   ├── History.tsx          # Transaction history + filters + CSV export
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── services/
│   └── mintSense.ts         # All Groq AI API calls
├── store/
│   └── index.ts             # Zustand store with persist
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   ├── format.ts            # Intl currency formatter
│   └── splitCalculator.ts   # Split math + balance + settlement engine
└── App.tsx                  # Routes
```

---

## 🧮 Balance Logic Explained

For every expense:
- **Payer** gets `+amount` (they fronted the money)
- **Each share holder** gets `-share.amount` (they consumed that value)

Net balance = sum of all deltas across all expenses.
- Positive balance → you are **owed** money
- Negative balance → you **owe** money

Settlements use a **greedy two-pointer algorithm** on creditors vs debtors, minimising the total number of transactions needed.

---

## ✅ Verified Behaviours

| Scenario | Result |
|---|---|
| Delete a group | Atomically removes group + all its expenses in one store update |
| Edit an expense | `updateExpense` replaces the record; all balance-derived views recalculate reactively |
| Balance matrix | Row person owes column person the displayed amount (directional) |
| Page refresh | All data restores from localStorage via Zustand persist |
| Remove participant | Blocked with an error toast if they appear in any expense |
| Custom split validation | Save button disabled until amounts sum within ±₹0.01 |
| Percentage validation | Save button disabled until percentages sum within ±0.01% of 100 |
