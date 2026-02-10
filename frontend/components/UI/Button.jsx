export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  disabled = false,
  className = "",
}) {
  const baseClasses =
    "flex items-center justify-center gap-2 font-black uppercase transition-all";

  const variantClasses = {
    primary: "bg-foreground text-background hover:opacity-90",
    secondary:
      "border border-foreground text-foreground hover:bg-foreground hover:text-background",
    outline: "border border-foreground/10 hover:border-foreground",
    ghost: "hover:bg-muted/10",
    danger: "bg-red-600 text-background hover:bg-red-700",
  };

  const sizeClasses = {
    sm: "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-xs",
    md: "px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-xs",
    lg: "px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  onClick,
  title,
  variant = "ghost",
  size = 16,
  className = "",
}) {
  const variantClasses = {
    ghost: "p-2 hover:bg-muted/10 transition-all text-foreground",
    border:
      "p-2 border border-foreground hover:bg-foreground hover:text-background transition-all",
    danger: "p-2 hover:bg-red-600/10 text-red-500 transition-all",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${variantClasses[variant]} ${className}`}
    >
      <Icon size={size} />
    </button>
  );
}
