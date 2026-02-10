export default function PageLayout({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  actions = [],
  children,
}) {
  return (
    <div className="min-h-full bg-background p-4 sm:p-6 md:p-8 lg:p-12 text-foreground font-sans animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 pb-4 border-b border-foreground">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted font-medium mt-2 text-sm">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 md:mt-0">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs font-black uppercase transition-all ${
                action.variant === "secondary"
                  ? "bg-background border border-foreground text-foreground hover:bg-muted/10"
                  : "bg-foreground text-background hover:bg-muted"
              }`}
            >
              {action.icon && <action.icon size={16} />}
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">
                {action.shortLabel || action.label}
              </span>
            </button>
          ))}
          {actionLabel && onAction && (
            <button
              id="page-action-button"
              onClick={onAction}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-foreground text-background text-xs font-black uppercase hover:bg-muted transition-all"
            >
              {ActionIcon && <ActionIcon size={16} />}
              <span className="hidden sm:inline">{actionLabel}</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
