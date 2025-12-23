interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled'
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'
  
  const statusConfig = {
    pending: {
      bg: 'bg-primary/10 dark:bg-primary/20',
      text: 'text-primary dark:text-primary-300',
      label: 'Pending'
    },
    completed: {
      bg: 'bg-primary-accent/10 dark:bg-primary-accent/20',
      text: 'text-primary-accent dark:text-primary-accent-300',
      label: 'Completed'
    },
    cancelled: {
      bg: 'bg-gray-200 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      label: 'Cancelled'
    },
    rescheduled: {
      bg: 'bg-warning/10 dark:bg-warning/20',
      text: 'text-yellow-700 dark:text-yellow-300',
      label: 'Rescheduled'
    }
  }
  
  const config = statusConfig[status]
  
  return (
    <span className={`${sizeClasses} ${config.bg} ${config.text} font-medium rounded-full inline-flex items-center gap-1`}>
      {status === 'completed' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {status === 'cancelled' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
      {status === 'rescheduled' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      )}
      {config.label}
    </span>
  )
}
