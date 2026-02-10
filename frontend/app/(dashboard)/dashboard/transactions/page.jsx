"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Check,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { fetchAllData } from "@/actions/miscActions";
import {
  fetchTransactions,
  createTransactionAction,
  uploadBillAction,
  settleTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from "@/actions/transactionActions";
import {
  showSuccessToast,
  showErrorToast,
  showConfirmationDialog,
} from "@/utils/alert";
import { useUserStore } from "@/store/useUserStore";
import { formatCurrency } from "@/utils/format";
import PageLayout from "@/components/UI/PageLayout";
import Modal from "@/components/UI/Modal";
import {
  FormInput,
  FormSelect,
  FormDateInput,
  FormFileInput,
  FormTextarea,
} from "@/components/UI/Form";
import Button, { IconButton } from "@/components/UI/Button";
import { FileUp } from "lucide-react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  EmptyTableState,
} from "@/components/UI/Table";
import FilterBar from "@/components/UI/FilterBar";
import Badge from "@/components/UI/Badge";
import Tour from "@/components/UI/Tour";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const {
    transactions,
    accounts,
    budgets,
    categories,
    pagination,
    setTransactions,
    setPagination,
    fetchGlobalData,
    isInitialized,
  } = useTransactionStore();
  const { user } = useUserStore();

  const [activeTab, setActiveTab] = useState("expenses");
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    accountId: "",
    budgetId: "",
    categoryId: "",
    destinationAccountId: "",
    status: "settled",
    date: new Date().toISOString().split("T")[0],
    bankTransactionId: "",
    note: "",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const ledgerSteps = [
    {
      title: "The Ledger",
      intro:
        "This is your complete historical record of all financial movements.",
    },
    {
      element: "#tour-ledger-filters",
      title: "Filtering & Sorting",
      intro:
        "Search for specific entries, filter by date range, or switch between Expenses, Income, and Unsettled transactions.",
    },
    {
      element: "#tour-ledger-table",
      title: "Transaction List",
      intro:
        "View details of each transaction, including category, budget, and account used.",
    },
    {
      element: "#page-action-button",
      title: "Add Entry",
      intro: "Manually record a new transaction or income.",
    },
    {
      element: "button[id='page-action-button'] + button",
      title: "AI Bill Parsing",
      intro:
        "Upload a photo of a bill or receipt, and our AI will automatically parse the details for you!",
    },
  ];

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    handleFilter(1, key, direction);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isInitialized) {
          await fetchGlobalData();
        } else {
          fetchGlobalData(true);
        }

        await handleFilter(1);
      } catch (error) {
        showErrorToast("COULD NOT RETRIEVE TRANSACTION DATA", "SYNC ERROR");
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      resetForm();
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showModal) return;

    const sourceAccount = accounts.find((a) => a.id === formData.accountId);
    const destAccount =
      formData.type === "transfer"
        ? accounts.find((a) => a.id === formData.destinationAccountId)
        : null;

    const dates = [];
    if (sourceAccount?.startDate) dates.push(new Date(sourceAccount.startDate));
    if (destAccount?.startDate) dates.push(new Date(destAccount.startDate));

    if (dates.length > 0) {
      const maxStartDate = new Date(Math.max(...dates));
      const currentDate = new Date(formData.date);

      if (currentDate < maxStartDate) {
        setFormData((prev) => ({
          ...prev,
          date: maxStartDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [
    formData.accountId,
    formData.destinationAccountId,
    formData.type,
    showModal,
  ]);

  const refreshData = async () => {
    try {
      await handleFilter(pagination.page);
    } catch (error) {
      showErrorToast("COULD NOT UPDATE TRANSACTION LIST", "REFRESH ERROR");
    }
  };

  const handleFilter = async (
    pageArg = 1,
    sortBy = sortConfig.key,
    sortOrder = sortConfig.direction,
    tab = activeTab,
  ) => {
    try {
      const page = typeof pageArg === "number" ? pageArg : 1;
      let type = "";
      let status = "settled";

      if (tab === "unsettled") {
        status = "unsettled";
      } else if (tab === "income") {
        type = "income";
      } else if (tab === "expenses") {
        type = "expenses";
      }

      // TODO : fetch transactions based on the type of transaction per tab
      const response = await fetchTransactions(
        dateRange.startDate,
        dateRange.endDate,
        searchQuery,
        page,
        10,
        sortBy,
        sortOrder,
        type,
        status,
      );

      if (response.success) {
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
      } else
        showErrorToast(
          response.error || "COULD NOT APPLY FILTERS",
          "FILTER FAILED",
        );
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING FILTERING", "SYSTEM ERROR");
    }
  };

  const clearFilter = async () => {
    setDateRange({ startDate: "", endDate: "" });
    setSearchQuery("");
    try {
      let type = "";
      let status = "settled";
      if (activeTab === "unsettled") status = "unsettled";
      else if (activeTab === "income") type = "income";
      else if (activeTab === "expenses") type = "expenses";

      const response = await fetchTransactions(
        "",
        "",
        "",
        1,
        10,
        sortConfig.key,
        sortConfig.direction,
        type,
        status,
      );
      if (response.success) {
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      showErrorToast("COULD NOT CLEAR FILTERS", "SYSTEM ERROR");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingTransaction) {
        res = await updateTransactionAction(editingTransaction.id, formData);
        if (res.success) showSuccessToast("TRANSACTION UPDATED");
      } else {
        res = await createTransactionAction(formData);
        if (res.success) showSuccessToast("TRANSACTION RECORDED");
      }

      if (res.success) {
        await refreshData();
        resetForm();
      } else {
        showErrorToast(
          res.error || "COULD NOT SAVE TRANSACTION",
          "OPERATION FAILED",
        );
      }
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING SYNC", "SYSTEM ERROR");
      console.error(error);
    }
  };

  const handleUploadBill = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showError("NO FILE", "PLEASE SELECT A BILL OR RECEIPT TO UPLOAD");
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("bill", selectedFile);

      const res = await uploadBillAction(uploadFormData);
      if (res.success) {
        const { parseResult } = res.data;
        if (parseResult.success) {
          showSuccessToast(`BILL PARSED: ${parseResult.merchant || "BILL"}`);
        } else {
          showSuccessToast("BILL UPLOADED (UNSETTLED)");
        }
        await refreshData();
        setShowUploadModal(false);
        setSelectedFile(null);
        setActiveTab("unsettled");
      } else {
        showErrorToast(res.error || "COULD NOT PROCESS BILL", "UPLOAD FAILED");
      }
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING UPLOAD", "SYSTEM ERROR");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSettleTransaction = async (transaction) => {
    try {
      const result = await settleTransactionAction(transaction.id, transaction);
      if (result.success) {
        showSuccessToast("TRANSACTION SETTLED");
        await refreshData();
      } else {
        showErrorToast(
          result.error || "COULD NOT SETTLE TRANSACTION",
          "SETTLE FAILED",
        );
      }
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING SETTLEMENT", "SYSTEM ERROR");
    }
  };

  const handleDeleteTransaction = async (id) => {
    const result = await showConfirmationDialog(
      "DELETE TRANSACTION",
      "THIS ACTION WILL PERMANENTLY REMOVE THE ENTRY FROM THE LEDGER",
    );
    const confirmed = result.isConfirmed;
    if (confirmed) {
      try {
        const res = await deleteTransactionAction(id);
        if (res.success) {
          showSuccessToast("TRANSACTION DELETED");
          await refreshData();
        } else {
          showErrorToast(
            res.error || "COULD NOT REMOVE ENTRY",
            "DELETE FAILED",
          );
        }
      } catch (error) {
        showErrorToast("UNEXPECTED FAULT DURING DELETE", "SYSTEM ERROR");
      }
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      accountId: transaction.accountId || "",
      destinationAccountId: transaction.destinationAccountId || "",
      budgetId: transaction.budgetId || "",
      categoryId: transaction.categoryId || "",
      status: transaction.status,
      date: new Date(transaction.date).toISOString().split("T")[0],
      bankTransactionId: transaction.bankTransactionId || "",
      note: transaction.note || "",
    });
    setShowModal(true);
  };

  const handleResolveCard = (card) => {
    setFormData({
      description: `${card.issuer} Card Payment •••• ${card.last4}`,
      amount: card.dueAmount,
      type: "expense",
      accountId: "",
      destinationAccountId: "",
      budgetId: "",
      categoryId:
        categories.find(
          (c) =>
            c.name.toLowerCase().includes("bill") ||
            c.name.toLowerCase().includes("card") ||
            c.name.toLowerCase().includes("payment"),
        )?.id || "",
      status: "settled",
      date: new Date().toISOString().split("T")[0],
      bankTransactionId: "",
      note: `Settling bill due on ${new Date(
        card.dueDate,
      ).toLocaleDateString()}`,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      type: activeTab === "income" ? "income" : "expense",
      accountId: "",
      destinationAccountId: "",
      budgetId: "",
      categoryId: "",
      status: activeTab === "unsettled" ? "unsettled" : "settled",
      date: new Date().toISOString().split("T")[0],
      bankTransactionId: "",
      note: "",
    });
    setEditingTransaction(null);
    setShowModal(false);
  };

  return (
    <PageLayout
      title="Transactions"
      subtitle="Historical transaction ledger"
      actionLabel="New Transaction"
      actionIcon={Plus}
      onAction={() => {
        resetForm();
        setShowModal(true);
      }}
      actions={[
        {
          label: "Upload Bill",
          icon: FileUp,
          onClick: () => setShowUploadModal(true),
          variant: "secondary",
        },
      ]}
    >
      <Tour steps={ledgerSteps} tourKey="ledger" />
      <div id="tour-ledger-filters">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={() => handleFilter(1)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onFilter={() => handleFilter(1)}
          onClearFilter={clearFilter}
          tabs={[
            { value: "expenses", label: "Expenses" },
            { value: "income", label: "Income" },
            { value: "unsettled", label: "Unsettled" },
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            handleFilter(1, sortConfig.key, sortConfig.direction, tab);
          }}
        />
      </div>

      <div id="tour-ledger-table">
        <Table>
          <TableHeader>
            <TableHeaderCell
              sortable
              direction={
                sortConfig.key === "date" ? sortConfig.direction : null
              }
              onClick={() => handleSort("date")}
            >
              Date
            </TableHeaderCell>
            <TableHeaderCell
              sortable
              direction={
                sortConfig.key === "description" ? sortConfig.direction : null
              }
              onClick={() => handleSort("description")}
            >
              Description
            </TableHeaderCell>
            <TableHeaderCell
              sortable
              direction={
                sortConfig.key === "category" ? sortConfig.direction : null
              }
              onClick={() => handleSort("category")}
            >
              Category
            </TableHeaderCell>
            <TableHeaderCell
              sortable
              direction={
                sortConfig.key === "budget" ? sortConfig.direction : null
              }
              onClick={() => handleSort("budget")}
            >
              Budget
            </TableHeaderCell>
            <TableHeaderCell
              sortable
              direction={
                sortConfig.key === "account" ? sortConfig.direction : null
              }
              onClick={() => handleSort("account")}
            >
              Account
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              sortable
              direction={
                sortConfig.key === "amount" ? sortConfig.direction : null
              }
              onClick={() => handleSort("amount")}
            >
              Amount
            </TableHeaderCell>
            <TableHeaderCell align="center">Action</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {/* {activeTab === "unsettled" &&
              creditCards.map((card) => (
                <TableRow key={`card-${card.id}`} className="italic">
                  <TableCell className="text-xs font-bold">
                    {new Date(card.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm font-black uppercase tracking-tighter">
                    {card.issuer} Card •••• {card.last4}
                  </TableCell>
                  <TableCell>
                    <Badge size="sm">UTILITY</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge size="sm">PRIORITY</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-foreground/69 font-bold uppercase">
                    N/A
                  </TableCell>
                  <TableCell align="right" className="text-sm font-black">
                    — {formatCurrency(card.dueAmount, user?.currency || "INR")}
                  </TableCell>
                  <TableCell align="center">
                    <button
                      onClick={() => handleResolveCard(card)}
                      className="text-xs font-black underline hover:no-underline"
                    >
                      RESOLVE
                    </button>
                  </TableCell>
                </TableRow>
              ))} */}

            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs font-bold">
                  {new Date(t.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-black uppercase tracking-tighter">
                        {t.description}
                      </div>
                      {t.billAttachment && (
                        <FileUp
                          size={12}
                          className="text-foreground/69"
                          title="Bill Attached"
                        />
                      )}
                    </div>
                    {t.note && (
                      <div
                        className="text-xs text-foreground/69 font-medium italic truncate max-w-50"
                        title={t.note}
                      >
                        {t.note}
                      </div>
                    )}
                    {t.bankTransactionId && (
                      <div className="text-[8px] text-zinc-300 font-bold uppercase tracking-widest">
                        ID: {t.bankTransactionId}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground/69 group-hover:text-zinc-500">
                    {t.category?.name || "Uncategorized"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground/69 group-hover:text-zinc-500">
                    {t.budget?.name || "No Budget"}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-bold uppercase tracking-widest opacity-60">
                  {t.type === "transfer"
                    ? `${t.account?.name || "N/A"} → ${
                        t.destinationAccount?.name || "N/A"
                      }`
                    : t.account?.name || "N/A"}
                </TableCell>
                <TableCell
                  align="right"
                  className="text-base font-black tracking-tighter"
                >
                  {t.type === "income"
                    ? "+"
                    : t.type === "transfer"
                      ? "→"
                      : "—"}
                  {formatCurrency(
                    t.amount,
                    t.account?.currency || user?.currency || "INR",
                  )}
                </TableCell>
                <TableCell align="center">
                  <div className="flex justify-center gap-2">
                    {t.status === "unsettled" && (
                      <button
                        onClick={() => handleEditTransaction(t)}
                        className="text-xs font-black underline hover:no-underline"
                      >
                        RESOLVE
                      </button>
                    )}
                    <IconButton
                      icon={Edit2}
                      onClick={() => handleEditTransaction(t)}
                      variant="border"
                      title="Edit"
                      size={14}
                    />
                    <IconButton
                      icon={Trash2}
                      onClick={() => handleDeleteTransaction(t.id)}
                      variant="border"
                      title={(() => {
                        try {
                          const metadata = t.metadata
                            ? JSON.parse(t.metadata)
                            : {};
                          return metadata.isOpeningBalance
                            ? "Cannot delete opening balance"
                            : "Delete";
                        } catch {
                          return "Delete";
                        }
                      })()}
                      size={14}
                      disabled={(() => {
                        try {
                          const metadata = t.metadata
                            ? JSON.parse(t.metadata)
                            : {};
                          return metadata.isOpeningBalance || false;
                        } catch {
                          return false;
                        }
                      })()}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {transactions.length === 0 && activeTab !== "unsettled" && (
              <EmptyTableState message="No Transactions recorded" />
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between  p-4 ">
          <div className="text-xs font-black uppercase tracking-widest text-foreground/69">
            Showing {" "}
            <span className="text-foreground">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>
           {" "} to {" "}
            <span className="text-foreground">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
           {" "} of{" "} <span className="text-foreground">{pagination.total}</span> entries
          </div>
          <div className="flex gap-2">
            <IconButton
              icon={ChevronLeft}
              onClick={() => handleFilter(pagination.page - 1)}
              disabled={pagination.page <= 1}
              variant="border"
              size={16}
            />
            <div className="flex items-center px-4 border border-foreground text-xs font-black italic">
              PAGE {pagination.page} / {pagination.totalPages}
            </div>
            <IconButton
              icon={ChevronRight}
              onClick={() => handleFilter(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              variant="border"
              size={16}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {editingTransaction &&
            (() => {
              try {
                const metadata = editingTransaction.metadata
                  ? JSON.parse(editingTransaction.metadata)
                  : {};
                if (metadata.isOpeningBalance) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-400 p-4 rounded">
                      <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide">
                        ⚠️ Opening Balance Transaction
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This is a system-generated transaction. Only amount,
                        category, and note can be edited.
                      </p>
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}
          <FormInput
            label="Description"
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="MERCHANT NAME"
            required
            disabled={
              editingTransaction &&
              (() => {
                try {
                  const metadata = editingTransaction.metadata
                    ? JSON.parse(editingTransaction.metadata)
                    : {};
                  return metadata.isOpeningBalance || false;
                } catch {
                  return false;
                }
              })()
            }
          />

          <div className="grid grid-cols-2 gap-8">
            <FormInput
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
            <div className="relative">
              <FormDateInput
                label="Date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                min={(() => {
                  const sourceAccount = accounts.find(
                    (a) => a.id === formData.accountId,
                  );
                  const destAccount =
                    formData.type === "transfer"
                      ? accounts.find(
                          (a) => a.id === formData.destinationAccountId,
                        )
                      : null;

                  const dates = [];
                  if (sourceAccount?.startDate)
                    dates.push(new Date(sourceAccount.startDate));
                  if (destAccount?.startDate)
                    dates.push(new Date(destAccount.startDate));

                  if (dates.length === 0) return null;
                  const maxStartDate = new Date(Math.max(...dates));
                  return maxStartDate.toISOString().split("T")[0];
                })()}
                disabled={
                  editingTransaction &&
                  (() => {
                    try {
                      const metadata = editingTransaction.metadata
                        ? JSON.parse(editingTransaction.metadata)
                        : {};
                      return metadata.isOpeningBalance || false;
                    } catch {
                      return false;
                    }
                  })()
                }
              />
              {(() => {
                const sourceAccount = accounts.find(
                  (a) => a.id === formData.accountId,
                );
                const destAccount =
                  formData.type === "transfer"
                    ? accounts.find(
                        (a) => a.id === formData.destinationAccountId,
                      )
                    : null;
                const minAcc = sourceAccount?.startDate
                  ? sourceAccount
                  : destAccount?.startDate
                    ? destAccount
                    : null;

                if (minAcc?.startDate) {
                  return (
                    <p className="absolute -bottom-4 left-0 text-[8px] text-foreground/69 font-bold uppercase">
                      Tracking starts:{" "}
                      {new Date(minAcc.startDate).toLocaleDateString()}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <FormSelect
              label="Type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
                { value: "transfer", label: "Transfer" },
              ]}
              disabled={
                editingTransaction &&
                (() => {
                  try {
                    const metadata = editingTransaction.metadata
                      ? JSON.parse(editingTransaction.metadata)
                      : {};
                    return metadata.isOpeningBalance || false;
                  } catch {
                    return false;
                  }
                })()
              }
            />
            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: "settled", label: "Settled" },
                { value: "unsettled", label: "Unsettled" },
              ]}
            />
          </div>

          {formData.type === "transfer" ? (
            <div className="grid grid-cols-2 gap-8">
              <FormSelect
                label="From Account"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: acc.name,
                }))}
                required
              />
              <FormSelect
                label="To Account"
                value={formData.destinationAccountId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    destinationAccountId: e.target.value,
                  })
                }
                options={accounts
                  .filter((acc) => acc.id !== formData.accountId)
                  .map((acc) => ({ value: acc.id, label: acc.name }))}
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <FormSelect
                label="Account"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: acc.name,
                }))}
              />
              <FormSelect
                label="Budget"
                value={formData.budgetId}
                onChange={(e) =>
                  setFormData({ ...formData, budgetId: e.target.value })
                }
                options={budgets.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>
          )}

          <FormSelect
            label="Category"
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="SELECT CATEGORY"
          />

          <div className="grid grid-cols-2 gap-8">
            <FormInput
              label="Bank Transaction ID"
              type="text"
              value={formData.bankTransactionId}
              onChange={(e) =>
                setFormData({ ...formData, bankTransactionId: e.target.value })
              }
              placeholder="OPTIONAL"
            />
            <FormInput
              label="Note"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder="OPTIONAL"
              rows={2}
            />
          </div>

          {editingTransaction?.billAttachment && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-black uppercase text-foreground/69">
                Attachment:
              </span>
              <a
                href={`${(
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010/api"
                ).replace("/api", "")}/uploads/bills/${
                  editingTransaction.billAttachment
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-foreground underline hover:no-underline flex items-center gap-1"
              >
                <FileUp size={14} />
                VIEW ATTACHED BILL
              </a>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full">
            {editingTransaction ? "Update Transaction" : "Record Transaction"}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
        title="Upload Bill / Receipt"
        size="sm"
      >
        <form onSubmit={handleUploadBill} className="space-y-6">
          <p className="text-xs text-zinc-500 font-medium">
            AI will automatically parse the amount, date, and merchant from your
            bill and add it as an unsettled transaction.
          </p>

          <FormFileInput
            label="Bill Attachment"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            fileName={selectedFile?.name}
            required
            disabled={isUploading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isUploading}
          >
            {isUploading ? "Processing with AI..." : "Upload & Parse"}
          </Button>
        </form>
      </Modal>
    </PageLayout>
  );
}
