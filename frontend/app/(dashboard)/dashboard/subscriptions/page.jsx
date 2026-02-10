"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, Landmark, Tag } from "lucide-react";
import {
  fetchSubscriptions,
  createSubscriptionAction,
  updateSubscriptionAction,
  deleteSubscriptionAction,
} from "@/actions/subscriptionActions";
import { fetchCurrencies } from "@/actions/adminActions";
import { fetchCategories } from "@/actions/categoryActions";
import { getAccountsAction } from "@/actions/accountActions";
import { useUserStore } from "@/store/useUserStore";
import { formatCurrency } from "@/utils/format";
import {
  showSuccessToast,
  showErrorToast,
  showConfirmationDialog,
} from "@/utils/alert";
import PageLayout from "@/components/UI/PageLayout";
import Modal from "@/components/UI/Modal";
import { FormInput, FormSelect, FormDateInput } from "@/components/UI/Form";
import Button from "@/components/UI/Button";
import { GridCard } from "@/components/UI/Card";
import EmptyState from "@/components/UI/EmptyState";

const FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "half-yearly",
  "yearly",
];

export default function SubscriptionsPage() {
  const { user } = useUserStore();
  const [subscriptions, setSubscriptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    startDate: "",
    nextPaymentDate: "",
    accountId: "",
    categoryId: "",
    type: "expense",
  });

  useEffect(() => {
    loadData();
    loadCurrencies();
    loadAccounts();
    loadCategories();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await getAccountsAction();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load accounts", error);
    }
  };

  const loadCategories = async () => {
    const res = await fetchCategories();
    if (res.success) setCategories(res.data);
  };

  const loadCurrencies = async () => {
    const res = await fetchCurrencies();
    if (res.success) setCurrencies(res.data);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchSubscriptions();
      if (response.success) setSubscriptions(response.data);
      else
        showErrorToast(
          response.error || "COULD NOT RETRIEVE SUBSCRIPTION DATA",
          "SYNC ERROR",
        );
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING SYNC", "SYSTEM ERROR");
    } finally {
      setLoading(false);
    }
  };

  const totalMonthlyCommitment = subscriptions.reduce((acc, sub) => {
    let amt = parseFloat(sub.amount);
    if (sub.type === "expense") {
      // TODO : Need to fix this
    }

    let monthlyAmt = 0;
    switch (sub.frequency) {
      case "daily":
        monthlyAmt = amt * 30;
        break;
      case "weekly":
        monthlyAmt = amt * 4;
        break;
      case "monthly":
        monthlyAmt = amt;
        break;
      case "quarterly":
        monthlyAmt = amt / 3;
        break;
      case "half-yearly":
        monthlyAmt = amt / 6;
        break;
      case "yearly":
        monthlyAmt = amt / 12;
        break;
      default:
        monthlyAmt = amt;
    }

    return sub.type === "income" ? acc - monthlyAmt : acc + monthlyAmt;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingSubscription) {
        res = await updateSubscriptionAction(editingSubscription.id, formData);
        if (res.success) showSuccessToast("SERVICE UPDATED");
      } else {
        res = await createSubscriptionAction(formData);
        if (res.success) showSuccessToast("SERVICE REGISTERED");
      }

      if (res.success) {
        loadData();
        resetForm();
      } else {
        showErrorToast(
          res.error || "COULD NOT SAVE SUBSCRIPTION",
          "OPERATION FAILED",
        );
      }
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING SYNC", "SYSTEM ERROR");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    const result = await showConfirmationDialog(
      "CANCEL SERVICE",
      "THIS ACTION WILL PERMANENTLY REMOVE THE RECURRING COMMITMENT FROM THE LEDGER",
    );
    const confirmed = result.isConfirmed;
    if (confirmed) {
      try {
        const res = await deleteSubscriptionAction(id);
        if (res.success) {
          showSuccessToast("SERVICE REMOVED");
          loadData();
        } else {
          showErrorToast(
            res.error || "COULD NOT REMOVE SERVICE",
            "DELETE FAILED",
          );
        }
      } catch (error) {
        showErrorToast("UNEXPECTED FAULT DURING DELETE", "SYSTEM ERROR");
      }
    }
  };

  const handleEdit = (sub) => {
    setEditingSubscription(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount,
      frequency: sub.frequency,
      startDate: sub.startDate.split("T")[0],
      nextPaymentDate: sub.nextPaymentDate.split("T")[0],
      accountId: sub.accountId || "",
      categoryId: sub.categoryId || "",
      type: sub.type || "expense",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      frequency: "monthly",
      startDate: "",
      nextPaymentDate: "",
      accountId: "",
      categoryId: "",
      type: "expense",
    });
    setEditingSubscription(null);
    setShowModal(false);
  };

  return (
    <PageLayout
      title="Subscriptions"
      subtitle="Manage Recurring Transactions"
      actionLabel="New Service"
      actionIcon={Plus}
      onAction={() => setShowModal(true)}
    >
      <div className="mb-12 flex items-center gap-4 group">
        <button
          onClick={loadData}
          className="p-3 border border-foreground hover:bg-foreground hover:text-background transition-all active:scale-95"
          title="Refresh Data"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-foreground/69">
            Monthly Net Commitment
          </p>
          <h2
            className={`text-2xl font-black tracking-tighter italic ${totalMonthlyCommitment > 0 ? "text-red-500" : "text-emerald-500"}`}
          >
            {formatCurrency(
              Math.abs(totalMonthlyCommitment),
              user?.currency || "INR",
            )}
            <span className="text-xs ml-2 not-italic opacity-50">
              {totalMonthlyCommitment > 0 ? "(NET BURN)" : "(NET GAIN)"}
            </span>
          </h2>
        </div>
      </div>

      {subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-foreground">
          {subscriptions.map((sub) => (
            <GridCard
              key={sub.id}
              title={sub.name}
              subtitle="PROVIDER"
              onEdit={() => handleEdit(sub)}
              onDelete={() => handleDelete(sub.id)}
            >
              <div className="space-y-1">
                <h2
                  className={`text-3xl font-black tracking-tighter italic ${sub.type === "income" ? "text-emerald-500" : ""}`}
                >
                  {sub.type === "income" ? "+" : ""}
                  {formatCurrency(sub.amount, user?.currency || "INR")}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-widest opacity-40">
                    {sub.frequency}
                  </p>
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.5 border ${sub.type === "income" ? "border-emerald-500 text-emerald-500" : "border-zinc-500 text-zinc-500"} uppercase tracking-tighter`}
                  >
                    {sub.type}
                  </span>
                </div>
              </div>

              <div className="pt-8 flex justify-between items-end border-t border-foreground/5 group-hover:border-white/10">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-1">
                    Next Bill
                  </p>
                  <p className="text-xs font-bold uppercase tracking-tighter italic">
                    {new Date(sub.nextPaymentDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="w-8 h-0.5 bg-foreground group-hover:bg-white" />
              </div>

              {(sub.accountId || sub.categoryId) && (
                <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-widest opacity-60">
                  {sub.accountId && (
                    <div className="flex items-center gap-1">
                      <Landmark size={12} />
                      <span>
                        {accounts.find((a) => a.id === sub.accountId)?.name ||
                          "Linked Account"}
                      </span>
                    </div>
                  )}
                  {sub.categoryId && (
                    <div className="flex items-center gap-1">
                      <Tag size={12} />
                      <span>
                        {categories.find((c) => c.id === sub.categoryId)
                          ?.name || "Linked Category"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </GridCard>
          ))}
        </div>
      ) : (
        <EmptyState message="No recurring services identified" />
      )}

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingSubscription ? "Modify Service" : "Init Subscription"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <FormInput
              label="Service Name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="SPOTIFY / AWS / GYM"
              required
            />
            <FormSelect
              label="Transaction Type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                  categoryId: "",
                })
              }
              options={[
                { value: "expense", label: "EXPENSE" },
                { value: "income", label: "INCOME" },
              ]}
            />
          </div>

          <FormInput
            label="Cost"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />

          <FormSelect
            label="Billing Interval"
            value={formData.frequency}
            onChange={(e) =>
              setFormData({ ...formData, frequency: e.target.value })
            }
            options={FREQUENCIES.map((freq) => ({ value: freq, label: freq }))}
          />

          <div className="grid grid-cols-2 gap-8">
            <FormDateInput
              label="Start Date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
            <FormDateInput
              label="Next Payment"
              value={formData.nextPaymentDate}
              onChange={(e) =>
                setFormData({ ...formData, nextPaymentDate: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <FormSelect
              label="Link Account"
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: e.target.value })
              }
              options={[
                { value: "", label: "NO ACCOUNT LINKED" },
                ...accounts.map((acc) => ({ value: acc.id, label: acc.name })),
              ]}
            />
            <FormSelect
              label="Category"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              options={[
                { value: "", label: "NO CATEGORY" },
                ...categories
                  .filter((c) => c.type === (formData.type || "expense"))
                  .map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full">
            {editingSubscription ? "Confirm Update" : "Register Service"}
          </Button>
        </form>
      </Modal>
    </PageLayout>
  );
}
