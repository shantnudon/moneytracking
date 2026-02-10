import { ArrowUp, ArrowDown } from "lucide-react";

export function Table({ children, className = "" }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className={`w-full text-left border-collapse ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead>
      <tr className="border-b-2 border-foreground text-xs] sm:text-xs font-black uppercase tracking-widest text-muted">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  align = "left",
  className = "",
  sortable = false,
  direction = null,
  onClick,
}) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th
      className={`pb-2 sm:pb-4 px-1 sm:px-2 ${alignClasses[align]} ${
        sortable
          ? "cursor-pointer select-none hover:text-foreground transition-colors"
          : ""
      } ${className}`}
      onClick={sortable ? onClick : undefined}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "right"
            ? "justify-end"
            : align === "center"
              ? "justify-center"
              : ""
        }`}
      >
        {children}
        {sortable && (
          <div className="flex flex-col opacity-30">
            {direction === "asc" ? (
              <ArrowUp size={10} className="opacity-100 text-foreground" />
            ) : direction === "desc" ? (
              <ArrowDown size={10} className="opacity-100 text-foreground" />
            ) : (
              <div className="flex flex-col gap-0.5">
                <ArrowUp size={8} />
                <ArrowDown size={8} />
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  );
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-foreground/5">{children}</tbody>;
}

export function TableRow({ children, onClick, className = "" }) {
  const clickableClass = onClick ? "cursor-pointer" : "";

  return (
    <tr
      onClick={onClick}
      className={`group hover:bg-foreground hover:text-background transition-all duration-200 ${clickableClass} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, align = "left", className = "" }) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td
      className={`py-3 sm:py-6 px-1 sm:px-2 text-xs sm:text-sm ${alignClasses[align]} ${className}`}
    >
      {children}
    </td>
  );
}

export function EmptyTableState({ message = "No data available" }) {
  return (
    <tr>
      <td
        colSpan="100%"
        className="py-20 text-center border-b border-foreground/5"
      >
        <p className="text-xs font-black uppercase tracking-widest text-zinc-300 italic">
          {message}
        </p>
      </td>
    </tr>
  );
}
