export default function EmptyState({
  message = "No data available",
  icon: Icon,
  action,
  className = "",
}) {
  return (
    <div
      className={`py-24 text-center border border-dashed border-foreground/10 ${className}`}
    >
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon size={32} className="text-zinc-200" />
        </div>
      )}
      <p className="text-xs font-black uppercase tracking-widest text-zinc-300 italic mb-4">
        {message}
      </p>
      {action}
    </div>
  );
}
