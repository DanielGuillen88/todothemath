export default function Select({
  label,
  error,
  id,
  children,
  options = [],
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        id={id}
        disabled={disabled}
        className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-600/80 focus:border-red-500'
            : 'border-slate-800 focus:border-indigo-500'
        } ${className}`}
        {...props}
      >
        {/* Si le pasas children los pinta; si le pasas options, los mapea automáticamente */}
        {children
          ? children
          : options.map((opt) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={val} value={val} className="bg-slate-900 text-white">
                  {lbl}
                </option>
              );
            })}
      </select>
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}