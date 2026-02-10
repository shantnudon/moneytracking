"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar } from "lucide-react";
import { useTransactionStore } from "@/store/useTransactionStore";
import {
  fetchCategories,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/categoryActions";
import { fetchTransactions } from "@/actions/transactionActions";
import {
  showSuccessToast,
  showErrorToast,
  showConfirmationDialog,
} from "@/utils/alert";
import { formatCurrency } from "@/utils/format";
import { useUserStore } from "@/store/useUserStore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PageLayout from "@/components/UI/PageLayout";
import Modal from "@/components/UI/Modal";
import { FormInput, FormSelect } from "@/components/UI/Form";
import Button from "@/components/UI/Button";
import { GridCard } from "@/components/UI/Card";
import EmptyState from "@/components/UI/EmptyState";

export default function CategoriesPage() {
  const { categories, setCategories } = useTransactionStore();
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });

  useEffect(() => {
    loadCategories();
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [dateRange]);

  const loadCategories = async () => {
    const res = await fetchCategories();
    if (res.success) {
      setCategories(res.data);
    } else {
      showErrorToast("COULD NOT RETRIEVE CATEGORIES", "FETCH ERROR");
    }
  };

  const loadTransactions = async () => {
    const res = await fetchTransactions(
      dateRange.startDate,
      dateRange.endDate,
      "",
      1,
      1000,
    );
    if (res.success) {
      setFilteredTransactions(res.data.transactions || res.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingCategory) {
        res = await updateCategoryAction(editingCategory.id, formData);
        if (res.success) showSuccessToast("CATEGORY UPDATED");
      } else {
        res = await createCategoryAction(formData);
        if (res.success) showSuccessToast("CATEGORY CREATED");
      }

      if (res.success) {
        const updated = await fetchCategories();
        if (updated.success) setCategories(updated.data);
        loadTransactions();
        resetForm();
      } else {
        showErrorToast(
          res.error || "COULD NOT SAVE CATEGORY",
          "OPERATION FAILED",
        );
      }
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT", "SYSTEM ERROR");
    }
  };

  const handleDelete = async (id) => {
    const result = await showConfirmationDialog(
      "DELETE CATEGORY",
      "THIS WILL REMOVE THE CATEGORY PERMANENTLY",
    );
    const confirmed = result.isConfirmed;
    if (confirmed) {
      const res = await deleteCategoryAction(id);
      if (res.success) {
        showSuccessToast("CATEGORY REMOVED");
        const updated = await fetchCategories();
        if (updated.success) setCategories(updated.data);
        loadTransactions();
      } else {
        showErrorToast(res.error, "DELETE FAILED");
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", type: "expense" });
    setEditingCategory(null);
    setShowModal(false);
  };

  const categorySpend = categories
    .map((cat) => {
      const spent = filteredTransactions
        .filter((t) => t.categoryId === cat.id && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, value: spent, type: cat.type };
    })
    .filter((cat) => cat.value > 0);

  const totalSpend = categorySpend.reduce((sum, cat) => sum + cat.value, 0);

  const COLORS = [
    "var(--foreground)",
    "var(--muted)",
    "rgba(var(--foreground-rgb), 0.6)",
    "rgba(var(--foreground-rgb), 0.4)",
    "rgba(var(--foreground-rgb), 0.2)",
    "rgba(var(--foreground-rgb), 0.1)",
  ];

  return (
    <PageLayout
      title="Categories"
      subtitle="Classify your transactions under categories"
      actionLabel="New Category"
      actionIcon={Plus}
      onAction={() => {
        resetForm();
        setShowModal(true);
      }}
    >
      <div className="flex items-center gap-2 border border-foreground px-4 py-2 mb-8 w-fit">
        <Calendar size={14} />
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, startDate: e.target.value })
          }
          className="text-xs font-black uppercase outline-none bg-transparent"
        />
        <span className="text-zinc-300">—</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, endDate: e.target.value })
          }
          className="text-xs font-black uppercase outline-none bg-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
        <div className="lg:col-span-5 h-75 border border-foreground p-8 flex flex-col items-center justify-center relative bg-background">
          <div className="absolute top-4 left-4">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/69">
              Spend Distribution
            </p>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categorySpend}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categorySpend.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--foreground)",
                  borderRadius: "0px",
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  color: "var(--foreground)",
                }}
                formatter={(value) =>
                  formatCurrency(value, user?.currency || "INR")
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center">
            <p className="text-[8px] font-black uppercase text-foreground/69">
              Total Spend
            </p>
            <p className="text-sm font-black italic">
              {formatCurrency(totalSpend, user?.currency || "INR")}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categorySpend.map((cat, index) => (
            <div
              key={index}
              className="border border-foreground/5 p-6 flex flex-col justify-between hover:border-foreground transition-all bg-background"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-black uppercase tracking-widest text-foreground/69">
                  {cat.name}
                </span>
                <span className="text-xs font-black italic">
                  {((cat.value / totalSpend) * 100).toFixed(1)}%
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tighter italic mt-4">
                {formatCurrency(cat.value, user?.currency || "INR")}
              </h2>
              <div className="h-px w-full bg-muted/20 mt-4">
                <div
                  className="h-full bg-foreground transition-all duration-1000"
                  style={{ width: `${(cat.value / totalSpend) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {categorySpend.length === 0 && (
            <div className="col-span-2 flex items-center justify-center border border-dashed border-foreground/10 py-12">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-300 italic">
                No spend data for this period
              </p>
            </div>
          )}
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border border-foreground p-6 group hover:bg-foreground hover:text-background transition-all duration-300 bg-background"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-foreground/69 group-hover:text-zinc-500">
                  {category.type}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1 hover:bg-white hover:text-foreground transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 hover:bg-white hover:text-foreground transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter italic">
                {category.name}
              </h3>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No categories defined" />
      )}

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingCategory ? "Edit Category" : "Add Category"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Category Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. UTILITIES"
            required
          />
          <FormSelect
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {editingCategory ? "Update Category" : "Create Category"}
          </Button>
        </form>
      </Modal>
    </PageLayout>
  );
}
