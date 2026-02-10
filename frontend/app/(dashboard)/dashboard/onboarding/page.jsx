"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  X,
  Wallet,
  CreditCard,
  TrendingUp,
  Landmark,
  RefreshCw,
  User,
  Camera,
  Sun,
  Moon,
} from "lucide-react";
import {
  completeOnboardingAction,
  updateUserSettingsAction,
} from "@/actions/userActions";
import { fetchCurrencies, fetchInvestmentTypes } from "@/actions/adminActions";
import { fetchAccountTypes } from "@/actions/accountActions";
import { showSuccess, showError } from "@/utils/alert";
import { useUserStore } from "@/store/useUserStore";

const steps = [
  { id: "profile", title: "Identity", icon: User },
  { id: "accounts", title: "Bank & Cash", icon: Wallet },
  { id: "cards", title: "Credit Cards", icon: CreditCard },
  { id: "investments", title: "Investments", icon: TrendingUp },
  { id: "liabilities", title: "Loans & Debts", icon: Landmark },
  { id: "cashflow", title: "Cash Flow", icon: RefreshCw },
];

const frequencies = ["Monthly", "Weekly", "Yearly"];

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { user, updateUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await updateUserSettingsAction({ isOnboardingCompleted: true });
      updateUser({ isOnboardingCompleted: true });
      showSuccess("ONBOARDING SKIPPED", "YOU CAN CONFIGURE LATER IN SETTINGS");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    username: "",
    currency: "INR",
    theme: "light",
    avatar: null,
    bankAccounts: [],
    creditCards: [],
    investments: [],
    loans: [],
    otherExpenses: [],
    otherIncomeSources: [],
  });
  const [currencies, setCurrencies] = useState([]);
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [currRes, invRes, accRes] = await Promise.all([
        fetchCurrencies(),
        fetchInvestmentTypes(),
        fetchAccountTypes(),
      ]);
      if (currRes.success) setCurrencies(currRes.data);
      if (invRes.success) setInvestmentTypes(invRes.data.map((t) => t.name));
      if (accRes.success) setAccountTypes(accRes.data);
    };
    loadData();
  }, []);

  const handleAddItem = (stepId) => {
    let newItem = { name: "", balance: "", currency: formData.currency };
    if (stepId === "accounts")
      newItem = {
        name: "",
        balance: "",
        accountType: "savings",
        accountNumber: "",
        currency: formData.currency,
      };
    else if (stepId === "cards")
      newItem = {
        name: "",
        balance: "",
        bankName: "",
        billDueDate: "",
        accountNumber: "",
        currency: formData.currency,
      };
    else if (stepId === "investments")
      newItem = {
        name: "",
        balance: "",
        investmentType: investmentTypes[0] || "Stocks",
        currency: formData.currency,
      };
    else if (stepId === "liabilities")
      newItem = {
        name: "",
        balance: "",
        principalAmount: "",
        emiAmount: "",
        currency: formData.currency,
      };
    else if (stepId === "cashflow")
      newItem = { name: "", amount: "", frequency: "Monthly", type: "expense" };

    const key =
      stepId === "accounts"
        ? "bankAccounts"
        : stepId === "cards"
          ? "creditCards"
          : stepId === "liabilities"
            ? "loans"
            : stepId === "cashflow"
              ? "otherExpenses"
              : stepId;
    setFormData((prev) => ({ ...prev, [key]: [...prev[key], newItem] }));
  };

  const handleRemoveItem = (key, index) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleChange = (key, index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev[key]];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, [key]: newItems };
    });
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
    else {
      setIsLoading(true);
      try {
        const result = await completeOnboardingAction(formData);
        if (result.success) {
          if (formData.theme) {
            localStorage.setItem("theme", formData.theme);
          }
          updateUser({
            isOnboardingCompleted: true,
            name: formData.username,
            currency: formData.currency,
            theme: formData.theme,
          });

          showSuccess("INITIALIZATION COMPLETE", "SYSTEM BASELINE ESTABLISHED");
          router.push("/dashboard");
        } else {
          showError(
            "INITIALIZATION FAILED",
            result.error || "COULD NOT SAVE BASELINE",
          );
        }
      } catch (error) {
        console.error(error);
        showError("SYSTEM ERROR", "UNEXPECTED FAULT DURING SYNC");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const labelClass =
    "text-xs font-black uppercase tracking-widest text-foreground/69 mb-2 block";
  const inputClass =
    "w-full border-b border-foreground/20 py-2 text-sm font-bold focus:border-foreground outline-none transition-all bg-transparent uppercase placeholder-zinc-200";

  const renderStepContent = () => {
    const step = steps[currentStep];
    switch (step.id) {
      case "profile":
        return (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="space-y-4">
                <label className={labelClass}>INIT IMAGE</label>
                <div className="w-32 h-32 border border-foreground flex flex-col items-center justify-center group cursor-pointer hover:bg-foreground transition-all">
                  <Camera
                    size={20}
                    className="group-hover:text-background transition-colors"
                  />
                  <span className="text-[8px] font-black uppercase mt-2 group-hover:text-background">
                    Upload
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-8">
                <div className="space-y-1">
                  <label className={labelClass}>System Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toUpperCase(),
                      })
                    }
                    className={inputClass}
                    placeholder="E.G. MONEY_DON_01"
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Base Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className={inputClass}
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className={labelClass}>Visual Mode</label>
              <div className="grid grid-cols-2 border border-foreground max-w-sm">
                <button
                  onClick={() => setFormData({ ...formData, theme: "light" })}
                  className={`py-6 flex flex-col items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                    formData.theme === "light"
                      ? "bg-foreground text-background"
                      : "hover:bg-muted50"
                  }`}
                >
                  <Sun size={16} /> Light Mode
                </button>
                <button
                  onClick={() => setFormData({ ...formData, theme: "dark" })}
                  className={`py-6 flex flex-col items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                    formData.theme === "dark"
                      ? "bg-foreground text-background"
                      : "hover:bg-muted50"
                  }`}
                >
                  <Moon size={16} /> Dark Mode
                </button>
              </div>
              <p className="text-[9px] font-bold text-foreground/69 uppercase tracking-tighter">
                System will re-render colors based on this preference.
              </p>
            </div>
          </div>
        );

      case "accounts":
        return (
          <div className="space-y-12">
            {formData.bankAccounts.map((item, index) => (
              <div
                key={index}
                className="p-8 border border-foreground relative animate-in fade-in slide-in-from-bottom-2"
              >
                <button
                  onClick={() => handleRemoveItem("bankAccounts", index)}
                  className="absolute top-4 right-4 text-zinc-300 hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Institution Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleChange(
                          "bankAccounts",
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="HDFC / CHASE"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Account Class</label>
                    <select
                      value={item.accountType}
                      onChange={(e) =>
                        handleChange(
                          "bankAccounts",
                          index,
                          "accountType",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      {accountTypes
                        .filter((t) => t.category === "asset")
                        .map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name.toUpperCase()}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Current Volume</label>
                    <input
                      type="number"
                      value={item.balance}
                      onChange={(e) =>
                        handleChange(
                          "bankAccounts",
                          index,
                          "balance",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => handleAddItem("accounts")}
              className="w-full py-8 border border-dashed border-foreground/20 text-xs font-black uppercase tracking-widest hover:border-foreground transition-all"
            >
              + Register Account
            </button>
          </div>
        );
      case "cards":
        return (
          <div className="space-y-12">
            {formData.creditCards.map((item, index) => (
              <div key={index} className="p-8 border border-foreground relative">
                <button
                  onClick={() => handleRemoveItem("creditCards", index)}
                  className="absolute top-4 right-4 text-zinc-300 hover:text-foreground"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Issuer</label>
                    <input
                      type="text"
                      value={item.bankName}
                      onChange={(e) =>
                        handleChange(
                          "creditCards",
                          index,
                          "bankName",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="AMEX / VISA"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Liability Amount</label>
                    <input
                      type="number"
                      value={item.balance}
                      onChange={(e) =>
                        handleChange(
                          "creditCards",
                          index,
                          "balance",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="OUTSTANDING"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => handleAddItem("cards")}
              className="w-full py-8 border border-dashed border-foreground/20 text-xs font-black uppercase tracking-widest hover:border-foreground transition-all"
            >
              + Register Card
            </button>
          </div>
        );
      case "investments":
        return (
          <div className="space-y-12">
            {formData.investments.map((item, index) => (
              <div key={index} className="p-8 border border-foreground relative">
                <button
                  onClick={() => handleRemoveItem("investments", index)}
                  className="absolute top-4 right-4 text-zinc-300 hover:text-foreground"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Asset Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleChange(
                          "investments",
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="RELIANCE / APPLE"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      value={item.investmentType}
                      onChange={(e) =>
                        handleChange(
                          "investments",
                          index,
                          "investmentType",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      {investmentTypes.map((t) => (
                        <option key={t} value={t}>
                          {t.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Current Value</label>
                    <input
                      type="number"
                      value={item.balance}
                      onChange={(e) =>
                        handleChange(
                          "investments",
                          index,
                          "balance",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => handleAddItem("investments")}
              className="w-full py-8 border border-dashed border-foreground/20 text-xs font-black uppercase tracking-widest hover:border-foreground transition-all"
            >
              + Register Investment
            </button>
          </div>
        );
      case "liabilities":
        return (
          <div className="space-y-12">
            {formData.loans.map((item, index) => (
              <div key={index} className="p-8 border border-foreground relative">
                <button
                  onClick={() => handleRemoveItem("loans", index)}
                  className="absolute top-4 right-4 text-zinc-300 hover:text-foreground"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Loan Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleChange("loans", index, "name", e.target.value)
                      }
                      className={inputClass}
                      placeholder="HOME LOAN / CAR LOAN"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Principal</label>
                    <input
                      type="number"
                      value={item.principalAmount}
                      onChange={(e) =>
                        handleChange(
                          "loans",
                          index,
                          "principalAmount",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Monthly EMI</label>
                    <input
                      type="number"
                      value={item.emiAmount}
                      onChange={(e) =>
                        handleChange(
                          "loans",
                          index,
                          "emiAmount",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => handleAddItem("liabilities")}
              className="w-full py-8 border border-dashed border-foreground/20 text-xs font-black uppercase tracking-widest hover:border-foreground transition-all"
            >
              + Register Liability
            </button>
          </div>
        );
      case "cashflow":
        return (
          <div className="space-y-16">
            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest border-l-2 border-foreground pl-4">
                Recurring Inflow
              </h3>
              {formData.otherIncomeSources.map((item, index) => (
                <div key={index} className="p-8 border border-foreground relative">
                  <button
                    onClick={() =>
                      handleRemoveItem("otherIncomeSources", index)
                    }
                    className="absolute top-4 right-4 text-zinc-300 hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className={labelClass}>Source</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleChange(
                            "otherIncomeSources",
                            index,
                            "name",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="SALARY / RENT"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Amount</label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          handleChange(
                            "otherIncomeSources",
                            index,
                            "amount",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Frequency</label>
                      <select
                        value={item.frequency}
                        onChange={(e) =>
                          handleChange(
                            "otherIncomeSources",
                            index,
                            "frequency",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      >
                        {frequencies.map((f) => (
                          <option key={f} value={f}>
                            {f.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    otherIncomeSources: [
                      ...prev.otherIncomeSources,
                      {
                        name: "",
                        amount: "",
                        frequency: "Monthly",
                        type: "income",
                      },
                    ],
                  }));
                }}
                className="w-full py-4 border border-dashed border-foreground/20 text-[8px] font-black uppercase tracking-widest hover:border-foreground transition-all"
              >
                + Register Inflow
              </button>
            </div>

            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest border-l-2 border-foreground pl-4">
                Recurring Outflow
              </h3>
              {formData.otherExpenses.map((item, index) => (
                <div key={index} className="p-8 border border-foreground relative">
                  <button
                    onClick={() => handleRemoveItem("otherExpenses", index)}
                    className="absolute top-4 right-4 text-zinc-300 hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className={labelClass}>Expense</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleChange(
                            "otherExpenses",
                            index,
                            "name",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="RENT / NETFLIX"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Amount</label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          handleChange(
                            "otherExpenses",
                            index,
                            "amount",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Frequency</label>
                      <select
                        value={item.frequency}
                        onChange={(e) =>
                          handleChange(
                            "otherExpenses",
                            index,
                            "frequency",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      >
                        {frequencies.map((f) => (
                          <option key={f} value={f}>
                            {f.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => handleAddItem("cashflow")}
                className="w-full py-4 border border-dashed border-foreground/20 text-[8px] font-black uppercase tracking-widest hover:border-foreground transition-all"
              >
                + Register Outflow
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="py-20 text-center text-zinc-300 uppercase font-black text-xs tracking-widest">
            Module under initialization
          </div>
        );
    }
  };

  return (
    <div className="bg-white text-foreground font-sans flex overflow-hidden h-screen">
      <div className="w-80 border-r border-foreground hidden md:flex flex-col p-12">
        <div className="mb-20">
          <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-black italic text-xl mb-4">
            M
          </div>
          <h1 className="text-xs font-black tracking-[0.3em] uppercase italic">
            System Init
          </h1>
        </div>

        <div className="flex-1 space-y-12">
          {steps.map((s, i) => (
            <div key={s.id} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 border flex items-center justify-center text-xs font-black transition-all ${
                    i <= currentStep
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/10 text-zinc-300"
                  }`}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-px h-12 my-2 ${
                      i < currentStep ? "bg-foreground" : "bg-foreground/10"
                    }`}
                  />
                )}
              </div>
              <div className="pt-0.5">
                <h3
                  className={`text-xs font-black uppercase tracking-widest transition-colors ${
                    i === currentStep
                      ? "text-foreground italic underline underline-offset-4"
                      : "text-zinc-300"
                  }`}
                >
                  {s.title}
                </h3>
                <p className="text-[8px] font-bold text-zinc-300 uppercase mt-1 tracking-tighter">
                  {i === currentStep
                    ? "Active"
                    : i < currentStep
                      ? "Recorded"
                      : "Pending"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSkip}
          disabled={isLoading}
          className="text-[12px] font-black border-2 border-foreground px-8 py-4 hover:bg-foreground hover:text-background transition-all uppercase tracking-tighter"
        >
          {isLoading ? "PROCEEDING..." : "Skip & Take Guided Tour"}
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-12 md:p-24 flex-1">
          <div className="mb-20">
            <p className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-2">
              Section 0{currentStep + 1}
            </p>
            <h2 className="text-5xl font-black tracking-tighter italic uppercase">
              {steps[currentStep].title}
            </h2>
            <p className="text-foreground/69 font-medium mt-4 max-w-md">
              Initialize your financial baseline for the platform logic.
            </p>
          </div>

          <div className="pb-24">{renderStepContent()}</div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-foreground p-8 flex justify-between items-center z-10">
          <button
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 0}
            className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
              currentStep === 0 ? "opacity-0" : "hover:italic transition-all"
            }`}
          >
            <ArrowLeft size={14} /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-12 py-4 bg-foreground text-background text-xs font-black uppercase tracking-widest hover:bg-muted800 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isLoading
              ? "Synchronizing..."
              : currentStep === steps.length - 1
                ? "Complete Initialization"
                : "Next Phase"}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
