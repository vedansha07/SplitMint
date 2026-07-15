# SplitMint

SplitMint is an intelligent bill-splitting application featuring AI-powered expense parsing, real-time balance tracking, and group financial management. The application is built with React, TypeScript, and Groq AI to provide a premium, efficient experience for managing shared finances.

---

## Technical Features

### Core Expense Management
- **Multi-Group Support**: Create and manage multiple groups with independent ledgers.
- **Precision Splitting**: Automatic equal division with remainder handling to ensure absolute accuracy.
- **Custom Distributions**: Manually assign exact currency amounts with real-time validation.
- **Percentage-Based Shares**: Allocate expenses based on percentage shares with automated total validation.
- **Full Lifecycle Management**: Add, modify, and remove expenses with instantaneous global balance recalculation.
- **Debt Optimization**: Utilizes a greedy algorithm to compute the minimum number of transactions required to settle all debts.
- **Settlement Tracking**: Direct recording of repayments and settlement status within the application.

### MintSense AI Intelligence
- **Natural Language Processing**: Parse raw text descriptions into structured expense data automatically.
- **Automated Categorization**: Real-time, debounced AI categorization based on expense descriptions.
- **Insight Generation**: Automated financial summaries providing concise overviews of group spending patterns.
- **Settlement Clarification**: Plain-language explanations of complex settlement matrices.

### Analytics and Visualization
- **Directional Debt Matrix**: A comprehensive table showing precise debt flows between all participants.
- **Financial Visualizations**: Integrated Recharts components for visualizing contribution and spending metrics.
- **Global Overview**: Consolidated summary cards for total expenditure, outstanding debt, and expected credits.
- **Audit Logging**: Comprehensive transaction history with advanced filtering, sorting, and CSV export capabilities.

### User Experience and Robustness
- **Persistence Layer**: LocalStorage-based state persistence using Zustand middleware for zero-latency data recovery.
- **Reliability Guards**: Prevents data inconsistency, such as removing participants who have active transaction history.
- **Interface Flexibility**: Optimized navigation including a dedicated mobile-responsive bottom navigation system.

---

## Technology Stack

| Component | Technology |
|---|---|
| Core Framework | React 18 / TypeScript |
| Build System | Vite 8 |
| Styling Architecture | Tailwind CSS v4 |
| State Management | Zustand with Persistence Middleware |
| Application Routing | React Router v7 |
| Artificial Intelligence | Groq API (Llama 3.3 70B model) |
| Graphic Components | Recharts |
| Logical Utilities | Date-fns, UUID v4 |

---

## Installation and Deployment

### Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_GROQ_API_KEY=your_api_key_here
   ```
   API keys can be obtained from the Groq Console.

3. **Execute Development Server**
   ```bash
   npm run dev
   ```
   The application will be accessible at http://localhost:5173.

4. **Production Compilation**
   ```bash
   npm run build
   ```
   The production-ready assets will be generated in the `dist/` directory.

### Vercel Deployment

The project includes a `vercel.json` configuration for seamless deployment on Vercel.

1. Connect the repository to Vercel.
2. Ensure the `VITE_GROQ_API_KEY` is configured in the environment variables section.
3. The configuration handles Single Page Application (SPA) routing by redirecting all paths to `index.html`.

---

## Technical Architecture

### Data Architecture
SplitMint utilizes a client-side architecture with Zustand for state management. Data is persisted in `localStorage` under the `splitmint-storage` key, allowing for full state recovery across browser sessions without requiring a dedicated backend.

### Balance Calculation Engine
Balance distributions are computed by aggregating deltas across all transactions:
- **Payers**: Credit added for the total transaction amount.
- **Participants**: Debit deducted based on their calculated share.
- **Net Balance**: The sum of all credits and debits, where positive values indicate credit and negative values indicate debt.

---

## Verified System Behaviors

| Feature | Verified Behavior |
|---|---|
| Group Deletion | Atomic removal of group records and associated expense history. |
| Reactive Updates | Immediate recalculation of all derived views upon expense modification. |
| Matrix Integrity | Verified directional accuracy in the debt matrix. |
| Participant Integrity | Deletion protection for participants with link-to-history constraints. |
| Input Validation | Strict enforcement of split totals for custom and percentage modes. |
