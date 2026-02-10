import React from "react";
import { Card } from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import { TrendingUp, Wallet, History } from "lucide-react";
import AccountBalanceChart from "@/components/AccountBalanceChart";
import DateRangeFilter from "@/components/DateRangeFilter";

const CreditCardView = ({
  account,
  history,
  dateRange,
  setDateRange,
  formatCurrency,
  getChartData,
  billInfo,
  transactions,
}) => {
  const getPastBills = () => {
    if (account.type !== "Credit Card" || !account.billingDay) return [];

    const bills = [];
    const now = new Date();

    for (let i = 1; i <= 6; i++) {
      const billDate = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        account.billingDay,
      );
      const cycleStart = new Date(billDate);
      cycleStart.setMonth(cycleStart.getMonth() - 1);
      cycleStart.setDate(cycleStart.getDate() + 1);

      const cycleTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= cycleStart && d <= billDate;
      });

      const amount = cycleTransactions.reduce((sum, t) => {
        if (t.accountId === account.id) return sum + t.amount;
        if (t.destinationAccountId === account.id) return sum - t.amount;
        return sum;
      }, 0);

      if (amount !== 0 || cycleTransactions.length > 0) {
        bills.push({
          id: i,
          date: billDate,
          amount,
          transactionCount: cycleTransactions.length,
        });
      }
    }
    return bills;
  };

  return (
    <div className="space-y-8">
      <Card className="p-8">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
              Total Outstanding
            </p>
            <h2 className="text-5xl font-black tracking-tighter italic text-red-600">
              {formatCurrency(account.balance)}
            </h2>
          </div>
          <div className="text-right">
            <Badge variant="danger">{account.type}</Badge>
          </div>
        </div>
        {account.creditLimit && (
          <div className="mt-6 pt-6 border-t border-black/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Credit Utilization
              </span>
              <span className="text-xs font-bold">
                {((account.balance / account.creditLimit) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (account.balance / account.creditLimit) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-black uppercase tracking-widest">
              <span className="text-zinc-400">
                Available:
                {formatCurrency(account.creditLimit - account.balance)}
              </span>
              <span className="text-zinc-400">
                Limit: {formatCurrency(account.creditLimit)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {billInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="Current Statement" icon={Wallet}>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Unbilled Amount
                </p>
                <h3 className="text-2xl font-black italic">
                  {formatCurrency(billInfo.currentPeriodAmount)}
                </h3>
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase">
                Since {billInfo.cycleStartDate.toLocaleDateString()}
              </p>
            </div>
          </Card>
          <Card title="Last Bill" icon={History}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Statement Amount
                  </p>
                  <h3 className="text-2xl font-black italic">
                    {formatCurrency(billInfo.lastStatementAmount)}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Due Date
                  </p>
                  <p className="text-xs font-bold text-red-600">
                    {billInfo.dueDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase">
                Generated on {billInfo.statementDate.toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>
      )}

      <Card title="Bill History" icon={History}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-4 text-xs font-black uppercase tracking-widest text-zinc-400">
                  Statement Date
                </th>
                <th className="py-4 text-xs font-black uppercase tracking-widest text-zinc-400">
                  Transactions
                </th>
                <th className="py-4 text-xs font-black uppercase tracking-widest text-zinc-400 text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {getPastBills().map((bill) => (
                <tr
                  key={bill.id}
                  className="group hover:bg-zinc-50 transition-all"
                >
                  <td className="py-4 text-xs font-bold uppercase tracking-tighter italic">
                    {bill.date.toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-4 text-xs font-medium text-zinc-500">
                    {bill.transactionCount} items
                  </td>
                  <td className="py-4 text-sm font-black italic text-right">
                    {formatCurrency(bill.amount)}
                  </td>
                </tr>
              ))}
              {getPastBills().length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="py-8 text-center text-xs font-bold text-zinc-400 uppercase italic"
                  >
                    No past bills identified in recent history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Balance History" icon={TrendingUp}>
        <div className="flex justify-end mb-6">
          <DateRangeFilter
            currentRange={dateRange}
            onRangeChange={setDateRange}
          />
        </div>
        <AccountBalanceChart
          data={getChartData()}
          currency={account.currency}
        />
      </Card>
    </div>
  );
};

export default CreditCardView;
