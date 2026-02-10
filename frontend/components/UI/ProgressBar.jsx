export default function ProgressBar({
  label,
  current,
  total,
  showValues = true,
  formatValue,
  className = "",
}) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const displayCurrent = formatValue ? formatValue(current) : current;
  const displayTotal = formatValue ? formatValue(total) : total;

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showValues) && (
        <div className="flex justify-between text-xs font-black uppercase">
          {label && <span>{label}</span>}
          {showValues && (
            <div className="flex gap-2">
              <span className="text-zinc-400">{displayCurrent} /</span>
              <span>{displayTotal}</span>
            </div>
          )}
        </div>
      )}
      <div className="h-0.5 w-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full bg-foreground transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function SimpleProgressBar({ percentage, className = "" }) {
  const safePercentage = Math.min(Math.max(percentage || 0, 0), 100);

  return (
    <div className={`h-0.5 w-full bg-zinc-100 dark:bg-zinc-800 ${className}`}>
      <div
        className="h-full bg-foreground transition-all duration-1000"
        style={{ width: `${safePercentage}%` }}
      />
    </div>
  );
}
