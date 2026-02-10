"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Wallet, TrendingUp, History, Settings, RefreshCw } from "lucide-react";
import {
  getAccountDetailsAction,
  getAccountHistoryAction,
  updateBalanceManuallyAction,
} from "@/actions/accountActions";
import { getTransactionsByAccountAction } from "@/actions/transactionActions";
import { getInvestmentsByAccountAction } from "@/actions/investmentActions";
import RecalculateBalanceModal from "@/components/RecalculateBalanceModal";
import PageLayout from "@/components/UI/PageLayout";
import Modal from "@/components/UI/Modal";
import { FormInput } from "@/components/UI/Form";
import Button from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { showSuccessToast, showErrorToast } from "@/utils/alert";
import { useTransactionStore } from "@/store/useTransactionStore";
import GeneralView from "@/components/AccountViews/GeneralView";
import DematView from "@/components/AccountViews/DematView";
import CreditCardView from "@/components/AccountViews/CreditCardView";
import FixedDepositView from "@/components/AccountViews/FixedDepositView";

const AccountDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { accounts } = useTransactionStore();

  const [account, setAccount] = useState(
    () => accounts.find((a) => a.id === id) || null,
  );

  const [history, setHistory] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [investmentSummary, setInvestmentSummary] = useState(null);
  const [dateRange, setDateRange] = useState(30);
  const [isLoading, setIsLoading] = useState(!account);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(
    account?.balance?.toString() || "",
  );
  const [isRecalculateModalOpen, setIsRecalculateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [billInfo, setBillInfo] = useState(null);

  const fetchData = useCallback(async () => {
    if (!account) setIsLoading(true);

    try {
      const accDetails = await getAccountDetailsAction(id);
      setAccount(accDetails);
      setNewBalance(accDetails.balance.toString());

      const endDate = new Date().toISOString();
      let startDate = null;
      if (dateRange !== "all") {
        const start = new Date();
        start.setDate(start.getDate() - dateRange);
        startDate = start.toISOString();
      }
      const historyData = await getAccountHistoryAction(id, startDate, endDate);
      setHistory(historyData);

      if (accDetails.type.toLowerCase().replaceAll(" ", "") === "demat") {
        const invData = await getInvestmentsByAccountAction(id);
        setInvestments(invData.investments);
        setInvestmentSummary(invData.summary);
      }

      if (accDetails.type.toLowerCase().replaceAll(" ", "") === "creditcard") {
        const txData = await getTransactionsByAccountAction(id, 200);
        if (txData.success) {
          setTransactions(txData.data);
          const info = calculateBillInfo(accDetails, txData.data);
          setBillInfo(info);
        }
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleManualBalanceUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingBalance(true);
    try {
      await updateBalanceManuallyAction(id, {
        balance: parseFloat(newBalance),
      });
      showSuccessToast("Balance updated successfully");
      fetchData();
      setIsUpdateModalOpen(false);
    } catch (error) {
      showErrorToast(error.message, "Update Failed");
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  if (isLoading && !account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-background">
          Account not found
        </h2>
        <button
          onClick={() => router.push("/dashboard/accounts")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Accounts
        </button>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: account.currency || "INR",
    }).format(value);
  };

  const getChartData = () => {
    if (dateRange === "all") return history;
    if (!account) return [];

    const days = parseInt(dateRange);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const dailyBalances = {};
    history.forEach((entry) => {
      const dateStr = new Date(entry.date).toISOString().split("T")[0];
      dailyBalances[dateStr] = entry.balance;
    });

    const data = [];

    let currentVal = history.length > 0 ? history[0].balance : account.balance;

    for (let d = 0; d <= days; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split("T")[0];

      if (dailyBalances[dateStr] !== undefined) {
        currentVal = dailyBalances[dateStr];
      }

      data.push({
        date: dateStr,
        balance: currentVal,
      });
    }
    return data;
  };

  const calculateBillInfo = (acc, txs) => {
    if (
      acc.type.toLowerCase().replaceAll(" ", "") !== "creditcard" ||
      !acc.billingDay
    )
      return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();

    let statementDate;
    if (today >= acc.billingDay) {
      statementDate = new Date(currentYear, currentMonth, acc.billingDay);
    } else {
      statementDate = new Date(currentYear, currentMonth - 1, acc.billingDay);
    }

    const cycleStartDate = new Date(statementDate);
    cycleStartDate.setDate(cycleStartDate.getDate() + 1);

    const lastStatementDate = new Date(statementDate);
    const lastCycleStartDate = new Date(lastStatementDate);
    lastCycleStartDate.setMonth(lastCycleStartDate.getMonth() - 1);
    lastCycleStartDate.setDate(lastCycleStartDate.getDate() + 1);

    let dueDate = new Date(statementDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(acc.dueDay || 1);

    const currentPeriodTransactions = txs.filter(
      (t) => new Date(t.date) >= cycleStartDate,
    );
    const lastPeriodTransactions = txs.filter((t) => {
      const d = new Date(t.date);
      return d >= lastCycleStartDate && d <= lastStatementDate;
    });

    const calculateSum = (txList) =>
      txList.reduce((accSum, t) => {
        if (t.accountId === acc.id) return accSum + t.amount;
        if (t.destinationAccountId === acc.id) return accSum - t.amount;
        return accSum;
      }, 0);

    return {
      currentPeriodAmount: calculateSum(currentPeriodTransactions),
      lastStatementAmount: calculateSum(lastPeriodTransactions),
      dueDate,
      statementDate,
      cycleStartDate,
      availableCredit: acc.creditLimit ? acc.creditLimit - acc.balance : null,
    };
  };

  const renderAccountView = () => {
    switch (account.type.toLowerCase().replaceAll(" ", "")) {
      case "creditcard":
        return (
          <CreditCardView
            account={account}
            history={history}
            dateRange={dateRange}
            setDateRange={setDateRange}
            formatCurrency={formatCurrency}
            getChartData={getChartData}
            billInfo={billInfo}
            transactions={transactions}
          />
        );
      case "demat":
        return (
          <DematView
            account={account}
            history={history}
            dateRange={dateRange}
            setDateRange={setDateRange}
            formatCurrency={formatCurrency}
            getChartData={getChartData}
            investments={investments}
            investmentSummary={investmentSummary}
            onRefresh={fetchData}
          />
        );
      case "fixeddeposit":
        // TODO : when the time is reached for the maturity then what to do? do we need to credit it to some account or what to do?
        return (
          <FixedDepositView
            account={account}
            history={history}
            dateRange={dateRange}
            setDateRange={setDateRange}
            formatCurrency={formatCurrency}
            getChartData={getChartData}
          />
        );
      default:
        return (
          <GeneralView
            account={account}
            history={history}
            dateRange={dateRange}
            setDateRange={setDateRange}
            formatCurrency={formatCurrency}
            getChartData={getChartData}
          />
        );
    }
  };

  return (
    <PageLayout
      title={account.name}
      subtitle={`${account.type.toUpperCase()} ACCOUNT • ${account.currency}`}
      actions={[
        {
          label: "Recalculate",
          icon: RefreshCw,
          onClick: () => setIsRecalculateModalOpen(true),
          variant: "secondary",
        },
        ...(account.type !== "demat"
          ? [
              {
                label: "Update Balance",
                icon: Wallet,
                onClick: () => setIsUpdateModalOpen(true),
              },
            ]
          : []),
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">{renderAccountView()}</div>

        <div className="space-y-8">
          <Card title="Recent Updates" icon={History}>
            <div className="space-y-4">
              {history
                .slice()
                .reverse()
                .slice(0, 5)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center py-3 border-b border-foreground/5 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tighter">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-black uppercase tracking-widest text-foreground/69">
                        {entry.source}
                      </p>
                    </div>
                    <p className="text-sm font-black italic">
                      {formatCurrency(entry.balance)}
                    </p>
                  </div>
                ))}
              {history.length === 0 && (
                <p className="text-sm text-foreground/69 text-center py-4 italic uppercase font-bold">
                  No history entries yet.
                </p>
              )}
            </div>
          </Card>

          <Card title="Account Details" icon={Settings}>
            <div className="space-y-4 text-xs font-bold uppercase tracking-tight">
              <div className="flex justify-between">
                <span className="text-foreground/69">Currency</span>
                <span>{account.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/69">Created</span>
                <span>{new Date(account.createdAt).toLocaleDateString()}</span>
              </div>
              {account.maskNumber && (
                <div className="flex justify-between">
                  <span className="text-foreground/69">Account Number</span>
                  <span className="tracking-widest">
                    ****{account.maskNumber}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <RecalculateBalanceModal
        isOpen={isRecalculateModalOpen}
        onClose={() => setIsRecalculateModalOpen(false)}
        accountId={id}
        accountName={account.name}
        currentBalance={account.balance}
        currency={account.currency}
        onResolved={fetchData}
      />

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Balance"
        size="md"
      >
        <form onSubmit={handleManualBalanceUpdate} className="space-y-8">
          <FormInput
            label="New Liquidity Level"
            type="number"
            step="0.01"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            placeholder="0.00"
            required
          />
          <Button type="submit" disabled={isUpdatingBalance} className="w-full">
            {isUpdatingBalance ? "SYNCHRONIZING..." : "CONFIRM UPDATE"}
          </Button>
        </form>
      </Modal>
    </PageLayout>
  );
};

export default AccountDetailPage;
