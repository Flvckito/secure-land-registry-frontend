export default function FormField({ label, error, children, required, hint, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-gold-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}