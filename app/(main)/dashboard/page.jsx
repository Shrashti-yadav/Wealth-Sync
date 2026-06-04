import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { StatsCard } from "./_components/stats-card";
import { ExpenseChart } from "./_components/expense-chart";
import { TransactionList } from "./_components/transaction-list";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

// ✅ INR formatter (₹ Indian Rupee)
const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const defaultAccount = accounts?.find((account) => account.isDefault);

  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  // Calculate stats
  const totalBalance =
    accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  const currentDate = new Date();
  const currentMonthTransactions =
    transactions?.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
      );
    }) || [];

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netSavings = totalIncome - totalExpenses;

  // Expense by category for pie chart
  const expensesByCategory = currentMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

  const pieChartData = Object.entries(expensesByCategory).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="space-y-8">

      {/* Stats Cards — ✅ icon passed as string */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Balance"
          value={formatINR(totalBalance)}
          change="Across all accounts"
          changeType="neutral"
          icon="Wallet"
          delay={0}
        />
        <StatsCard
          title="Monthly Income"
          value={formatINR(totalIncome)}
          change="This month"
          changeType="positive"
          icon="TrendingUp"
          delay={0.05}
        />
        <StatsCard
          title="Monthly Expenses"
          value={formatINR(totalExpenses)}
          change="This month"
          changeType="negative"
          icon="TrendingDown"
          delay={0.1}
        />
        <StatsCard
          title="Net Savings"
          value={formatINR(netSavings)}
          change={
            netSavings >= 0
              ? "Positive savings"
              : "Spending exceeds income"
          }
          changeType={netSavings >= 0 ? "positive" : "negative"}
          icon="IndianRupee"
          delay={0.15}
        />
      </div>

      {/* Budget Progress */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Charts & Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseChart data={pieChartData} />
        <TransactionList transactions={transactions || []} />
      </div>

      {/* Accounts Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your Accounts
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer>
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-dashed hover:border-primary/50 h-full">
              <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full min-h-[200px]">
                <div className="p-4 rounded-full bg-primary/10 mb-3">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium">Add New Account</p>
                <p className="text-sm text-center mt-1">
                  Connect your bank or create a manual account
                </p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>

          {accounts?.length > 0 &&
            accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
        </div>
      </div>
    </div>
  );
}