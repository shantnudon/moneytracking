"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchAllData } from "@/actions/miscActions";
import { fetchCurrencies } from "@/actions/adminActions";
import {
  fetchAccountTypes,
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
} from "@/actions/accountActions";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useUserStore } from "@/store/useUserStore";
import {
  showSuccessToast,
  showErrorToast,
  showConfirmationDialog,
} from "@/utils/alert";
import { formatCurrency } from "@/utils/format";
import PageLayout from "@/components/UI/PageLayout";
import Modal from "@/components/UI/Modal";
import { FormInput, FormSelect, FormCheckbox } from "@/components/UI/Form";
import Button from "@/components/UI/Button";
import { List, ListItem, SectionHeader } from "@/components/UI/List";
import Tour from "@/components/UI/Tour";

export default function AccountsPage() {
  const router = useRouter();
  const {
    accounts,
    setAccounts,
    currencies,
    accountTypes,
    fetchGlobalData,
    isInitialized,
  } = useTransactionStore();
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "savings",
    balance: "0",
    currency: user?.currency || "INR",
    startDate: "",
    trackHistoricData: false,
    billingDay: "",
    dueDay: "",
    creditLimit: "",
    principal: "",
    interestRate: "",
    maturityDate: "",
    tenure: "",
    maturityAmount: "0",
  });

  const accountsSteps = [
    {
      title: "Account Management",
      intro:
        "This is where you manage your financial structure, including bank accounts and debts.",
    },
    {
      element: "#tour-accounts-stats",
      title: "Financial Summary",
      intro: "See your Total Assets, Liabilities, and Net Worth at a glance.",
    },
    {
      element: "#tour-assets-list",
      title: "Asset Inventory",
      intro:
        "A list of all your positive balance accounts like Savings, Checking, and Demat.",
    },
    {
      element: "#tour-debts-list",
      title: "Debt & Expenses",
      intro: "Keep track of your loans and other liabilities here.",
    },
    {
      element: "#tour-financial-ratio",
      title: "Financial Health",
      intro:
        "The Asset to Debt ratio helps you understand your financial stability.",
    },
  ];

  useEffect(() => {
    if (!isInitialized) {
      fetchGlobalData();
    } else {
      fetchGlobalData(true);
    }
  }, []);

  useEffect(() => {
    if (["Credit Card", "Investment", "Demat"].includes(formData.type)) {
      setFormData((prev) => ({ ...prev, balance: "0" }));
    }
    if (formData.type === "Fixed Deposit" && formData.maturityAmount) {
      setFormData((prev) => ({ ...prev, balance: prev.principal || "0" }));
    }
  }, [formData.type]);

  useEffect(() => {
    if (formData.type === "Fixed Deposit") {
      const p = parseFloat(formData.principal || 0);
      const r = parseFloat(formData.interestRate || 0);
      const t = parseInt(formData.tenure || 0);
      const openDateStr = formData.startDate;

      if (p > 0 && r > 0 && t > 0) {
        const amount = p * (1 + (r / 100) * (t / 12));
        setFormData((prev) => ({
          ...prev,
          maturityAmount: amount.toFixed(2),
          balance: p.toString(),
        }));
      }

      if (openDateStr && t > 0) {
        const openDate = new Date(openDateStr);
        const matDate = new Date(openDate.setMonth(openDate.getMonth() + t));
        const matDateStr = matDate.toISOString().split("T")[0];
        if (formData.maturityDate !== matDateStr) {
          setFormData((prev) => ({ ...prev, maturityDate: matDateStr }));
        }
      }
    }
  }, [
    formData.type,
    formData.principal,
    formData.interestRate,
    formData.tenure,
    formData.startDate,
  ]);

  const loadData = async () => {
    await fetchGlobalData(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingAccount) {
        res = await updateAccountAction(editingAccount.id, formData);
        if (res.success) showSuccessToast("ACCOUNT UPDATED");
      } else {
        res = await createAccountAction(formData);
        if (res.success) showSuccessToast("ACCOUNT REGISTERED");
      }

      if (res.success) {
        loadData();
        resetForm();
      } else {
        showErrorToast(
          res.error || "COULD NOT SAVE ACCOUNT",
          "OPERATION FAILED",
        );
      }
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING SYNC", "SYSTEM ERROR");
      console.error(error);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      startDate: account.startDate
        ? new Date(account.startDate).toISOString().split("T")[0]
        : "",
      trackHistoricData: account.trackHistoricData || false,
      billingDay: account.billingDay || "",
      dueDay: account.dueDay || "",
      creditLimit: account.creditLimit || "",
      principal: account.principal || "",
      interestRate: account.interestRate || "",
      maturityDate: account.maturityDate
        ? new Date(account.maturityDate).toISOString().split("T")[0]
        : "",
      tenure: account.tenure || "",
      maturityAmount: account.principal
        ? (
            parseFloat(account.principal) *
            (1 +
              (parseFloat(account.interestRate || 0) / 100) *
                (parseInt(account.tenure || 0) / 12))
          ).toFixed(2)
        : "0",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await showConfirmationDialog(
      "DELETE ACCOUNT",
      "THIS ACTION WILL PERMANENTLY REMOVE THE ACCOUNT FROM THE LEDGER",
    );
    const confirmed = result.isConfirmed;
    if (confirmed) {
      try {
        const res = await deleteAccountAction(id);
        if (res.success) {
          showSuccessToast("ACCOUNT REMOVED");
          loadData();
        } else {
          showErrorToast(
            res.error || "COULD NOT REMOVE ACCOUNT",
            "DELETE FAILED",
          );
        }
      } catch (error) {
        showErrorToast("UNEXPECTED FAULT DURING DELETE", "SYSTEM ERROR");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "savings",
      balance: "0",
      currency: user?.currency || "INR",
      startDate: "",
      trackHistoricData: false,
      billingDay: "",
      dueDay: "",
      creditLimit: "",
      principal: "",
      interestRate: "",
      maturityDate: "",
      tenure: "",
      maturityAmount: "0",
    });
    setEditingAccount(null);
    setShowModal(false);
  };

  const assets = accounts.filter((a) => {
    const typeInfo = accountTypes.find((t) => t.name === a.type);
    return typeInfo
      ? typeInfo.category === "asset"
      : ["savings", "checking", "demat", "asset"].includes(a.type);
  });
  const liabilities = accounts.filter((a) => {
    const typeInfo = accountTypes.find((t) => t.name === a.type);
    return typeInfo
      ? typeInfo.category === "liability"
      : ["loan", "expense"].includes(a.type);
  });
  const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const totalLiabilities = liabilities.reduce(
    (sum, a) => sum + parseFloat(a.balance),
    0,
  );
  const netWorth = totalAssets - totalLiabilities;
  const totalVolume = totalAssets + Math.abs(totalLiabilities);
  const assetRatio =
    totalVolume > 0 ? Math.round((totalAssets / totalVolume) * 100) : 0;

  const formatCurrencyLocal = (amount, currencyCode) => {
    return formatCurrency(amount, currencyCode || user?.currency || "INR");
  };

  return (
    <PageLayout
      title="Accounts"
      subtitle="Manage your Accounts"
      actionLabel="New Account"
      actionIcon={Plus}
      onAction={() => setShowModal(true)}
    >
      <Tour steps={accountsSteps} tourKey="accounts" />
      <div
        id="tour-accounts-stats"
        className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-foreground mb-8"
      >
        <div className="p-8 border-r border-b border-foreground">
          <p className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-4">
            Total Assets
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tighter">
              {totalAssets}
            </h2>
            <ArrowUpRight size={20} className="text-zinc-300" />
          </div>
        </div>
        <div className="p-8 border-r border-b border-foreground">
          <p className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-4">
            Liabilities
          </p>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tighter">
              {totalLiabilities}
            </h2>
            <ArrowDownRight size={20} className="text-zinc-300" />
          </div>
        </div>
        <div className="p-8 border-r border-b border-foreground ">
          <p className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-4">
            Net Worth
          </p>
          <h2 className="text-3xl font-black tracking-tighter">
            {netWorth}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <section id="tour-assets-list" className="space-y-8">
          <SectionHeader title="Asset Inventory" count={assets.length} />
          <List>
            {assets.map((acc) => (
              <ListItem
                key={acc.id}
                title={acc.name}
                subtitle={acc.type}
                value={formatCurrencyLocal(acc.balance, acc.currency)}
                icon={acc.name[0].toUpperCase()}
                onEdit={() => handleEdit(acc)}
                onDelete={() => handleDelete(acc.id)}
                onClick={() => router.push(`/dashboard/accounts/${acc.id}`)}
              />
            ))}
          </List>
        </section>

        <section className="space-y-16">
          <div id="tour-debts-list" className="space-y-8">
            <SectionHeader title="Debt & Expenses" count={liabilities.length} />
            <List>
              {liabilities.map((acc) => (
                <ListItem
                  key={acc.id}
                  title={acc.name}
                  subtitle={acc.type}
                  value={formatCurrencyLocal(acc.balance, acc.currency)}
                  icon={acc.name[0].toUpperCase()}
                  onEdit={() => handleEdit(acc)}
                  onDelete={() => handleDelete(acc.id)}
                  onClick={() => router.push(`/dashboard/accounts/${acc.id}`)}
                  className="text-foreground/69"
                />
              ))}
            </List>
          </div>

          <div
            id="tour-financial-ratio"
            className="p-8 border border-foreground space-y-6"
          >
            <h3 className="font-black uppercase tracking-widest text-xs">
              Financial Ratio
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black uppercase">
                <span>Asset to Debt Ratio</span>
                <span>{assetRatio}%</span>
              </div>
              <div className="h-0.5 w-full bg-foreground">
                <div
                  className="h-full bg-foreground transition-all duration-1000"
                  style={{ width: `${assetRatio}%` }}
                />
              </div>
            </div>
            <p className="text-xs font-bold text-foreground/69 leading-relaxed uppercase">
              {netWorth >= 0
                ? "Positive financial position maintained."
                : "Targeting debt reduction strategy."}
            </p>
          </div>
        </section>
      </div>

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingAccount ? "Modify Account" : "Create Account"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Account Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="NAME"
            required
          />
          <div className="grid grid-cols-2 gap-8">
            <FormSelect
              label="Type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              options={accountTypes.map((type) => ({
                value: type.name,
                label: type.name,
              }))}
            />
            {!["Credit Card", "Investment", "Demat", "Fixed Deposit"].includes(
              formData.type,
            ) && (
              <FormInput
                label="Opening Balance"
                type="number"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({ ...formData, balance: e.target.value })
                }
                required
              />
            )}
          </div>

          {formData.type === "Fixed Deposit" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-8">
                <FormInput
                  label="Principal Amount"
                  type="number"
                  value={formData.principal}
                  onChange={(e) =>
                    setFormData({ ...formData, principal: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
                <FormInput
                  label="Interest Rate (% p.a.)"
                  type="number"
                  step="0.1"
                  value={formData.interestRate}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRate: e.target.value })
                  }
                  placeholder="e.g. 7.5"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <FormInput
                  label="FD Opening Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
                <FormInput
                  label="Tenure (Months)"
                  type="number"
                  value={formData.tenure}
                  onChange={(e) =>
                    setFormData({ ...formData, tenure: e.target.value })
                  }
                  placeholder="e.g. 12"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <FormInput
                  label="Maturity Date"
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) =>
                    setFormData({ ...formData, maturityDate: e.target.value })
                  }
                  disabled
                />
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/69 block mb-2">
                    Est. Maturity Amount
                  </label>
                  <div className="w-full border-b border-foreground/20 py-2 text-sm font-bold bg-zinc-50 uppercase">
                    {formatCurrencyLocal(
                      formData.maturityAmount,
                      formData.currency,
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {["Investment", "Demat"].includes(formData.type) && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <p className="text-xs text-blue-800 uppercase tracking-wide font-bold">
                ℹ️ Balance Calculation
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Add stocks or mutual funds to this account. Balance will be
                calculated automatically based on your holdings.
              </p>
            </div>
          )}

          {["Credit Card"].includes(formData.type) && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded">
              <p className="text-xs text-purple-800 uppercase tracking-wide font-bold">
                ℹ️ Credit Card Tracking
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Track your credit card transactions from now. Add billing day
                and due day below for payment reminders.
              </p>
            </div>
          )}

          {!["Credit Card", "Investment", "Demat", "Fixed Deposit"].includes(
            formData.type,
          ) && (
            <>
              <FormInput
                label="Tracking From"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
              <div className="space-y-2">
                <FormCheckbox
                  label="Track Historic Data (I'll add past transactions manually)"
                  checked={formData.trackHistoricData}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trackHistoricData: e.target.checked,
                    })
                  }
                />
                {!formData.trackHistoricData &&
                  parseFloat(formData.balance || 0) !== 0 && (
                    <p className="text-xs text-zinc-500 uppercase tracking-wide pl-6">
                      ℹ️ An opening balance transaction will be created
                      automatically
                    </p>
                  )}
              </div>
            </>
          )}
          {formData.type === "Credit Card" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <FormInput
                  label="Billing Day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.billingDay}
                  onChange={(e) =>
                    setFormData({ ...formData, billingDay: e.target.value })
                  }
                  placeholder="e.g. 15"
                />
                <FormInput
                  label="Due Day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDay: e.target.value })
                  }
                  placeholder="e.g. 5"
                />
              </div>
              <FormInput
                label="Credit Limit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) =>
                  setFormData({ ...formData, creditLimit: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          )}
          <FormSelect
            label="Currency"
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            options={currencies.map((c) => ({ value: c.code, label: c.code }))}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {editingAccount ? "Confirm Changes" : "Register Account"}
          </Button>
        </form>
      </Modal>
    </PageLayout>
  );
}
