import { create } from "zustand";
import { fetchAllData } from "@/actions/miscActions";
import { fetchCurrencies } from "@/actions/adminActions";
import { fetchAccountTypes } from "@/actions/accountActions";
import { fetchCategories } from "@/actions/categoryActions";
import { fetchBudgets } from "@/actions/budgetActions";

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  accounts: [],
  budgets: [],
  categories: [],
  currencies: [],
  accountTypes: [],

  isLoading: false,
  isInitialized: false,
  error: null,

  pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },

  setTransactions: (data) => set({ transactions: data }),
  setAccounts: (data) => set({ accounts: data }),
  setBudgets: (data) => set({ budgets: data }),
  setCategories: (data) => set({ categories: data }),
  setCurrencies: (data) => set({ currencies: data }),
  setAccountTypes: (data) => set({ accountTypes: data }),
  setPagination: (data) => set({ pagination: data }),

  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),

  fetchGlobalData: async (force = false) => {
    const state = get();
    if (state.isInitialized && !force) return;

    set({ isLoading: true, error: null });
    try {
      const [allData, currenciesRes, accountTypesRes] = await Promise.all([
        fetchAllData(),
        fetchCurrencies(),
        fetchAccountTypes(),
      ]);

      if (allData) {
        set({
          transactions: allData.transactions || [],
          accounts: allData.accounts || [],
          budgets: allData.budgets || [],
          categories: allData.categories || [],
        });
      }

      if (currenciesRes.success) {
        set({ currencies: currenciesRes.data });
      }

      if (accountTypesRes.success) {
        set({ accountTypes: accountTypesRes.data });
      }

      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error("Error fetching global data:", error);
      set({ error: "Failed to fetch data", isLoading: false });
    }
  },

  refreshTransactions: async () => {
    const data = await fetchAllData();
    if (data) {
      set({
        transactions: data.transactions,
        accounts: data.accounts,
        budgets: data.budgets,
        categories: data.categories,
      });
    }
  },
}));
