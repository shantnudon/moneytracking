export function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  step,
  className = "",
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs] sm:text-xs font-black uppercase text-zinc-400">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        className="w-full border-b border-foreground/20 py-2 text-xs sm:text-sm font-bold focus:border-foreground outline-none transition-all uppercase placeholder-muted/30 bg-transparent text-foreground"
      />
    </div>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = "SELECT",
  className = "",
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs] sm:text-xs font-black uppercase text-zinc-400">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border-b border-foreground/20 py-2 text-xs sm:text-xs font-bold focus:border-foreground outline-none bg-transparent appearance-none text-foreground"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormDateInput({
  label,
  value,
  onChange,
  required = false,
  min,
  max,
  className = "",
  disabled = false,
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-black uppercase text-zinc-400">
          {label}
        </label>
      )}
      <input
        type="date"
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        className="w-full border-b border-foreground/20 py-2 text-xs font-bold focus:border-foreground outline-none transition-all disabled:opacity-50 bg-transparent text-foreground"
      />
    </div>
  );
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 1,
  className = "",
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-black uppercase text-zinc-400">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full border-b border-foreground/20 py-2 text-sm font-bold focus:border-foreground outline-none transition-all resize-none bg-transparent text-foreground"
      />
    </div>
  );
}

export function FormFileInput({
  label,
  onChange,
  accept = "image/*,application/pdf",
  required = false,
  className = "",
  fileName = null,
  disabled = false,
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-black uppercase text-zinc-400">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="file"
          onChange={onChange}
          accept={accept}
          required={required}
          disabled={disabled}
          className="w-full border-b border-foreground/20 py-2 text-xs font-bold focus:border-foreground outline-none transition-all file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-foreground file:text-background hover:file:bg-muted file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-foreground"
        />
        {fileName && (
          <div className="mt-1 text-xs text-zinc-500 font-medium">
            Selected: {fileName}
          </div>
        )}
      </div>
    </div>
  );
}
export function FormCheckbox({ label, checked, onChange, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 border-2 border-foreground rounded-none checked:bg-foreground appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-background checked:after:text-xs checked:after:top-px checked:after:left-0.5 bg-transparent"
      />
      {label && (
        <label className="text-xs font-black uppercase text-zinc-400 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
}
