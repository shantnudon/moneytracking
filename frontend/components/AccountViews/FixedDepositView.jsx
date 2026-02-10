import React from "react";
import { Card } from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import { TrendingUp, Calendar, Percent, Clock, Landmark } from "lucide-react";
import AccountBalanceChart from "@/components/AccountBalanceChart";
import DateRangeFilter from "@/components/DateRangeFilter";

const FixedDepositView = ({
  account,
  history,
  dateRange,
  setDateRange,
  formatCurrency,
  getChartData,
}) => {
  const p = parseFloat(account.principal || 0);
  const r = parseFloat(account.interestRate || 0);
  const t = parseInt(account.tenure || 0);
  const maturityAmount = p * (1 + (r / 100) * (t / 12));

  return (
    <div className="space-y-8">
      <Card className="p-8">
        <div className="flex justify-between items-start">
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-1">
                Principal Amount
              </p>
              <h2 className="text-5xl font-black tracking-tighter italic text-foreground">
                {formatCurrency(account.balance)}
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-4 border-t border-foreground/5">
              <div>
                <div className="flex items-center gap-2 text-foreground/69 mb-1">
                  <Percent size={12} className="font-black" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Rate
                  </span>
                </div>
                <p className="text-sm font-black italic">
                  {account.interestRate}% P.A.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-foreground/69 mb-1">
                  <Clock size={12} />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Tenure
                  </span>
                </div>
                <p className="text-sm font-black italic">
                  {account.tenure} Months
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-foreground/69 mb-1">
                  <Calendar size={12} />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Opened
                  </span>
                </div>
                <p className="text-sm font-black italic">
                  {account.startDate
                    ? new Date(account.startDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-foreground/69 mb-1">
                  <Landmark size={12} />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Maturity
                  </span>
                </div>
                <p className="text-sm font-black italic">
                  {account.maturityDate
                    ? new Date(account.maturityDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-4">
            <Badge variant="warning">FIXED DEPOSIT</Badge>
            <div className="bg-foreground p-4 border border-foreground/5 text-right">
              <p className="text-xs font-black uppercase tracking-widest text-foreground/69 mb-1">
                Est. Maturity Value
              </p>
              <p className="text-xl font-black italic text-green-600">
                {formatCurrency(maturityAmount)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Growth Trajectory" icon={TrendingUp}>
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

export default FixedDepositView;
