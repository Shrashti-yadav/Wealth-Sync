"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { unstable_cache, revalidateTag } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =========================
// 🔥 CACHE LAYER
// =========================

const getCachedTransactions = (userId, startOfMonth) =>
  unstable_cache(
    async () => {
      return db.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth },
        },
        include: {
          account: {
            select: {
              name: true,
              type: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: 50,
      });
    },
    [`transactions-${userId}-${startOfMonth.toISOString()}`],
    {
      revalidate: 60,
      tags: [`transactions-${userId}`],
    }
  )();

const getCachedLastMonthTransactions = (userId, start, end) =>
  unstable_cache(
    async () => {
      return db.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
      });
    },
    [`last-month-${userId}`],
    {
      revalidate: 120,
      tags: [`transactions-${userId}`],
    }
  )();

const getCachedBudget = (userId) =>
  unstable_cache(
    async () => {
      return db.budget.findFirst({
        where: { userId },
      });
    },
    [`budget-${userId}`],
    {
      revalidate: 300,
      tags: [`budget-${userId}`],
    }
  )();

const getCachedAccounts = (userId) =>
  unstable_cache(
    async () => {
      return db.account.findMany({
        where: { userId },
      });
    },
    [`accounts-${userId}`],
    {
      revalidate: 300,
      tags: [`accounts-${userId}`],
    }
  )();

const getCachedRecurringTransactions = (userId) =>
  unstable_cache(
    async () => {
      return db.transaction.findMany({
        where: {
          userId,
          isRecurring: true,
        },
      });
    },
    [`recurring-${userId}`],
    {
      revalidate: 300,
      tags: [`transactions-${userId}`],
    }
  )();

// =========================
// 🚀 CACHE INVALIDATION
// =========================

export async function invalidateFinancialCache(userId) {
  revalidateTag(`transactions-${userId}`);
  revalidateTag(`budget-${userId}`);
  revalidateTag(`accounts-${userId}`);
}

// =========================
// 🤖 MAIN CHAT FUNCTION
// =========================

export async function chatWithAI(userMessage, chatHistory = []) {
  try {
    // const { userId } = await auth();
    // if (!userId) throw new Error("Unauthorized");

    // const user = await db.user.findUnique({
    //   where: { clerkUserId: userId },
    // });
    // if (!user) throw new Error("User not found");
    const { userId } = await auth();
if (!userId) {
  return {
    success: true,
    data: "🔐 Please log in first to use WealthSync AI!\n\nSign in to get personalized financial insights, track your expenses, and chat with your AI assistant. 💼",
  };
}

const user = await db.user.findUnique({
  where: { clerkUserId: userId },
});
if (!user) {
  return {
    success: true,
    data: "👤 Account not found. Please complete your sign-up to get started! 🚀",
  };
}
    if (!userMessage?.trim()) {
      throw new Error("Message cannot be empty");
    }
    if (userMessage.length > 500) {
      throw new Error("Message too long (max 500 chars)");
    }
    if (chatHistory.length > 20) {
      return {
        success: true,
        data: "Chat limit reached. Please clear chat to continue! 🔄",
      };
    }

    // =========================
    // 📅 DATE SETUP
    // =========================

    const currentDate = new Date();

    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const startOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );

    const endOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );

    // =========================
    // ⚡ FETCH CACHED DATA
    // =========================

    const [
      transactions,
      lastMonthTransactions,
      budget,
      accounts,
      recurringTransactions,
    ] = await Promise.all([
      getCachedTransactions(user.id, startOfMonth),
      getCachedLastMonthTransactions(
        user.id,
        startOfLastMonth,
        endOfLastMonth
      ),
      getCachedBudget(user.id),
      getCachedAccounts(user.id),
      getCachedRecurringTransactions(user.id),
    ]);

    // =========================
    // 📊 OVERALL ANALYTICS
    // =========================

    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastMonthIncome = lastMonthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseChange =
      lastMonthExpenses > 0
        ? (
            ((totalExpenses - lastMonthExpenses) /
              lastMonthExpenses) *
            100
          ).toFixed(1)
        : 0;

    const incomeChange =
      lastMonthIncome > 0
        ? (
            ((totalIncome - lastMonthIncome) /
              lastMonthIncome) *
            100
          ).toFixed(1)
        : 0;

    const savingsRate =
      totalIncome > 0
        ? (
            ((totalIncome - totalExpenses) / totalIncome) *
            100
          ).toFixed(1)
        : 0;

    const totalBalance = accounts.reduce(
      (sum, a) => sum + Number(a.balance),
      0
    );

    // =========================
    // 💳 PER ACCOUNT BREAKDOWN
    // =========================

    const accountSummary = accounts
      .map((account) => {
        const accountTxns = transactions.filter(
          (t) => t.accountId === account.id
        );
        const accIncome = accountTxns
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const accExpenses = accountTxns
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return `  • ${account.name} (${account.type})${account.isDefault ? " ⭐ Default" : ""}
    Balance: $${Number(account.balance).toFixed(2)}
    Income:  $${accIncome.toFixed(2)}
    Expenses: $${accExpenses.toFixed(2)}`;
      })
      .join("\n\n");

    // =========================
    // 📂 CATEGORY BREAKDOWN
    // =========================

    const categoryBreakdown = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => {
        acc[t.category] =
          (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {});

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(
        ([category, amount]) =>
          `  • ${category}: $${amount.toFixed(2)} (${
            totalExpenses > 0
              ? ((amount / totalExpenses) * 100).toFixed(1)
              : 0
          }%)`
      )
      .join("\n");

    // =========================
    // 🔄 RECURRING BILLS
    // =========================

    const recurringList = recurringTransactions
      .map(
        (t) =>
          `  • ${t.category}: $${Number(t.amount).toFixed(2)} / ${t.recurringInterval}`
      )
      .join("\n");

    // =========================
    // 💰 BUDGET
    // =========================

    const budgetAmount = budget ? Number(budget.amount) : 0;
    const budgetUsed =
      budgetAmount > 0
        ? ((totalExpenses / budgetAmount) * 100).toFixed(1)
        : 0;
    const budgetRemaining = budgetAmount
      ? budgetAmount - totalExpenses
      : 0;

    // =========================
    // ⚠️ ALERTS
    // =========================

    const alerts = [];

    if (Number(budgetUsed) >= 100)
      alerts.push("🚨 Over budget this month!");
    else if (Number(budgetUsed) >= 90)
      alerts.push("⚠️ Almost over budget (90%+ used)!");
    if (totalExpenses > totalIncome)
      alerts.push("🚨 Spending more than earning this month!");
    if (Number(expenseChange) > 20)
      alerts.push(
        `📈 Expenses up ${expenseChange}% vs last month!`
      );
    if (Number(savingsRate) < 20)
      alerts.push(
        "⚠️ Savings rate below 20% — try to cut expenses!"
      );

    // =========================
    // 🧠 AI CONTEXT
    // =========================

    const financialContext = `
You are WealthSync AI — a smart, friendly personal finance assistant.
You have access to ${user.name}'s real financial data for ${currentDate.toLocaleString("default", { month: "long", year: "numeric" })}.

━━━━━━━━━━━━━━━━━━━━━━
📊 MONTHLY OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━
  • Income:    $${totalIncome.toFixed(2)} (${Number(incomeChange) >= 0 ? "+" : ""}${incomeChange}% vs last month)
  • Expenses:  $${totalExpenses.toFixed(2)} (${Number(expenseChange) >= 0 ? "+" : ""}${expenseChange}% vs last month)
  • Net:       $${(totalIncome - totalExpenses).toFixed(2)}
  • Savings Rate: ${savingsRate}% ${Number(savingsRate) >= 20 ? "✅" : "⚠️"}
  • Total Balance: $${totalBalance.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━
💳 ACCOUNTS
━━━━━━━━━━━━━━━━━━━━━━
${accountSummary || "  No accounts found"}

━━━━━━━━━━━━━━━━━━━━━━
🎯 BUDGET
━━━━━━━━━━━━━━━━━━━━━━
  • Budget:    ${budgetAmount ? `$${budgetAmount.toFixed(2)}` : "Not set"}
  • Spent:     ${budgetAmount ? `$${totalExpenses.toFixed(2)} (${budgetUsed}%)` : "N/A"}
  • Remaining: ${budgetAmount ? `$${budgetRemaining.toFixed(2)}` : "N/A"}

━━━━━━━━━━━━━━━━━━━━━━
🏷️ TOP EXPENSE CATEGORIES
━━━━━━━━━━━━━━━━━━━━━━
${topCategories || "  No expenses this month"}

━━━━━━━━━━━━━━━━━━━━━━
🔄 RECURRING BILLS
━━━━━━━━━━━━━━━━━━━━━━
${recurringList || "  No recurring transactions"}

━━━━━━━━━━━━━━━━━━━━━━
📅 LAST MONTH
━━━━━━━━━━━━━━━━━━━━━━
  • Income:   $${lastMonthIncome.toFixed(2)}
  • Expenses: $${lastMonthExpenses.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━
🕐 RECENT TRANSACTIONS
━━━━━━━━━━━━━━━━━━━━━━
${
  transactions
    .slice(0, 5)
    .map(
      (t) =>
        `  • ${t.type === "INCOME" ? "💚" : "🔴"} $${Number(
          t.amount
        ).toFixed(2)} — ${t.category} [${t.account?.name || "Unknown"}] on ${new Date(
          t.date
        ).toLocaleDateString()}`
    )
    .join("\n") || "  No recent transactions"
}

${
  alerts.length > 0
    ? `━━━━━━━━━━━━━━━━━━━━━━
⚠️ ALERTS
━━━━━━━━━━━━━━━━━━━━━━
${alerts.map((a) => `  ${a}`).join("\n")}`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━
📋 RESPONSE FORMAT RULES
━━━━━━━━━━━━━━━━━━━━━━
When responding ALWAYS format like this:

For simple answers:
[emoji] Short clear answer
→ One actionable tip if relevant

For detailed analysis:
[emoji] **Title**

- Point 1
- Point 2
- Point 3

💡 **Tip:** Actionable advice here

Rules:
- Use bullet points (•) not dashes
- Bold important numbers with **
- Add relevant emojis
- Keep under 120 words
- Never show raw data dumps
- Always end with one actionable tip
- Address user as ${user.name}
- If no data available, say so kindly
`;

    // =========================
    // 🤖 GEMINI
    // =========================

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const history = chatHistory.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: financialContext }],
        },
        {
          role: "model",
          parts: [
            {
              text: `Got it! I have ${user.name}'s complete financial data and I'll format all responses clearly with bullet points and emojis. Ready to help! 💪`,
            },
          ],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    return { success: true, data: response };
  } catch (error) {
    console.error("Chatbot error:", error);

    if (error.message.includes("API_KEY")) {
      return {
        success: false,
        error: "AI service unavailable. Check API key.",
      };
    }
    if (error.message.includes("quota")) {
      return {
        success: false,
        error: "AI quota reached. Try again later.",
      };
    }

    return { success: false, error: error.message };
  }
}