"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Globe, Briefcase } from "lucide-react";
import {
  fetchCurrencies,
  fetchInvestmentTypes,
  createCurrencyAction,
  createInvestmentTypeAction,
  deleteCurrencyAction,
  deleteInvestmentTypeAction,
} from "@/actions/adminActions";
import { showSuccess, showError, showConfirm } from "@/utils/alert";

export default function AdminSystemPage() {
  const [currencies, setCurrencies] = useState([]);
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showInvTypeModal, setShowInvTypeModal] = useState(false);

  const [currencyForm, setCurrencyForm] = useState({ code: "", label: "" });
  const [invTypeForm, setInvTypeForm] = useState({ name: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currRes, invRes] = await Promise.all([
        fetchCurrencies(),
        fetchInvestmentTypes(),
      ]);
      if (currRes.success) setCurrencies(currRes.data);
      if (invRes.success) setInvestmentTypes(invRes.data);
    } catch (error) {
      showError("SYNC ERROR", "COULD NOT RETRIEVE SYSTEM DATA");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCurrency = async (e) => {
    e.preventDefault();
    const res = await createCurrencyAction(currencyForm);
    if (res.success) {
      showSuccess("CURRENCY ADDED", "NEW SYSTEM CURRENCY REGISTERED");
      setShowCurrencyModal(false);
      setCurrencyForm({ code: "", label: "" });
      loadData();
    } else {
      showError("FAILED", res.error || "COULD NOT ADD CURRENCY");
    }
  };

  const handleCreateInvType = async (e) => {
    e.preventDefault();
    const res = await createInvestmentTypeAction(invTypeForm);
    if (res.success) {
      showSuccess("TYPE ADDED", "NEW INVESTMENT TYPE REGISTERED");
      setShowInvTypeModal(false);
      setInvTypeForm({ name: "" });
      loadData();
    } else {
      showError("FAILED", res.error || "COULD NOT ADD TYPE");
    }
  };

  const handleDeleteCurrency = async (id) => {
    const confirm = await showConfirm(
      "DELETE CURRENCY",
      "THIS MAY AFFECT USERS USING THIS CURRENCY",
      "DELETE",
      "CANCEL",
    );
    if (confirm.isConfirmed) {
      const res = await deleteCurrencyAction(id);
      if (res.success) {
        showSuccess("DELETED", "CURRENCY REMOVED FROM SYSTEM");
        loadData();
      } else {
        showError("FAILED", res.error || "COULD NOT DELETE");
      }
    }
  };

  const handleDeleteInvType = async (id) => {
    const confirm = await showConfirm(
      "DELETE TYPE",
      "THIS MAY AFFECT EXISTING INVESTMENTS",
      "DELETE",
      "CANCEL",
    );
    if (confirm.isConfirmed) {
      const res = await deleteInvestmentTypeAction(id);
      if (res.success) {
        showSuccess("DELETED", "INVESTMENT TYPE REMOVED");
        loadData();
      } else {
        showError("FAILED", res.error || "COULD NOT DELETE");
      }
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 text-black font-sans animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-black/10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            System Admin
          </h1>
          <p className="text-zinc-400 font-medium mt-2">
            Manage global currencies and investment types
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <div className="flex items-center gap-3">
              <Globe size={18} />
              <h3 className="font-black uppercase tracking-widest text-sm">
                Currencies
              </h3>
            </div>
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="text-xs font-black border border-black px-3 py-1 hover:bg-black hover:text-white transition-all"
            >
              ADD NEW
            </button>
          </div>

          <div className="divide-y divide-black/5">
            {currencies.map((c) => (
              <div
                key={c.id}
                className="py-4 flex items-center justify-between group"
              >
                <div>
                  <span className="text-sm font-black uppercase">{c.code}</span>
                  <span className="ml-4 text-xs font-bold text-zinc-400 uppercase">
                    {c.label}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteCurrency(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-black transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-black pb-2">
            <div className="flex items-center gap-3">
              <Briefcase size={18} />
              <h3 className="font-black uppercase tracking-widest text-sm">
                Investment Types
              </h3>
            </div>
            <button
              onClick={() => setShowInvTypeModal(true)}
              className="text-xs font-black border border-black px-3 py-1 hover:bg-black hover:text-white transition-all"
            >
              ADD NEW
            </button>
          </div>

          <div className="divide-y divide-black/5">
            {investmentTypes.map((t) => (
              <div
                key={t.id}
                className="py-4 flex items-center justify-between group"
              >
                <span className="text-sm font-black uppercase">{t.name}</span>
                <button
                  onClick={() => handleDeleteInvType(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-black transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showCurrencyModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase tracking-tighter italic">
                Add Currency
              </h2>
              <button onClick={() => setShowCurrencyModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCurrency} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-zinc-400">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={currencyForm.code}
                  onChange={(e) =>
                    setCurrencyForm({
                      ...currencyForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full border-b border-black/20 py-2 text-sm font-bold focus:border-black outline-none transition-all"
                  placeholder="USD, INR, EUR"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-zinc-400">
                  Label
                </label>
                <input
                  type="text"
                  value={currencyForm.label}
                  onChange={(e) =>
                    setCurrencyForm({ ...currencyForm, label: e.target.value })
                  }
                  className="w-full border-b border-black/20 py-2 text-sm font-bold focus:border-black outline-none transition-all"
                  placeholder="US DOLLAR"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-black text-white text-xs font-black uppercase hover:bg-zinc-800 transition-all"
              >
                Register Currency
              </button>
            </form>
          </div>
        </div>
      )}

      {showInvTypeModal && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase tracking-tighter italic">
                Add Investment Type
              </h2>
              <button onClick={() => setShowInvTypeModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateInvType} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-zinc-400">
                  Type Name
                </label>
                <input
                  type="text"
                  value={invTypeForm.name}
                  onChange={(e) =>
                    setInvTypeForm({ ...invTypeForm, name: e.target.value })
                  }
                  className="w-full border-b border-black/20 py-2 text-sm font-bold focus:border-black outline-none transition-all"
                  placeholder="STOCKS, CRYPTO, REAL ESTATE"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-black text-white text-xs font-black uppercase hover:bg-zinc-800 transition-all"
              >
                Register Type
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
