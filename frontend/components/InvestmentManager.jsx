"use client";

import { useState } from "react";
import Button from "./UI/Button";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  EmptyTableState,
} from "./UI/Table";
import { RefreshCw, Plus, Edit2, Trash2 } from "lucide-react";
import {
  refreshInvestmentPricesAction,
  deleteInvestmentAction,
} from "@/actions/investmentActions";
import AddInvestmentModal from "./AddInvestmentModal";
import {
  showSuccessToast,
  showErrorToast,
  showConfirmationDialog,
} from "@/utils/alert";
import { formatCurrency } from "@/utils/format";

const InvestmentManager = ({ accountId, investments, summary, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      await refreshInvestmentPricesAction(accountId);
      showSuccessToast("Market prices updated");
      onRefresh();
    } catch (error) {
      showErrorToast(error.message, "Sync Failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await showConfirmationDialog(
      "Delete Position?",
      "This will permanently remove this asset from your portfolio.",
    );
    const confirmed = result.isConfirmed;

    if (confirmed) {
      try {
        await deleteInvestmentAction(id);
        showSuccessToast("Position removed");
        onRefresh();
      } catch (error) {
        showErrorToast(error.message, "Delete Failed");
      }
    }
  };

  const handleEdit = (investment) => {
    setEditingInvestment(investment);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingInvestment(null);
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter italic">
            Portfolio
          </h3>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Asset Management
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
            icon={RefreshCw}
          >
            {isRefreshing ? "SYNCING..." : "REFRESH"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={Plus}
          >
            ADD ASSET
          </Button>
        </div>
      </div>

      <AddInvestmentModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        accountId={accountId}
        onInvestmentAdded={onRefresh}
        initialData={editingInvestment}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-black">
        <div className="p-8 border-b border-r border-black">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
            Principal
          </p>
          <p className="text-2xl font-black tracking-tighter italic">
            {formatCurrency(summary?.totalInvested || 0)}
          </p>
        </div>
        <div className="p-8 border-b border-r border-black">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
            Market Value
          </p>
          <p className="text-2xl font-black tracking-tighter italic">
            {formatCurrency(summary?.currentValue || 0)}
          </p>
        </div>
        <div className="p-8 border-b border-r border-black">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
            Performance
          </p>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-2xl font-black tracking-tighter italic ${
                summary?.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(summary?.totalGainLoss || 0)}
            </p>
            <span
              className={`text-xs font-black ${
                summary?.totalGainLoss >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {summary?.totalGainLossPercent || 0}%
            </span>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableHeaderCell>Asset</TableHeaderCell>
          <TableHeaderCell>Qty</TableHeaderCell>
          <TableHeaderCell>Buy</TableHeaderCell>
          <TableHeaderCell>Current</TableHeaderCell>
          <TableHeaderCell>Value</TableHeaderCell>
          <TableHeaderCell>P&L</TableHeaderCell>
          <TableHeaderCell align="right">Actions</TableHeaderCell>
        </TableHeader>
        <TableBody>
          {investments.map((inv) => {
            const gainLoss = (inv.currentPrice - inv.buyPrice) * inv.quantity;
            const gainLossPercent =
              inv.buyPrice > 0
                ? ((inv.currentPrice - inv.buyPrice) / inv.buyPrice) * 100
                : 0;
            return (
              <TableRow key={inv.id}>
                <TableCell>
                  <div className="font-black uppercase tracking-tighter italic">
                    {inv.symbol}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    {inv.name}
                  </div>
                </TableCell>
                <TableCell className="font-bold">{inv.quantity}</TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(inv.buyPrice)}
                </TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(inv.currentPrice)}
                </TableCell>
                <TableCell className="font-black italic">
                  {formatCurrency(inv.quantity * inv.currentPrice)}
                </TableCell>
                <TableCell>
                  <div
                    className={`flex items-center font-black text-xs ${
                      gainLoss >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {gainLoss >= 0 ? "+" : ""}
                    {formatCurrency(gainLoss)}
                    <span className="ml-1 text-xs">
                      ({gainLossPercent.toFixed(2)}%)
                    </span>
                  </div>
                </TableCell>
                <TableCell align="right">
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => handleEdit(inv)}
                      className="hover:scale-125 transition-transform"
                      title="Edit Position"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="hover:scale-125 transition-transform text-red-600"
                      title="Delete Position"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {investments.length === 0 && (
            <EmptyTableState message="No active positions in portfolio" />
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvestmentManager;
