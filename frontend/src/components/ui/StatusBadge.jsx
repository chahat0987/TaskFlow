export const STATUS_CONFIG = {
  todo: { label: 'To Do', className: 'bg-ink-700 text-ink-300' },
  in_progress: { label: 'In Progress', className: 'bg-sky-500/20 text-sky-400' },
  done: { label: 'Done', className: 'bg-emerald-500/20 text-emerald-400' },
}

export const PRIORITY_CONFIG = {
  low: { label: 'Low', className: 'bg-ink-700 text-ink-400', dot: 'bg-ink-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  high: { label: 'High', className: 'bg-rose-500/20 text-rose-400', dot: 'bg-rose-400' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo
  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return (
    <span className={`badge gap-1.5 ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export function StatusSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="input py-1 text-xs w-auto"
    >
      {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  )
}
