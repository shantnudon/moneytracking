import { Search, Filter, X } from "lucide-react";

export default function FilterBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  dateRange,
  onDateRangeChange,
  onFilter,
  onClearFilter,
  tabs = [],
  activeTab,
  onTabChange,
  showDateRange = true,
  showSearch = true,
  className = "",
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 border border-foreground mb-4 ${className}`}
    >
      {showSearch && (
        <div
          className={`${
            showDateRange ? "lg:col-span-4" : "lg:col-span-6"
          } border-r border-foreground p-4 flex items-center gap-3`}
        >
          <Search size={16} className="text-foreground/69" />
          <input
            type="text"
            placeholder="SEARCH..."
            className="bg-transparent text-xs font-black uppercase outline-none w-full placeholder-zinc-300"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}

      {showDateRange && (
        <div
          className={`${
            showSearch ? "lg:col-span-5" : "lg:col-span-6"
          } border-r border-foreground p-4 flex items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange?.startDate || ""}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, startDate: e.target.value })
              }
              className="text-xs font-black uppercase outline-none bg-transparent"
            />
            <span className="text-zinc-300">—</span>
            <input
              type="date"
              value={dateRange?.endDate || ""}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, endDate: e.target.value })
              }
              className="text-xs font-black uppercase outline-none bg-transparent"
            />
          </div>
          <div className="flex gap-2">
            {onFilter && (
              <button onClick={onFilter} className="p-1 hover:bg-muted100">
                <Filter size={14} />
              </button>
            )}
            {onClearFilter && (dateRange?.startDate || searchQuery) && (
              <button onClick={onClearFilter} className="p-1 hover:bg-muted100">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {tabs.length > 0 && (
        <div className="lg:col-span-3 flex divide-x divide-black">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex-1 text-xs font-black uppercase tracking-tighter transition-all ${
                activeTab === tab.value
                  ? "bg-foreground text-background"
                  : "hover:bg-muted50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
