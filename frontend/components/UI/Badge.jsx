export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}) {
  const variantClasses = {
    default: "border border-black text-black",
    primary: "bg-black text-white",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-500 text-black",
    danger: "bg-red-600 text-white",
    outline: "border border-zinc-300 text-zinc-600",
  };

  const sizeClasses = {
    xs: "text-xs] px-1.5 py-0.5",
    sm: "text-xs] px-2 py-0.5",
    md: "text-xs px-3 py-1",
  };

  return (
    <span
      className={`font-black uppercase inline-block ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
