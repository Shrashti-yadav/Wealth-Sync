# 💰 WealthSync — AI-Powered Personal Finance Management Platform

WealthSync is a full-stack Next.js application that helps users track expenses, manage budgets, scan receipts with AI, and get personalized financial insights through an AI chatbot and automated monthly reports.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | PostgreSQL via Prisma ORM |
| AI | Google Gemini (`gemini-2.5-flash`) |
| Background Jobs | Inngest |
| Email | React Email + Resend |
| Rate Limiting | Arcjet |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Animations | Framer Motion |
| Form Validation | React Hook Form + Zod |
| Toasts | Sonner |

---

## ✨ Features

### 🏦 Account Management
- Create multiple accounts (Current / Savings)
- Set a default account
- View per-account transaction history with bar chart
- Real-time balance updates on transactions

### 💸 Transactions
- Add income and expense transactions
- Filter by type, recurring, and search by description
- Sort by date, amount, category
- Bulk delete with checkbox selection
- Edit existing transactions
- Paginated table (10 per page)

### 🤖 AI Receipt Scanner
- Upload a receipt image (max 5MB)
- Gemini AI auto-fills amount, date, description, category

### 📊 Dashboard
- Stats cards: Total Balance, Monthly Income, Expenses, Net Savings
- Monthly expense pie chart by category
- Recent transactions list
- Budget progress bar with color-coded alerts

### 🎯 Budget Management
- Set a monthly budget for the default account
- Progress bar: green < 75%, yellow 75–90%, red ≥ 90%
- Inline edit mode

### 💬 AI Chatbot
- Floating chat widget available on every page
- Quick suggestion pills (Summary, Expenses, Income, Budget, Tips)
- Powered by `chatWithAI` server action

### 📧 Automated Emails (Inngest)
| Job | Schedule | Description |
|---|---|---|
| `triggerRecurringTransactions` | Daily midnight | Finds and fans out due recurring transactions |
| `processRecurringTransaction` | On event | Creates new transaction copy, updates balance |
| `generateMonthlyReports` | 1st of month | Sends AI-generated monthly summary email |
| `checkBudgetAlerts` | Every 6 hours | Sends alert at 80%, 90%, 100% budget usage |

### ⭐ Feedback System
- Authenticated users can submit one review (name, email, star rating, message)
- Reviews shown as testimonials on the landing page
- Average rating displayed live

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# Database
DATABASE_URL=

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Gemini AI
GEMINI_API_KEY=

# Inngest
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=

# Arcjet Rate Limiting
ARCJET_KEY=

# Email (Resend)
RESEND_API_KEY=
```

---

## 🛠️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/wealthsync.git
cd wealthsync
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up the database
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Seed the database (development only)
```bash
# Visit in browser or curl:
GET /api/seed
```
> ⚠️ Remove or protect this route before deploying to production.

### 5. Start the development server
```bash
npm run dev
```

### 6. Start the Inngest dev server (for background jobs)
```bash
npx inngest-cli@latest dev
```

---

## 🗄️ Database Models

| Model | Description |
|---|---|
| `User` | Synced from Clerk on first login |
| `Account` | Bank/savings accounts per user |
| `Transaction` | Income/expense entries with recurring support |
| `Budget` | Monthly budget per user with alert tracking |
| `Feedback` | One review per user |

---

Made with ❤️
