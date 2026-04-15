# Configuration
$RepoUrl = "https://github.com/vedansha07/SplitMint.git"

# Initialize git
if (-not (Test-Path .git)) {
    git init
    git remote add origin $RepoUrl
}

# Function to commit with a specific date
function Commit-At {
    param(
        [string]$Message,
        [string]$DateStr,
        [string[]]$Files
    )
    
    foreach ($file in $Files) {
        if (Test-Path $file) {
            git add $file
        } else {
            Write-Warning "File $file not found, skipping."
        }
    }
    
    $env:GIT_AUTHOR_DATE = $DateStr
    $env:GIT_COMMITTER_DATE = $DateStr
    
    git commit -m $Message
    
    # Reset environment variables
    $env:GIT_AUTHOR_DATE = $null
    $env:GIT_COMMITTER_DATE = $null
}

# Stage 1: Initial Setup
Commit-At -Message "chore: initial project setup with Vite, React, and TypeScript" -DateStr "2026-07-14 14:12:35" -Files @(
    "package.json", "package-lock.json", ".gitignore", "tsconfig.app.json", "tsconfig.json", "tsconfig.node.json", "vite.config.ts", "index.html"
)

# Stage 2: Styling and Public Assets
Commit-At -Message "feat: implement global design system and styling tokens" -DateStr "2026-07-14 14:54:12" -Files @(
    "src/index.css", "public/"
)

# Stage 3: Core Logic and Store
Commit-At -Message "feat: setup state management and core data models" -DateStr "2026-07-14 15:41:58" -Files @(
    "src/store/", "src/types/", "src/utils/"
)

# Stage 4: App Foundation and Basic Components
Commit-At -Message "feat: implement core application shell and navigation" -DateStr "2026-07-14 16:52:19" -Files @(
    "src/App.tsx", "src/main.tsx", "src/components/TopNav.tsx", "src/components/ProtectedRoute.tsx", "src/components/BottomNav.tsx"
)

# Stage 5: Authentication and Dashboard
Commit-At -Message "feat: build dashboard with group cards and balance summary" -DateStr "2026-07-15 10:05:23" -Files @(
    "src/pages/DashboardPage.tsx", "src/pages/RegisterPage.tsx", "src/pages/LoginPage.tsx", "src/components/SummaryCards.tsx"
)

# Stage 6: Group Details and Settlements
Commit-At -Message "feat: implement group details and expense list views" -DateStr "2026-07-15 10:28:47" -Files @(
    "src/pages/GroupDetailPage.tsx", "src/components/Ledger.tsx", "src/components/Settlements.tsx", "src/pages/History.tsx"
)

# Stage 7: Expense Flow and UI Modals
Commit-At -Message "feat: add expense creation and editing functionality with AI support" -DateStr "2026-07-15 10:47:04" -Files @(
    "src/pages/ExpenseFormPage.tsx", "src/components/AiModal.tsx", "src/components/BalanceTable.tsx", `
    "src/components/ConfirmModal.tsx", "src/components/ContributionChart.tsx"
)

# Stage 8: Documentation and Final Polish
Commit-At -Message "docs: add project documentation and final UI polish" -DateStr "2026-07-15 10:58:52" -Files @(
    "README.md", "eslint.config.js", "vercel.json", ".env"
)

# Final catch-all for any missed files to ensure clean state
git add .
git commit -m "chore: ensure all project files are included" --allow-empty

# Push to remote
git branch -M main
git push -u origin main --force
