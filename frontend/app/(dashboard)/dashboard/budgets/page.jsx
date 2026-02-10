"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  fetchBudgets,
  createBudgetAction,
  updateBudgetAction,
  deleteBudgetAction,
} from "@/actions/budgetActions";
import { useTransactionStore } from "@/store/useTransactionStore";
import {
  showSuccessToast,
  showErrorToast,
  showConfirmationDialog,
} from "@/utils/alert";
import { formatCurrency } from "@/utils/format";
import { useUserStore } from "@/store/useUserStore";
import PageLayout from "@/components/UI/PageLayout";
import Modal from "@/components/UI/Modal";
import { FormInput, FormDateInput, FormSelect } from "@/components/UI/Form";
import Button from "@/components/UI/Button";
import { GridCard } from "@/components/UI/Card";
import EmptyState from "@/components/UI/EmptyState";
import Tour from "@/components/UI/Tour";

export default function BudgetsPage() {
  const { budgets, setBudgets, fetchGlobalData, isInitialized } =
    useTransactionStore();
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    startDate: "",
    endDate: "",
  });

  const budgetSteps = [
    {
      title: "Budget Planning",
      intro:
        "Define your financial limits and plan your spending for specific periods.",
    },
    {
      element: "#tour-budgets-grid",
      title: "Your Allocations",
      intro:
        "Each card represents a budget category with its limit and active period.",
    },
    {
      element: "#page-action-button",
      title: "Define New Budget",
      intro: "Click 'Define Budget' to set a new spending limit.",
    },
  ];

  useEffect(() => {
    if (!isInitialized) {
      fetchGlobalData();
    } else {
      fetchGlobalData(true);
    }
  }, []);

  const loadData = async () => {
    await fetchGlobalData(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingBudget) {
        res = await updateBudgetAction(editingBudget.id, formData);
        if (res.success) showSuccessToast("BUDGET UPDATED");
      } else {
        res = await createBudgetAction(formData);
        if (res.success) showSuccessToast("BUDGET DEFINED");
      }

      if (res.success) {
        loadData();
        resetForm();
      } else {
        showErrorToast(
          res.error || "COULD NOT SAVE BUDGET",
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
      "DELETE BUDGET",
      "THIS ACTION WILL PERMANENTLY REMOVE THE ALLOCATION FROM THE LEDGER",
    );
    const confirmed = result.isConfirmed;
    if (confirmed) {
      try {
        const res = await deleteBudgetAction(id);
        if (res.success) {
          showSuccessToast("BUDGET REMOVED");
          loadData();
        } else {
          showErrorToast(
            res.error || "COULD NOT REMOVE BUDGET",
            "DELETE FAILED",
          );
        }
      } catch (error) {
        showErrorToast("UNEXPECTED FAULT DURING DELETE", "SYSTEM ERROR");
      }
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      amount: budget.amount,
      frequency: budget.frequency || "custom",
      startDate: budget.startDate ? budget.startDate.split("T")[0] : "",
      endDate: budget.endDate ? budget.endDate.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      frequency: "monthly",
      startDate: "",
      endDate: "",
    });
    setEditingBudget(null);
    setShowModal(false);
  };

  return (
    <PageLayout
      title="Budgets"
      subtitle="Allocate limits and plan accordingly"
      actionLabel="New Budget"
      actionIcon={Plus}
      onAction={() => setShowModal(true)}
    >
      <Tour steps={budgetSteps} tourKey="budgets" />
      {budgets.length > 0 ? (
        <div
          id="tour-budgets-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-black"
        >
          {budgets.map((budget) => (
            <GridCard
              key={budget.id}
              title={budget.name}
              subtitle="CAPACITY"
              onEdit={() => handleEdit(budget)}
              onDelete={() => handleDelete(budget.id)}
            >
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter italic">
                  {formatCurrency(budget.amount, user?.currency || "INR")}
                </h2>
                <div className="h-px w-full bg-black/10 group-hover:bg-white/20" />
              </div>

              <div className="pt-8">
                {/* TODO : there is a possibility that there could be a budget for a particulat month like Diwali shopping which only happens for the diwali and not the complete month, we can handle this by custum date maybe */}
                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 opacity-50">
                  <span>Period Start</span>
                  <span>Maturity</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span>
                    {budget.frequency === "custom" && budget.startDate
                      ? new Date(budget.startDate).toLocaleDateString()
                      : budget.frequency}
                  </span>
                  <span>
                    {budget.frequency === "custom" && budget.endDate
                      ? new Date(budget.endDate).toLocaleDateString()
                      : "Recurring"}
                  </span>
                </div>
              </div>
            </GridCard>
          ))}
        </div>
      ) : (
        <div id="tour-budgets-empty">
          <EmptyState message="No Budgets defined" />
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingBudget ? "Modify Budget" : "Init Allocation"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <FormInput
            label="Reference Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="MONTHLY GROCERIES"
            required
          />

          <FormInput
            label="Amount (Cap)"
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />

          <FormSelect
            label="Frequency"
            value={formData.frequency}
            onChange={(e) =>
              setFormData({ ...formData, frequency: e.target.value })
            }
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
              { value: "custom", label: "Custom" },
            ]}
          />

          {formData.frequency === "custom" && (
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
                label="End Date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full">
            {editingBudget ? "Confirm Update" : "Establish Budget"}
          </Button>
        </form>
      </Modal>
    </PageLayout>
  );
}
