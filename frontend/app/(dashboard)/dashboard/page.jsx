"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { checkAuth } from "@/actions/authActions";
import {
  fetchPendingBills,
  snoozeBillAction,
  markBillPaidAction,
} from "@/actions/transactionActions";
import { fetchAllData } from "@/actions/miscActions";
import { showError, showBillNotification, showSuccess } from "@/utils/alert";
import { formatCurrency } from "@/utils/format";
import { StatCard } from "@/components/UI/Card";
import { BarChartCard } from "@/components/UI/Charts";
import ProgressBar from "@/components/UI/ProgressBar";
import { List, ListItem } from "@/components/UI/List";
import Tour from "@/components/UI/Tour";
import { useUserStore } from "@/store/useUserStore";
import { useTransactionStore } from "@/store/useTransactionStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const {
    transactions,
    accounts,
    budgets,
    accountTypes,
    fetchGlobalData,
    isLoading: isStoreLoading,
    isInitialized,
  } = useTransactionStore();

  const [loading, setLoading] = useState(!isInitialized);

  const dashboardSteps = [
    {
      title: "Welcome to MoneyTracker",
      intro: "Let's take a quick tour of your financial command center.",
    },
    {
      element: "#tour-sidebar",
      title: "Navigation",
      intro:
        "Use the sidebar to navigate between your Accounts, Ledger, Budgets, and more.",
    },
    {
      element: "#tour-header",
      title: "Dashboard Overview",
      intro:
        "This is your main dashboard where you can see a summary of your finances.",
    },
    {
      element: "#tour-stats",
      title: "Key Metrics",
      intro:
        "Monitor your Total Balance, Budget Left, and Net Worth at a glance.",
    },
    {
      element: "#tour-new-entry",
      title: "Quick Entry",
      intro: "Click here to quickly record a new transaction or income.",
    },
    {
      element: "#tour-chart",
      title: "Budget Analysis",
      intro: "Visualize your spending against your budget limits here.",
    },
    {
      element: "#tour-transactions",
      title: "Recent Activity",
      intro: "Keep track of your latest movements and transactions.",
    },
    {
      element: "#tour-allocations",
      title: "Budget Progress",
      intro: "See how much of your budget you've consumed for each category.",
    },
    {
      element: "#tour-accounts",
      title: "Your Accounts",
      intro: "Manage all your bank accounts, wallets, and demat accounts here.",
    },
  ];

  useEffect(() => {
    const initDashboard = async () => {
      if (!isInitialized) {
        setLoading(true);
        await fetchGlobalData();
        setLoading(false);
      } else {
        fetchGlobalData(true);
        setLoading(false);
      }

      try {
        const billsData = await fetchPendingBills();
        if (billsData.success && billsData.data.length > 0) {
          for (const bill of billsData.data) {
            const action = await showBillNotification(bill);
            if (action === "PAID") {
              await markBillPaidAction(bill.id);
              showSuccess("Bill Paid", "Transaction marked as settled.");
            } else {
              await snoozeBillAction(bill.id, 24);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    initDashboard();
  }, []);

  const assetAccounts = accounts.filter((acc) => {
    const typeInfo = accountTypes.find((t) => t.name === acc.type);
    return typeInfo
      ? typeInfo.category === "asset"
      : ["savings", "checking", "demat", "asset"].includes(
          acc.type.toLowerCase(),
        );
  });

  const liabilityAccounts = accounts.filter((acc) => {
    const typeInfo = accountTypes.find((t) => t.name === acc.type);
    return typeInfo
      ? typeInfo.category === "liability"
      : ["loan", "expense", "credit card"].includes(acc.type.toLowerCase());
  });

  const totalBalance = assetAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0,
  );

  const totalLiabilities = liabilityAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0,
  );

  const netWorth = totalBalance - totalLiabilities;

  console.log(totalBalance);

  const totalBudgetAmount = budgets.reduce(
    (sum, b) => sum + parseFloat(b.amount),
    0,
  );

  const currentMonthExpenses = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.budgetId !== null &&
        new Date(t.date).getMonth() === new Date().getMonth() &&
        new Date(t.date).getFullYear() === new Date().getFullYear(),
    )
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const monthlyBudgetLeft = totalBudgetAmount - currentMonthExpenses;
  const userName = user?.name || "User";

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground font-mono tracking-widest uppercase text-xs animate-pulse">
          Loading...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 text-foreground font-sans">
      <Tour steps={dashboardSteps} tourKey="dashboard" />
      <div
        id="tour-header"
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-foreground/10"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Dashboard
          </h1>
          <p className="text-zinc-400 font-medium mt-2">
            Welcome back, {userName}.
          </p>
        </div>
        <div className="flex gap-4 mt-6 md:mt-0">
          <button
            id="tour-new-entry"
            onClick={() => router.push("/dashboard/transactions?action=new")}
            className="flex items-center gap-2 px-5 py-2 border border-(--foreground) rounded-full text-xs font-black uppercase hover:bg-foreground hover:text-background transition-all"
          >
            <Plus size={14} /> New Transaction
          </button>
          <button
            id="tour-new-entry"
            onClick={() => router.push("/dashboard/transactions?action=new")}
            className="flex items-center gap-2 px-5 py-2 border border-(--foreground) rounded-full text-xs font-black uppercase hover:bg-foreground hover:text-background transition-all"
          >
            <Plus size={14} /> New Account
          </button>
        </div>
      </div>

      <div
        id="tour-stats"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-(--foreground)"
      >
        <StatCard
          title="Balance"
          amount={totalBalance}
          symbol={user?.currency}
        />
        <StatCard
          title="Budget Left"
          amount={monthlyBudgetLeft}
          symbol={user?.currency}
        />
        <StatCard title="Net Worth" amount={netWorth} symbol={user?.currency} />
        <StatCard
          title="Budgets"
          amount={budgets.length}
          symbol=""
          subtext="Active Allocations"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 mt-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <div id="tour-chart">
            {/* {console.log(budgets)} */}
            <BarChartCard
              title="Budget Analysis"
              action={
                <span
                  onClick={() => router.push("/dashboard/budgets")}
                  className="text-xs font-bold border-b border-foreground cursor-pointer"
                >
                  MANAGE
                </span>
              }
              data={budgets}
              xAxisKey="name"
              dataKeys={[
                {
                  dataKey: "amount",
                  name: "Limit",
                  fill: "var(--foreground)",
                  opacity: 0.1,
                  barSize: 30,
                },
                {
                  dataKey: "spent",
                  name: "Spent",
                  fill: "var(--foreground)",
                  barSize: 30,
                },
              ]}
              height={300}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-foreground/5">
            <div id="tour-transactions" className="space-y-6">
              <h3 className="font-black uppercase tracking-widest text-sm">
                Recent Movements
              </h3>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((t, i) => (
                  <div
                    key={i}
                    className="flex justify-between border-b border-foreground/5 pb-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase">
                        {t.description}
                      </span>
                      <span className="text-xs text-zinc-400 font-bold">
                        {new Date(t.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black ${
                        t.type === "income" ? "text-green-600" : ""
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount, user?.currency || "INR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div id="tour-allocations" className="space-y-6">
              <h3 className="font-black uppercase tracking-widest text-sm">
                Allocations
              </h3>
              <div className="space-y-6">
                {budgets.slice(0, 4).map((b, i) => (
                  <ProgressBar
                    key={i}
                    label={b.name}
                    current={b.spent}
                    total={b.amount}
                    formatValue={(val) =>
                      formatCurrency(val, user?.currency || "INR")
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="tour-accounts" className="lg:col-span-4 space-y-12">
          <div className="space-y-6">
            <h3 className="font-black uppercase tracking-widest text-sm">
              Accounts
            </h3>
            <List>
              {accounts.map((acc) => (
                <ListItem
                  key={acc.id}
                  title={acc.name}
                  subtitle={acc.type}
                  value={formatCurrency(acc.balance, user?.currency || "INR")}
                  icon={acc.name[0]}
                  onClick={() => router.push(`/dashboard/accounts/${acc.id}`)}
                />
              ))}
            </List>
            <button
              onClick={() => router.push("/dashboard/accounts")}
              className="w-full text-center text-xs font-black border border-(--foreground)/10 py-3 hover:border-(--foreground) transition-all uppercase tracking-tighter"
            >
              Manage All Accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
