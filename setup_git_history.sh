#!/bin/bash

# Configuration
REPO_URL="https://github.com/vedansha07/SplitMint.git"

# Initialize git
git init
git remote add origin "$REPO_URL"

# Function to commit with a specific date
commit_at() {
    local message="$1"
    local date_str="$2"
    shift 2
    local files=("$@")
    
    # Add files
    for file in "${files[@]}"; do
        if [ -e "$file" ]; then
            git add "$file"
        else
            echo "Warning: File $file not found, skipping."
        fi
    done
    
    # Commit with custom date
    GIT_AUTHOR_DATE="$date_str" GIT_COMMITTER_DATE="$date_str" git commit -m "$message"
}

# Stage 1: Initial Setup
commit_at "chore: initial project setup with Vite, React, and TypeScript" "2026-07-14 14:12:35" \
    "package.json" "package-lock.json" ".gitignore" "tsconfig.app.json" "tsconfig.json" "tsconfig.node.json" "vite.config.ts" "index.html"

# Stage 2: Styling and Public Assets
commit_at "feat: implement global design system and styling tokens" "2026-07-14 14:54:12" \
    "src/index.css" "public/"

# Stage 3: Core Logic and Store
commit_at "feat: setup state management and core data models" "2026-07-14 15:41:58" \
    "src/store/" "src/types/" "src/utils/"

# Stage 4: App Foundation and Basic Components
commit_at "feat: implement core application shell and navigation" "2026-07-14 16:52:19" \
    "src/App.tsx" "src/main.tsx" "src/components/TopNav.tsx" "src/components/ProtectedRoute.tsx" "src/components/BottomNav.tsx"

# Stage 5: Authentication and Dashboard
commit_at "feat: build dashboard with group cards and balance summary" "2026-07-15 10:05:23" \
    "src/pages/DashboardPage.tsx" "src/pages/RegisterPage.tsx" "src/pages/LoginPage.tsx" "src/components/SummaryCards.tsx"

# Stage 6: Group Details and Settlements
commit_at "feat: implement group details and expense list views" "2026-07-15 10:28:47" \
    "src/pages/GroupDetailPage.tsx" "src/components/Ledger.tsx" "src/components/Settlements.tsx" "src/pages/History.tsx"

# Stage 7: Expense Flow and UI Modals
commit_at "feat: add expense creation and editing functionality with AI support" "2026-07-15 10:47:04" \
    "src/pages/ExpenseFormPage.tsx" "src/components/AiModal.tsx" "src/components/BalanceTable.tsx" \
    "src/components/ConfirmModal.tsx" "src/components/ContributionChart.tsx"

# Stage 8: Documentation and Final Polish
commit_at "docs: add project documentation and final UI polish" "2026-07-15 10:58:52" \
    "README.md" "eslint.config.js" "vercel.json" ".env"

# Final catch-all for any missed files to ensure clean state
git add .
git commit -m "chore: ensure all project files are included" --allow-empty

# Push to remote
git branch -M main
git push -u origin main --force
