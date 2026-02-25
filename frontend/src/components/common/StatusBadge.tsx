import type React from 'react'
import Badge from './Badge'
import { STATUS_LABELS } from '@/lib/constants'

interface StatusBadgeProps {
  status: number
}

const STATUS_VARIANT: Record<number, 'success' | 'warning' | 'error' | 'neutral'> = {
  0: 'success',   // Active
  1: 'neutral',   // Released
  2: 'error',     // Cancelled
}

/**
 * Renders a Badge with the correct variant and label for a vault status code.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const label = STATUS_LABELS[status] || `Status ${status}`
  const variant = STATUS_VARIANT[status] || 'neutral'

  return <Badge variant={variant}>{label}</Badge>
}

export default StatusBadge
