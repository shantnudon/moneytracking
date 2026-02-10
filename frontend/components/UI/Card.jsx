export function Card({
  children,
  className = "",
  hover = false,
  onClick,
  title,
  icon: Icon,
}) {
  const hoverClass = hover
    ? "hover:bg-foreground hover:text-background transition-all duration-300"
    : "";
  const clickableClass = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`p-4 sm:p-6 md:p-8 border border-(--foreground) ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {(title || Icon) && (
        <div className="flex justify-between items-center mb-6">
          {title && (
            <h3 className="text-lg font-black uppercase tracking-tighter italic">
              {title}
            </h3>
          )}
          {Icon && <Icon size={20} className="text-zinc-400" />}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ title, amount, symbol, subtext, icon: Icon }) {
  return (
    <div className="p-4 sm:p-6 md:p-8 border-r border-b border-(--foreground) group hover:bg-foreground transition-all duration-300">
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <p className="text-xs] sm:text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">
          {title}
        </p>
        {Icon && (
          <Icon
            size={14}
            className="text-zinc-400 group-hover:text-zinc-500 sm:w-4 sm:h-4"
          />
        )}
      </div>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tighter group-hover:text-background transition-colors">
        {typeof amount === "number"
          ? `${symbol || ""}${amount.toLocaleString()}`
          : amount}
      </h2>
      {subtext && (
        <p className="text-xs] sm:text-xs font-bold text-zinc-400 mt-2 uppercase">
          {subtext}
        </p>
      )}
    </div>
  );
}

export function GridCard({
  title,
  subtitle,
  children,
  onEdit,
  onDelete,
  className = "",
}) {
  return (
    <div
      className={`p-4 sm:p-6 md:p-8 border-r border-b border-(--foreground) group hover:bg-foreground hover:text-background transition-all duration-300 flex flex-col justify-between min-h-50 sm:min-h-70 ${className}`}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            {subtitle && (
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500">
                {subtitle}
              </p>
            )}
            <h3 className="text-xl font-black uppercase tracking-tighter italic">
              {title}
            </h3>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="hover:scale-110 transition-transform"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="hover:scale-110 transition-transform"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
