export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }

  const initials = user
    ? (user.full_name || user.username || user.email || '?')
        .split(' ')
        .map(s => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const colors = [
    'bg-amber-500/20 text-amber-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-sky-500/20 text-sky-400',
    'bg-rose-500/20 text-rose-400',
    'bg-purple-500/20 text-purple-400',
  ]

  const colorIndex = user
    ? (user.id || user.email?.charCodeAt(0) || 0) % colors.length
    : 0

  return (
    <div
      className={`
        ${sizes[size]} ${colors[colorIndex]}
        rounded-full flex items-center justify-center font-medium shrink-0
        ${className}
      `}
    >
      {initials}
    </div>
  )
}
