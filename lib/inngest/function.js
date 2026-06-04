import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ================= HELPERS ================= */

function isTransactionDue(transaction) {
  if (!transaction.lastProcessed) return true;
  return new Date(transaction.nextRecurringDate) <= new Date();
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);

  if (interval === "DAILY") next.setDate(next.getDate() + 1);
  else if (interval === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (interval === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (interval === "YEARLY") next.setFullYear(next.getFullYear() + 1);

  return next;
}

/* ================= 1. RECURRING TRANSACTION ================= */

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    triggers: [{ event: "transaction.recurring.process" }],
  },
  async ({ event, step }) => {
    await step.run("process", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      await db.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description + " (Recurring)",
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        const change =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: change } },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });

    return { success: true };
  }
);

/* ================= 2. CRON TRIGGER ================= */

export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
    triggers: [{ cron: "0 0 * * *" }],
  },
  async ({ step }) => {
    const transactions = await step.run("fetch", async () => {
      return db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          OR: [
            { lastProcessed: null },
            { nextRecurringDate: { lte: new Date() } },
          ],
        },
      });
    });

    if (!transactions.length) return { triggered: 0 };

    await inngest.send(
      transactions.map((t) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: t.id,
          userId: t.userId,
        },
      }))
    );

    return { triggered: transactions.length };
  }
);



/* ================= 3. MONTHLY REPORT ================= */

async function generateInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `
Analyze this financial data for ${month} and return ONLY a JSON array 
of exactly 3 short insight strings (no markdown, no extra text):

Income: $${stats.totalIncome.toFixed(2)}
Expenses: $${stats.totalExpenses.toFixed(2)}
Net Savings: $${(stats.totalIncome - stats.totalExpenses).toFixed(2)}
Savings Rate: ${stats.totalIncome > 0 ? (((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100).toFixed(1) : 0}%
Top Categories: ${JSON.stringify(stats.byCategory)}

Return format: ["insight 1", "insight 2", "insight 3"]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      "Track your expenses carefully to identify spending patterns.",
      "Consider reducing unnecessary spending to improve savings.",
      "Setting up a monthly budget can help you reach financial goals.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
    triggers: [{ cron: "0 0 1 * *" }],
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`report-${user.id}`, async () => {
        const now = new Date();

        // Get last month date range
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0
        );

        // Fetch last month transactions only
        const transactions = await db.transaction.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        });

        if (transactions.length === 0) return;

        // Calculate stats
        let stats = {
          totalIncome: 0,
          totalExpenses: 0,
          byCategory: {},
          month: startOfLastMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
        };

        for (const t of transactions) {
          const amt = t.amount.toNumber();
          if (t.type === "EXPENSE") {
            stats.totalExpenses += amt;
            // Category breakdown
            stats.byCategory[t.category] =
              (stats.byCategory[t.category] || 0) + amt;
          } else {
            stats.totalIncome += amt;
          }
        }

        // Generate AI insights
        const insights = await generateInsights(
          stats,
          stats.month
        );

        // Send email
        await sendEmail({
          to: user.email,
          subject: `📊 Your Monthly Financial Report - ${stats.month}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              month: stats.month,
              stats,
              insights,
            },
          }),
        });
      });
    }

    return { success: true };
  }
);

/* ================= 4. BUDGET ALERTS ================= */

// Alert thresholds — only alert once per threshold
const ALERT_THRESHOLDS = [80, 90, 100];

export const checkBudgetAlerts = inngest.createFunction(
  {
    id: "check-budget-alerts",
    name: "Check Budget Alerts",
    triggers: [{ cron: "0 */6 * * *" }],
  },
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return db.budget.findMany({
        include: {
          user: {
            include: { accounts: true },
          },
        },
      });
    });

    for (const budget of budgets) {
      const account = budget.user.accounts?.[0];
      if (!account) continue;

      await step.run(`check-budget-${budget.id}`, async () => {
        const now = new Date();

        // Start of current month
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        // Get total expenses this month
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: account.id,
            type: "EXPENSE",
            date: { gte: startOfMonth },
          },
          _sum: { amount: true },
        });

        const totalExpenses = Number(expenses._sum.amount ?? 0);
        const budgetAmount = Number(budget.amount ?? 0);

        if (budgetAmount <= 0) return;

        const percentageUsed =
          (totalExpenses / budgetAmount) * 100;

        // Get highest threshold crossed
        const currentThreshold = ALERT_THRESHOLDS.filter(
          (t) => percentageUsed >= t
        ).pop(); // e.g. 90 if between 90-100

        if (!currentThreshold) return; // below 80%, no alert

        // Last alerted threshold stored in DB
        const lastAlertedThreshold =
          budget.lastAlertThreshold ?? 0;

        // Last alert time
        const lastAlertSent = budget.lastAlertSent
          ? new Date(budget.lastAlertSent)
          : null;

        const hoursSinceLastAlert = lastAlertSent
          ? (now - lastAlertSent) / (1000 * 60 * 60)
          : Infinity;

        // ✅ Send alert ONLY if:
        // 1. New higher threshold crossed (e.g. was 80%, now 90%)
        // OR
        // 2. Same threshold but 24 hours passed (reminder)
        const isNewThreshold =
          currentThreshold > lastAlertedThreshold;
        const isReminder = hoursSinceLastAlert >= 24;

        if (!isNewThreshold && !isReminder) return;

        // Build subject based on threshold
        const subject =
          currentThreshold >= 100
            ? "🚨 Budget Exceeded!"
            : currentThreshold >= 90
            ? "⚠️ Budget Alert - 90% Used"
            : "📊 Budget Alert - 80% Used";

        await sendEmail({
          to: budget.user.email,
          subject,
          react: EmailTemplate({
            userName: budget.user.name,
            type: "budget-alert",
            data: {
              accountName: account.name,
              budgetAmount,
              totalExpenses,
              percentageUsed,
            },
          }),
        });

        // ✅ Update both lastAlertSent and lastAlertThreshold
        await db.budget.update({
          where: { id: budget.id },
          data: {
            lastAlertSent: now,
            lastAlertThreshold: currentThreshold,
          },
        });
      });
    }

    return { success: true };
  }
);