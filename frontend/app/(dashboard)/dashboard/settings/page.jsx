"use client";

import { useState, useEffect } from "react";
import {
  fetchUserSettings,
  updateUserSettingsAction,
  resetToursAction,
} from "@/actions/userActions";
import {
  createAccountTypeAction,
  deleteAccountTypeAction,
} from "@/actions/accountActions";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/actions/categoryActions";
import { bulkCreateTransactionsAction } from "@/actions/transactionActions";
import {
  Save,
  User,
  Globe,
  RefreshCw,
  ChevronRight,
  FileText,
  Upload,
  Database,
  Columns,
  ArrowRight,
  ArrowLeft,
  Check,
  HelpCircle,
  Bell,
  Download,
  Table,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import EmailConfigForm from "@/components/Settings/EmailConfigForm";

import { useUserStore } from "@/store/useUserStore";
import { useTransactionStore } from "@/store/useTransactionStore";

import { showSuccessToast, showErrorToast } from "@/utils/alert";

export default function SettingsPage() {
  const { user, setUser, updateUser, restartTours } = useUserStore();
  const {
    accounts,
    currencies,
    accountTypes,
    categories,
    fetchGlobalData,
    isInitialized,
  } = useTransactionStore();

  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [name, setName] = useState(user?.name || "");
  const [notifEmail, setNotifEmail] = useState(
    user?.notificationsEmail || false,
  );
  const [loading, setLoading] = useState(false);
  const [notifNtfy, setNotifNtfy] = useState(user?.notificationsNtfy || false);
  const [ntfyTopic, setNtfyTopic] = useState(user?.ntfyTopic || "");
  const [alertEmail, setAlertEmail] = useState(user?.alertEmail || "");

  const [activeSection, setActiveSection] = useState("general");

  const [importStep, setImportStep] = useState(1);
  const [importSource, setImportSource] = useState("file");
  const [csvText, setCsvText] = useState("");
  const [rowAccountMappings, setRowAccountMappings] = useState({});

  const [newAccountTypeName, setNewAccountTypeName] = useState("");
  const [newAccountTypeCategory, setNewAccountTypeCategory] = useState("asset");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("expense");

  const downloadSampleCSV = () => {
    const link = document.createElement("a");
    link.href = "/sample-transactions.csv";
    link.download = "sample-transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessToast("SAMPLE TEMPLATE DOWNLOADED");
  };
  const [csvHeaders, setCsvHeaders] = useState([
    "date",
    "description",
    "amount",
    "category",
    "type",
    "note",
    "status",
    "bankTransactionId",
  ]);
  const [mapping, setMapping] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
    note: "",
    status: "",
    bankTransactionId: "",
  });

  const now = new Date();

  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const formattedDate = `${yy}-${mm}-${dd}`;

  const [tableData, setTableData] = useState([
    [
      "date",
      "Description",
      "Amount",
      "Category",
      "Type",
      "Note",
      "Status",
      "Bank Transaction ID",
    ],
    [
      formattedDate,
      "Sample Transaction",
      "100.00",
      "General",
      "expense",
      "",
      "settled",
      "123",
    ],
  ]);

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = [...tableData];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);

    if (rowIndex === 0) {
      setCsvHeaders(newData[0]);
    }
  };

  const handleAddRow = () => {
    const emptyRow = new Array(tableData[0].length).fill("");
    setTableData([...tableData, emptyRow]);
  };

  const handleAddColumn = () => {
    const newData = tableData.map((row) => [...row, ""]);
    setTableData(newData);
    setCsvHeaders(newData[0]);
  };

  const handleRemoveColumn = (colIndex) => {
    if (tableData[0].length <= 1) return;
    const newData = tableData.map((row) =>
      row.filter((_, i) => i !== colIndex),
    );
    setTableData(newData);
    setCsvHeaders(newData[0]);
  };

  const handleRemoveRow = (rowIndex) => {
    if (tableData.length <= 1) return;
    const newData = tableData.filter((_, i) => i !== rowIndex);
    setTableData(newData);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const headers = tableData[0];
      const dataRows = tableData
        .slice(1)
        .filter((row) => row.some((cell) => cell.trim() !== ""));

      const transactions = dataRows.map((row, index) => {
        const getVal = (field) => {
          const headerName = mapping[field];
          const index = headers.indexOf(headerName);
          return index !== -1 ? row[index]?.trim() : "";
        };

        const amountRaw = getVal("amount");
        const amount = parseFloat(amountRaw.replace(/[^0-9.-]+/g, ""));

        let dateVal = getVal("date");
        let parsedDate = new Date(dateVal);
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }

        const typeVal = getVal("type").toLowerCase();
        const mappedType = ["income", "expense", "transfer"].includes(typeVal)
          ? typeVal
          : amount >= 0
            ? "income"
            : "expense";

        return {
          description: getVal("description") || "Imported Transaction",
          amount: Math.abs(amount) || 0,
          date: parsedDate.toISOString(),
          type: mappedType,
          accountId: rowAccountMappings[index]
            ? rowAccountMappings[index]
            : undefined,
          status: getVal("status") || "settled",
          note: getVal("note") || "",
          bankTransactionId: getVal("bankTransactionId") || undefined,
          categoryId: categories.find(
            (c) => c.name.toLowerCase() === getVal("category")?.toLowerCase(),
          )?.id,
        };
      });

      if (transactions.length === 0) {
        showErrorToast("NO VALID DATA FOUND TO IMPORT");
        return;
      }

      const res = await bulkCreateTransactionsAction(transactions);
      if (res.success) {
        const { created, skipped } = res.data;
        if (skipped > 0) {
          showSuccessToast(
            `IMPORTED ${created} TRANSACTION${
              created !== 1 ? "S" : ""
            } • SKIPPED ${skipped} DUPLICATE${skipped !== 1 ? "S" : ""}`,
          );
        } else {
          showSuccessToast(
            `SUCCESSFULLY IMPORTED ${created} TRANSACTION${
              created !== 1 ? "S" : ""
            }`,
          );
        }
        setImportStep(1);
        setCsvText("");
        setActiveSection("general");
      } else {
        showErrorToast(res.error || "IMPORT FAILED");
      }
    } catch (error) {
      console.error("Import Error:", error);
      showErrorToast("AN ERROR OCCURRED DURING IMPORT");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          return matches
            ? matches.map((m) => m.replace(/^"|"$/g, ""))
            : line.split(",");
        });

      if (rows.length > 0) {
        setTableData(rows);
        setCsvHeaders(rows[0]);
        setImportSource("table");
        showSuccessToast("CSV DATA LOADED INTO TABLE");
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    loadSettings();
    if (!isInitialized) {
      fetchGlobalData();
    } else {
      fetchGlobalData(true);
    }
  }, []);

  const loadBudgets = async () => {
    await fetchGlobalData(true);
  };

  const loadCategories = async () => {
    await fetchGlobalData(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    const res = await createCategoryAction({
      name: newCategoryName,
      type: newCategoryType,
    });
    if (res.success) {
      showSuccessToast("CATEGORY ADDED");
      setNewCategoryName("");
      loadCategories();
    } else {
      showErrorToast(res.error || "FAILED TO ADD CATEGORY");
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id) => {
    if (
      !confirm("ARE YOU SURE? THIS WILL AFFECT TRANSACTIONS IN THIS CATEGORY.")
    )
      return;
    setLoading(true);
    const res = await deleteCategoryAction(id);
    if (res.success) {
      showSuccessToast("CATEGORY REMOVED");
      loadCategories();
    } else {
      showErrorToast(res.error || "FAILED TO REMOVE CATEGORY");
    }
    setLoading(false);
  };

  const loadAccountTypes = async () => {
    await fetchGlobalData(true);
  };

  const handleAddAccountType = async () => {
    if (!newAccountTypeName.trim()) return;
    setLoading(true);
    const res = await createAccountTypeAction({
      name: newAccountTypeName,
      category: newAccountTypeCategory,
    });
    if (res.success) {
      showSuccessToast("ACCOUNT TYPE ADDED");
      setNewAccountTypeName("");
      loadAccountTypes();
    } else {
      showErrorToast(res.error || "FAILED TO ADD ACCOUNT TYPE");
    }
    setLoading(false);
  };

  const handleDeleteAccountType = async (id) => {
    if (!confirm("ARE YOU SURE? THIS MAY AFFECT EXISTING ACCOUNTS.")) return;
    setLoading(true);
    const res = await deleteAccountTypeAction(id);
    if (res.success) {
      showSuccessToast("ACCOUNT TYPE REMOVED");
      loadAccountTypes();
    } else {
      showErrorToast(res.error || "FAILED TO REMOVE ACCOUNT TYPE");
    }
    setLoading(false);
  };

  const loadCurrencies = async () => {
    await fetchGlobalData(true);
  };

  const loadSettings = async () => {
    try {
      const response = await fetchUserSettings();
      if (response.success) {
        setCurrency(response.data.currency || "INR");
        setName(response.data.name || "");
        setNotifEmail(response.data.notificationsEmail || false);
        setAlertEmail(response.data.alertEmail || "");
        setNotifNtfy(response.data.notificationsNtfy || false);
        setNtfyTopic(response.data.ntfyTopic || "");
        updateUser(response.data);
      }
    } catch (error) {
      console.log(error);
      showErrorToast("COULD NOT RETRIEVE SYSTEM SETTINGS", "SYNC ERROR");
    }
  };

  const loadAccounts = async () => {
    await fetchGlobalData(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateUserSettingsAction({
        currency,
        name,
        notificationsEmail: notifEmail,
        alertEmail,
        notificationsNtfy: notifNtfy,
        ntfyTopic,
      });
      if (res.success) {
        updateUser({
          currency,
          name,
          notificationsEmail: notifEmail,
          alertEmail,
          notificationsNtfy: notifNtfy,
          ntfyTopic,
        });
        showSuccessToast("SYSTEM UPDATED");
      } else {
        showErrorToast(res.error || "COULD NOT SAVE SETTINGS", "UPDATE FAILED");
      }
    } catch (error) {
      showErrorToast("UNEXPECTED FAULT DURING SYNC", "SYSTEM ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleRestartTours = async () => {
    const res = await resetToursAction();
    if (res.success) {
      if (res.user) {
        setUser(res.user);
      } else {
        restartTours();
      }
      showSuccessToast("TOURS RESET");
    } else {
      showErrorToast(res.error || "COULD NOT RESET TOURS", "UPDATE FAILED");
    }
  };

  const sections = [
    { id: "general", label: "General", icon: Globe },
    { id: "profile", label: "Identity", icon: User },
    { id: "accountTypes", label: "Account Types", icon: Columns },
    { id: "email", label: "Email Sync", icon: RefreshCw },
    { id: "import", label: "Data Import", icon: Database },
    { id: "notifications", label: "Alerts", icon: Bell },
    { id: "tours", label: "Tours", icon: HelpCircle },
  ];

  const labelClass =
    "text-xs font-black uppercase tracking-widest text-foreground/69 mb-2 block";
  const inputClass =
    "w-full border-b border-foreground py-4 text-sm font-black focus:border-foreground outline-none transition-all bg-transparent uppercase placeholder-zinc-200";

  return (
    <div className=" p-6 md:p-8 text-foreground font-sans animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-foreground">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Settings
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 border-t border-l border-foreground">
        <div className="lg:col-span-3 border-r border-foreground divide-y">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center justify-between px-8 py-8 text-xs font-black uppercase tracking-widest transition-all ${
                activeSection === section.id
                  ? "bg-foreground text-background"
                  : "hover:bg-muted/10"
              }`}
            >
              <div className="flex items-center gap-4">
                <section.icon size={16} />
                {section.label}
              </div>
              <ChevronRight
                size={14}
                className={
                  activeSection === section.id ? "opacity-100" : "opacity-0"
                }
              />
            </button>
          ))}

          <div className="p-8 border-b border-foreground">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-4">
              Operations
            </h3>
            <button
              onClick={() => (window.location.href = "/onboarding")}
              className="text-xs font-bold border-b border-foreground hover:opacity-50 transition-all uppercase"
            >
              Restart Onboarding →
            </button>
          </div>
        </div>

        <div className="lg:col-span-9 p-8 md:p-12 border-r border-b border-foreground ">
          {activeSection === "general" && (
            <div className="max-w-xl space-y-12 animate-in slide-in-from-right-4">
              {/* <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Global Preferences
                </h2>
              </div> */}
              <div className="space-y-8">
                <div>
                  <label className={labelClass}>System Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={inputClass}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-10 py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all flex items-center gap-3 shadow-xl"
                >
                  {loading ? "Synchronizing..." : "Save Configuration"}
                  <Save size={14} />
                </button>
              </div>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="max-w-xl space-y-12 animate-in slide-in-from-right-4">
              {/* <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Identity Profile
                </h2>
              </div> */}
              <div className="space-y-8">
                <div>
                  <label className={labelClass}>Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="ENTER NAME..."
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-10 py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all flex items-center gap-3 shadow-xl"
                >
                  {loading ? "Synchronizing..." : "Update Identity"}
                  <Save size={14} />
                </button>
              </div>
            </div>
          )}

          {activeSection === "accountTypes" && (
            <div className="max-w-2xl space-y-12 animate-in slide-in-from-right-4">
              {/* <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Account Infrastructure
                </h2>
                <p className="text-xs font-bold text-foreground/69 uppercase tracking-widest">
                  Define custom classifications for your financial accounts
                </p>
              </div> */}

              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4 items-end border-b border-foreground pb-8">
                  <div className="flex-1 w-full">
                    <label className={labelClass}>New Account Type</label>
                    <input
                      type="text"
                      value={newAccountTypeName}
                      onChange={(e) => setNewAccountTypeName(e.target.value)}
                      className={inputClass}
                      placeholder="E.G. CRYPTO WALLET, RETIREMENT..."
                    />
                  </div>
                  <div className="w-full md:w-40">
                    <label className={labelClass}>Category</label>
                    <select
                      value={newAccountTypeCategory}
                      onChange={(e) =>
                        setNewAccountTypeCategory(e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddAccountType}
                    disabled={loading || !newAccountTypeName.trim()}
                    className="w-full md:w-auto px-8 py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className={labelClass}>Existing Classifications</h3>
                    <div className="flex gap-2">
                      {["all", "asset", "liability"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setAccountTypeFilter(cat)}
                          className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border border-foreground transition-all ${
                            accountTypeFilter === cat
                              ? "bg-foreground text-background"
                              : "hover:bg-muted50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accountTypes
                      .filter(
                        (t) =>
                          accountTypeFilter === "all" ||
                          t.category === accountTypeFilter,
                      )
                      .map((type) => (
                        <div
                          key={type.id}
                          className="p-6 border border-foreground flex justify-between items-center group hover:bg-muted50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase tracking-widest">
                              {type.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter border ${
                                type.category === "asset"
                                  ? "bg-green-50 text-green-600 border-green-100"
                                  : "bg-red-50 text-red-600 border-red-100"
                              }`}
                            >
                              {type.category}
                            </span>
                            {!type.userId && (
                              <span className="px-2 py-0.5 bg-foreground text-[8px] font-bold uppercase tracking-tighter text-foreground/69 border border-zinc-200">
                                System
                              </span>
                            )}
                          </div>
                          {type.userId && (
                            <button
                              onClick={() => handleDeleteAccountType(type.id)}
                              className="text-zinc-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "email" && (
            <div className="max-w-2xl animate-in slide-in-from-right-4">
              <EmailConfigForm />
            </div>
          )}

          {activeSection === "import" && (
            <div className="max-w-3xl space-y-12 animate-in slide-in-from-right-4 duration-300">
              {/* <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Ledger Import Wizard
                </h2>
              </div> */}

              <div className="flex border-b border-foreground mb-12">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 py-4 text-center text-xs font-black uppercase transition-all ${
                      importStep === step
                        ? "bg-foreground text-background"
                        : "text-zinc-300"
                    }`}
                  >
                    PHASE 0{step}
                  </div>
                ))}
              </div>

              {importStep === 1 && (
                <div className="space-y-8 animate-in fade-in">
                  <label className={labelClass}>Initialization Source</label>

                  <div className="bg-foreground border-l-4 border-foreground p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <HelpCircle
                        size={20}
                        className="text-foreground mt-0.5 shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider mb-2">
                          CSV FORMAT REQUIREMENTS
                        </h4>
                        <p className="text-xs font-medium text-zinc-600 leading-relaxed mb-3">
                          Your CSV file should include the following columns:
                          <span className="font-black">
                            description, amount, date, type, category, status,
                            note
                          </span>
                          . The date format should be
                          <span className="font-black">YYYY-MM-DD</span>. Type
                          should be either
                          <span className="font-black">"income"</span> or
                          <span className="font-black">"expense"</span>.
                        </p>
                        <button
                          onClick={downloadSampleCSV}
                          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all"
                        >
                          <Download size={14} />
                          Download Sample Template
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border border-foreground max-w-lg mb-8">
                    <button
                      onClick={() => setImportSource("file")}
                      className={`py-6 flex flex-col items-center gap-2 text-xs font-black uppercase ${
                        importSource === "file"
                          ? "bg-foreground text-background"
                          : "hover:bg-muted50"
                      }`}
                    >
                      <Upload size={16} /> File Upload
                    </button>
                    <button
                      onClick={() => setImportSource("text")}
                      className={`py-6 flex flex-col items-center gap-2 text-xs font-black uppercase ${
                        importSource === "text"
                          ? "bg-foreground text-background"
                          : "hover:bg-muted50"
                      }`}
                    >
                      <FileText size={16} /> Raw String
                    </button>
                    <button
                      onClick={() => {
                        setImportSource("table");
                        setCsvHeaders(tableData[0]);
                      }}
                      className={`py-6 flex flex-col items-center gap-2 text-xs font-black uppercase ${
                        importSource === "table"
                          ? "bg-foreground text-background"
                          : "hover:bg-muted50"
                      }`}
                    >
                      <Table size={16} /> Table Entry
                    </button>
                  </div>

                  {importSource === "file" && (
                    <div
                      onClick={() =>
                        document.getElementById("csv-upload").click()
                      }
                      className="border-2 border-dashed border-foreground py-20 flex flex-col items-center justify-center cursor-pointer hover:border-foreground transition-all group"
                    >
                      <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Upload
                        size={24}
                        className="mb-4 text-zinc-300 group-hover:text-foreground transition-all"
                      />
                      <span className="text-xs font-black uppercase tracking-widest">
                        Select .CSV Source
                      </span>
                      <p className="text-[9px] font-bold text-foreground/69 uppercase mt-2">
                        Data will be loaded into the table editor
                      </p>
                    </div>
                  )}

                  {importSource === "text" && (
                    <textarea
                      className="w-full border border-foreground p-4 h-48 text-xs font-mono outline-none focus:ring-1 focus:ring-black transition-all"
                      placeholder="PASTE COMMA-SEPARATED VALUES HERE..."
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                    />
                  )}

                  {importSource === "table" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-4 mb-2">
                        <button
                          onClick={handleAddColumn}
                          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-muted text-xs font-black uppercase tracking-widest transition-all"
                        >
                          <Plus size={12} /> Add Column
                        </button>
                        <button
                          onClick={handleAddRow}
                          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-muted text-xs font-black uppercase tracking-widest transition-all"
                        >
                          <Plus size={12} /> Add Row
                        </button>
                        <button
                          onClick={() => {
                            setTableData([
                              ["Date", "Description", "Amount", "Category"],
                              ["", "", "", ""],
                            ]);
                            setCsvHeaders([
                              "Date",
                              "Description",
                              "Amount",
                              "Category",
                            ]);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-foreground hover:bg-red-100 hover:text-red-600 text-xs font-black uppercase tracking-widest transition-all ml-auto"
                        >
                          <Trash2 size={12} /> Clear Table
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-foreground">
                        <table className="w-full text-left border-collapse ">
                          <thead className="text-background">
                            <tr>
                              {tableData[0].map((header, colIndex) => (
                                <th
                                  key={colIndex}
                                  className="border-b-2 border-r border-background bg-foreground p-0 min-w-37.5 relative group"
                                >
                                  <input
                                    type="text"
                                    value={header}
                                    onChange={(e) =>
                                      handleCellChange(
                                        0,
                                        colIndex,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full h-full p-3 bg-transparent text-xs font-black uppercase outline-none focus:bg-foreground transition-all"
                                    placeholder={`HEADER ${colIndex + 1}`}
                                  />
                                  <button
                                    onClick={() => handleRemoveColumn(colIndex)}
                                    className="absolute top-0 right-0 h-full m-4 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Remove Column"
                                  >
                                    <X size={12} />
                                  </button>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.slice(1).map((row, rowIndex) => (
                              <tr key={rowIndex} className="group">
                                {row.map((cell, colIndex) => (
                                  <td
                                    key={colIndex}
                                    className="border-b border-r border-foreground p-0 min-w-37.5"
                                  >
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) =>
                                        handleCellChange(
                                          rowIndex + 1,
                                          colIndex,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full h-full p-3 text-xs font-mono outline-none  transition-all"
                                    />
                                  </td>
                                ))}
                                <td className="w-10 border-b border-foreground text-center p-4">
                                  <button
                                    onClick={() =>
                                      handleRemoveRow(rowIndex + 1)
                                    }
                                    className="text-zinc-300 hover:text-red-500 transition-all"
                                    title="Remove Row"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs font-bold text-foreground/69 uppercase tracking-widest">
                        {tableData.length - 1} Data Rows • {tableData[0].length}
                        Columns
                      </p>
                    </div>
                  )}
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-8 animate-in fade-in">
                  {/* <label className={labelClass}>
                    Field Architecture Mapping
                  </label> */}
                  <p className="text-sm font-bold uppercase tracking-tight italic">
                    Map your CSV columns to system fields
                  </p>
                  <div className="divide-y divide-black/10 border border-foreground">
                    {[
                      { key: "date", label: "Transaction Date" },
                      { key: "description", label: "Description" },
                      { key: "amount", label: "Amount" },
                      { key: "category", label: "Category" },
                      { key: "type", label: "Type" },
                      { key: "note", label: "Note" },
                      { key: "status", label: "Status" },
                      {
                        key: "bankTransactionId",
                        label: "Bank Transaction ID",
                      },
                    ].map((field) => (
                      <div
                        key={field.key}
                        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <span className="text-xs font-black uppercase tracking-widest">
                          {field.label}
                        </span>
                        <select
                          className="border-b border-foreground py-2 text-xs font-bold outline-none bg-transparent min-w-50"
                          value={mapping[field.key]}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              [field.key]: e.target.value,
                            })
                          }
                        >
                          <option value="">SELECT CSV HEADER</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStep === 3 && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      {/* <label className={labelClass}>
                        Data Review & Assignment
                      </label> */}
                      <p className="text-sm font-bold uppercase tracking-tight italic">
                        Review data and assign transactions to accounts
                      </p>
                    </div>
                    <button
                      onClick={handleAddRow}
                      className="flex items-center gap-2 px-4 py-2 bg-foreground hover:bg-muted200 text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Plus size={12} /> Add Row
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-foreground">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          {tableData[0].map((h, i) => {
                            const mappedFieldKey = Object.keys(mapping).find(
                              (key) => mapping[key] === h,
                            );
                            const mappedLabel = mappedFieldKey
                              ? mappedFieldKey.toUpperCase()
                              : "";

                            return (
                              <th
                                key={i}
                                className="border-b-2 border-r border-foreground bg-foreground p-3 text-xs font-black uppercase tracking-widest min-w-37.5"
                              >
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] text-foreground/69">
                                    {mappedLabel}
                                  </span>
                                  <input
                                    type="text"
                                    value={h}
                                    onChange={(e) =>
                                      handleCellChange(0, i, e.target.value)
                                    }
                                    className="w-full bg-transparent outline-none font-black"
                                  />
                                </div>
                              </th>
                            );
                          })}
                          <th className="border-b-2 border-foreground bg-foreground p-3 text-xs font-black uppercase tracking-widest min-w-50">
                            Target Account
                          </th>
                          <th className="border-b-2 border-foreground bg-foreground p-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex} className="group hover:bg-muted50">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="border-b border-r border-foreground p-0 min-w-37.5"
                              >
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) =>
                                    handleCellChange(
                                      rowIndex + 1,
                                      cellIndex,
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-full p-3 text-xs font-mono outline-none bg-transparent focus:bg-white transition-all"
                                />
                              </td>
                            ))}
                            <td className="border-b border-foreground p-2">
                              <select
                                className="w-full bg-transparent outline-none text-xs font-bold uppercase cursor-pointer"
                                value={rowAccountMappings[rowIndex] || ""}
                                onChange={(e) =>
                                  setRowAccountMappings((prev) => ({
                                    ...prev,
                                    [rowIndex]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">-- Global / None --</option>
                                {accounts.map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border-b border-foreground p-2 text-center">
                              <button
                                onClick={() => handleRemoveRow(rowIndex + 1)}
                                className="text-zinc-300 hover:text-red-500 transition-all"
                                title="Remove Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs font-bold text-foreground/69 uppercase tracking-widest">
                    Edit data directly in the table. Map specific transactions
                    to accounts.
                  </p>
                </div>
              )}

              {importStep === 4 && (
                <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95">
                  <div className="w-16 h-16 border border-foreground flex items-center justify-center">
                    <Database size={24} className="animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">
                      Ready for Data Import
                    </h3>
                    {/* TODO : before sending to backend here i wanna verify that everything is good and can be sent to the backend */}
                    {/* <p className="text-xs font-bold text-foreground/69 uppercase tracking-widest mt-2">
                      Data mapping verified. System stands by for write
                      operation.
                    </p> */}
                  </div>
                </div>
              )}

              <div className="pt-12 border-t border-foreground flex justify-between items-center">
                <button
                  disabled={importStep === 1}
                  onClick={() => setImportStep((prev) => prev - 1)}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                    importStep === 1 ? "opacity-0" : "hover:italic"
                  }`}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <button
                  onClick={() => {
                    if (importStep === 1) {
                      if (importSource === "text") {
                        const rows = csvText
                          .split("\n")
                          .map((row) => row.split(","));
                        setTableData(rows);
                        setCsvHeaders(rows[0]);
                      }
                    }
                    importStep === 4
                      ? handleImport()
                      : setImportStep((prev) => prev + 1);
                  }}
                  className="px-10 py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all flex items-center gap-3 shadow-xl"
                >
                  {importStep === 4 ? "Initialize Injection" : "Next Phase"}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="max-w-xl space-y-12 animate-in slide-in-from-right-4">
              {/* <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Notification Center
                </h2>
              </div> */}

              <div className="space-y-12">
                <div className="flex items-center justify-between p-6 border border-foreground group hover:bg-muted50 transition-all">
                  <div>
                    <h3 className="text-xs font-black uppercase">
                      Email Alerts
                    </h3>
                    <p className="text-xs font-bold text-foreground/69 uppercase mt-1">
                      Receive bill detected & weekly summaries via email
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifEmail(!notifEmail)}
                    className={`w-12 h-6 border-2 border-foreground relative transition-all ${
                      notifEmail ? "bg-foreground" : "bg-white"
                    }`}
                  >
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 transition-all ${
                        notifEmail ? "right-1 bg-white" : "left-1 bg-foreground"
                      }`}
                    />
                  </button>
                </div>

                {notifEmail && (
                  <div className="p-6 border-l-2 border-foreground bg-foreground space-y-4 animate-in fade-in slide-in-from-left-2">
                    <label className={labelClass}>
                      Notification Destination Email
                    </label>
                    <input
                      type="email"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      className={inputClass}
                      placeholder="ENTER EMAIL (LEAVE BLANK FOR DEFAULT)"
                    />
                    <p className="text-[9px] font-bold text-foreground/69 uppercase mt-2">
                      If left blank, alerts will be sent to your account email:
                      {user?.email}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 border border-foreground group hover:bg-muted50 transition-all">
                    <div>
                      <h3 className="text-xs font-black uppercase">
                        Push Notifications (ntfy)
                      </h3>
                      <p className="text-xs font-bold text-foreground/69 uppercase mt-1">
                        Get real-time push alerts on your phone
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifNtfy(!notifNtfy)}
                      className={`w-12 h-6 border-2 border-foreground relative transition-all ${
                        notifNtfy ? "bg-foreground" : "bg-white"
                      }`}
                    >
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 transition-all ${
                          notifNtfy ? "right-1 bg-white" : "left-1 bg-foreground"
                        }`}
                      />
                    </button>
                  </div>

                  {notifNtfy && (
                    <div className="p-6 border-l-2 border-foreground bg-foreground space-y-4 animate-in fade-in slide-in-from-left-2">
                      <label className={labelClass}>ntfy.sh Topic URL</label>
                      <input
                        type="url"
                        value={ntfyTopic}
                        onChange={(e) => setNtfyTopic(e.target.value)}
                        className={inputClass}
                        placeholder="HTTPS://NTFY.SH/YOUR_PRIVATE_TOPIC"
                      />
                      <p className="text-[9px] font-bold text-foreground/69 uppercase mt-2">
                        Download the ntfy app and subscribe to this topic to
                        receive alerts.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-10 py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all flex items-center gap-3 shadow-xl"
                >
                  {loading ? "Synchronizing..." : "Save Notification Settings"}
                  <Save size={14} />
                </button>
              </div>
            </div>
          )}

          {activeSection === "tours" && (
            <div className="max-w-xl space-y-12 animate-in slide-in-from-right-4">
              {/* <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Platform Education
                </h2>
              </div> */}
              <div className="space-y-8">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/69 leading-relaxed">
                  Resetting tours will re-enable the guided walkthroughs for all
                  platform modules.
                </p>
                <button
                  onClick={handleRestartTours}
                  className="px-10 py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all flex items-center gap-3 shadow-xl"
                >
                  Restart All Walkthroughs
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
