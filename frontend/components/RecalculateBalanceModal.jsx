"use client";

import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { recalculateBalanceAction } from "@/actions/accountActions";
import { createTransactionAction } from "@/actions/transactionActions";

import Modal from "./UI/Modal";

const RecalculateBalanceModal = ({
  isOpen,
  onClose,
  accountId,
  accountName,
  currentBalance,
  currency,
  onResolved,
}) => {
  const [step, setStep] = useState("checking");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    setIsLoading(true);
    try {
      const res = await recalculateBalanceAction(accountId, true);
      setData(res.data);
      if (Math.abs(res.data.deviation) < 0.01) {
        setStep("no-deviation");
      } else {
        setStep("deviation");
      }
    } catch (error) {
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (withTransaction = false) => {
    setIsLoading(true);
    try {
      if (withTransaction) {
        const transactionData = {
          description: `Balance Correction for ${accountName}`,
          amount: Math.abs(data.deviation),
          type: data.deviation > 0 ? "expense" : "income",
          accountId: accountId,
          date: new Date().toISOString(),
          status: "settled",
          source: "System Correction",
        };
        await createTransactionAction(transactionData);
      }

      await recalculateBalanceAction(accountId, false);
      setStep("resolved");
      onResolved();
    } catch (error) {
      alert("Failed to resolve: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setStep("checking");
      handleCheck();
    }
  }, [isOpen]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
    }).format(value);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recalculate Balance"
      size="md"
    >
      <div className="space-y-6">
        {step === "checking" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Analyzing account history...
            </p>
          </div>
        )}

        {step === "no-deviation" && (
          <div className="flex flex-col items-center py-8 space-y-4 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-background">
                Everything looks good!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                The current balance matches the calculated history.
              </p>
              {data?.wasDoubleCounted && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> We detected and corrected a
                    double-counted opening balance in this analysis. Your ledger
                    is now accurate.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-background font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {step === "deviation" && (
          <div className="space-y-6">
            <div className="flex items-start space-x-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-400">
                  Deviation Detected
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-500 mt-1">
                  There is a deviation of
                  <span className="font-bold">
                    {formatCurrency(data.deviation)}
                  </span>
                  between your current balance and calculated history.
                </p>
                {data.wasDoubleCounted && (
                  <div className="mt-3 p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-tight">
                      <strong>Note:</strong> We detected that your Opening
                      Balance was being counted twice (once as a starting
                      balance and once as a transaction). We have adjusted the
                      calculation to treat your Starting Balance as 0 to fix
                      this.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-500">Starting Balance</p>
                <p className="font-bold text-gray-900 dark:text-background">
                  {formatCurrency(data.startingBalance)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-500">Transaction Net</p>
                <p
                  className={`font-bold ${data.transactionsChange >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {data.transactionsChange > 0 ? "+" : ""}
                  {formatCurrency(data.transactionsChange)}
                </p>
              </div>
              <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-gray-500">Calculated History</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.calculatedBalance)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500">Actual Ledger Balance</p>
                <p className="font-bold text-gray-900 dark:text-background">
                  {formatCurrency(data.currentBalance)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Would you like to resolve this?
              </p>
              <button
                onClick={() => handleResolve(true)}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 bg-blue-600 text-background rounded-xl hover:bg-blue-700 transition-all group"
              >
                <div className="text-left">
                  <p className="font-bold">Yes, fix with transaction</p>
                  <p className="text-xs text-blue-100">
                    Adds a correction transaction to history
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => handleResolve(false)}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-background rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all group"
              >
                <div className="text-left">
                  <p className="font-bold">Yes, just update balance</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Updates balance without adding a transaction
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm font-medium"
              >
                No, leave it for now
              </button>
            </div>
          </div>
        )}

        {step === "resolved" && (
          <div className="flex flex-col items-center py-8 space-y-4 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-background">
                Resolved!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                The account balance has been synchronized.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-blue-600 text-background font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center py-8 space-y-4 text-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <X className="w-12 h-12 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-background">
                Error
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Failed to recalculate balance. Please try again later.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-background font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RecalculateBalanceModal;
