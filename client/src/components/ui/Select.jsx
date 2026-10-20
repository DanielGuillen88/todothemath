export default function Select({
  label,
  error,
  id,
  children,
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
        className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-600/80 focus:border-red-500'
            : 'border-slate-800 focus:border-indigo-500'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}