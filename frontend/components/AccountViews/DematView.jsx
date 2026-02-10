import React from "react";
import { Card } from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import { TrendingUp } from "lucide-react";
import AccountBalanceChart from "@/components/AccountBalanceChart";
import DateRangeFilter from "@/components/DateRangeFilter";
import InvestmentManager from "@/components/InvestmentManager";

const DematView = ({
  account,
  history,
  dateRange,
  setDateRange,
  formatCurrency,
  getChartData,
  investments,
  investmentSummary,
  onRefresh,
}) => {
  return (
    <div className="space-y-8">
      <Card className="p-8">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
              Current Liquidity
            </p>
            <h2 className="text-5xl font-black tracking-tighter italic text-blue-600">
              {formatCurrency(account.balance)}
            </h2>
          </div>
          <div className="text-right">
            <Badge variant="warning">{account.type}</Badge>
          </div>
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

      <Card title="Investment Portfolio" icon={TrendingUp}>
        <InvestmentManager
          accountId={account.id}
          investments={investments}
          summary={investmentSummary}
          onRefresh={onRefresh}
        />
      </Card>
    </div>
  );
};

export default DematView;
