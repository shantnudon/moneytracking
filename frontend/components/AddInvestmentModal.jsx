"use client";

import React, { useState, useEffect } from "react";
import {
  createInvestmentAction,
  updateInvestmentAction,
  getInvestmentQuoteAction,
  searchInvestmentsAction,
} from "@/actions/investmentActions";
import { getAccountsAction } from "@/actions/accountActions";
import Modal from "./UI/Modal";
import { FormInput, FormSelect, FormDateInput } from "./UI/Form";
import Button from "./UI/Button";
import { showSuccessToast, showErrorToast } from "@/utils/alert";

const AddInvestmentModal = ({
  isOpen,
  onClose,
  accountId,
  onInvestmentAdded,
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    type: "stock",
    symbol: "",
    name: "",
    quantity: "",
    buyPrice: "",
    buyDate: new Date().toISOString().split("T")[0],
    sourceAccountId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getAccountsAction();
        setAccounts(data.filter((acc) => acc.id !== accountId));
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    };
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen, accountId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        symbol: initialData.symbol,
        name: initialData.name,
        quantity: initialData.quantity.toString(),
        buyPrice: initialData.buyPrice.toString(),
        buyDate: new Date(initialData.buyDate).toISOString().split("T")[0],
        sourceAccountId: "",
      });
    } else {
      setFormData({
        type: "stock",
        symbol: "",
        name: "",
        quantity: "",
        buyPrice: "",
        buyDate: new Date().toISOString().split("T")[0],
        sourceAccountId: "",
      });
    }
  }, [initialData, isOpen]);

  const handleFetchQuote = async () => {
    if (!formData.symbol) return;
    setIsFetchingQuote(true);
    try {
      const quote = await getInvestmentQuoteAction(formData.symbol);
      setFormData((prev) => ({
        ...prev,
        name: quote.name,
        buyPrice: quote.price.toString(),
      }));
      showSuccessToast("Stock details fetched");
      setShowSearchResults(false);
    } catch (error) {
      showErrorToast(error.message, "Fetch Failed");
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchInvestmentsAction(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    setFormData((prev) => ({
      ...prev,
      symbol: result.symbol,
      name: result.name,
    }));
    setShowSearchResults(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = {
        ...formData,
        accountId: accountId,
        quantity: parseFloat(formData.quantity),
        buyPrice: parseFloat(formData.buyPrice),
        buyDate: new Date(formData.buyDate).toISOString(),
        sourceAccountId: formData.sourceAccountId
          ? formData.sourceAccountId
          : undefined,
      };

      if (initialData) {
        await updateInvestmentAction(initialData.id, data);
        showSuccessToast("Investment updated");
      } else {
        await createInvestmentAction(data);
        showSuccessToast("Investment added");
      }

      onInvestmentAdded();
      onClose();
    } catch (error) {
      showErrorToast(
        error.message,
        `Failed to ${initialData ? "update" : "add"} investment`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Position" : "Add New Asset"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {!initialData && (
          <FormSelect
            label="Pay From (Source Account)"
            value={formData.sourceAccountId}
            onChange={(e) =>
              setFormData({ ...formData, sourceAccountId: e.target.value })
            }
            options={[
              { value: "", label: "No Transaction (Manual Entry)" },
              ...accounts.map((acc) => ({
                value: acc.id.toString(),
                label: `${acc.name} (${
                  acc.currency
                } ${acc.balance.toLocaleString()})`,
              })),
            ]}
          />
        )}
        <div className="grid grid-cols-2 gap-8">
          <FormSelect
            label="Asset Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: "stock", label: "Stock" },
              { value: "mutual_fund", label: "Mutual Fund" },
            ]}
          />
          <div className="flex gap-2 items-end relative">
            <div className="flex-1">
              <FormInput
                label="Symbol / Search"
                type="text"
                value={formData.symbol}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setFormData({ ...formData, symbol: val });
                  if (val.length >= 3) handleSearch(val);
                }}
                onFocus={() =>
                  formData.symbol.length >= 3 && setShowSearchResults(true)
                }
                placeholder="e.g. RELIANCE.NS"
                required
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-foreground shadow-xl max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      type="button"
                      onClick={() => selectSearchResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-muted50 border-b border-foreground/5 last:border-0 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-black italic">
                          {result.symbol}
                        </p>
                        <p className="text-xs font-bold text-foreground/69 uppercase truncate max-w-37.5">
                          {result.name}
                        </p>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest bg-foreground px-1.5 py-0.5">
                        {result.exchange}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleFetchQuote}
              disabled={isFetchingQuote || !formData.symbol}
              className="mb-0.5 h-10.5"
            >
              {isFetchingQuote ? "..." : "Fetch"}
            </Button>
          </div>
        </div>

        <FormInput
          label="Asset Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Reliance Industries"
          required
        />

        <div className="grid grid-cols-2 gap-8">
          <FormInput
            label="Quantity"
            type="number"
            step="0.001"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            placeholder="0.00"
            required
          />
          <FormInput
            label="Buy Price"
            type="number"
            step="0.01"
            value={formData.buyPrice}
            onChange={(e) =>
              setFormData({ ...formData, buyPrice: e.target.value })
            }
            placeholder="0.00"
            required
          />
        </div>

        <FormDateInput
          label="Purchase Date"
          value={formData.buyDate}
          onChange={(e) =>
            setFormData({ ...formData, buyDate: e.target.value })
          }
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading
            ? "Processing..."
            : initialData
              ? "Update Position"
              : "Add to Portfolio"}
        </Button>
      </form>
    </Modal>
  );
};

export default AddInvestmentModal;
