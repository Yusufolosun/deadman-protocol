import type React from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`empty-state animate-fade ${className}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="font-heading">{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export default EmptyState
