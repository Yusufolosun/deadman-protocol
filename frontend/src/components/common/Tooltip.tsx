import type React from 'react'
import './Tooltip.css'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  return (
    <div className="tooltip-wrapper">
      <span className="tooltip-trigger" tabIndex={0}>
        {children}
      </span>
      <div className={`tooltip-content tooltip-${position}`}>
        {content}
      </div>
    </div>
  )
}

export default Tooltip
