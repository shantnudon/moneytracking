import { Edit2, Trash2 } from "lucide-react";

export function List({ children, className = "" }) {
  return (
    <div className={`divide-y divide-foreground/5 ${className}`}>
      {children}
    </div>
  );
}

export function ListItem({
  title,
  subtitle,
  value,
  icon,
  onEdit,
  onDelete,
  onClick,
  children,
  className = "",
}) {
  const clickableClass = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`py-6 flex items-center justify-between group ${clickableClass} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-6">
        {icon && (
          <div className="w-10 h-10 border border-foreground flex items-center justify-center text-xs font-black group-hover:bg-foreground group-hover:text-background transition-all">
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs font-bold text-foreground/69 uppercase tracking-widest">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8">
        {value && <span className="text-sm font-black">{value}</span>}
        {children}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 hover:bg-muted/10"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 hover:bg-muted/10 text-muted hover:text-foreground"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionHeader({ title, count, action, className = "" }) {
  return (
    <div
      className={`flex items-center justify-between border-b border-foreground pb-2 mb-6 ${className}`}
    >
      <h3 className="font-black uppercase tracking-widest text-sm">{title}</h3>
      <div className="flex items-center gap-4">
        {count !== undefined && (
          <span className="text-xs font-bold text-foreground/69">
            {count} {count === 1 ? "item" : "items"}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}
