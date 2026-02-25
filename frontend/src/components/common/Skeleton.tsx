import type React from 'react'
import './Skeleton.css'

interface SkeletonProps {
  variant?: 'text' | 'heading' | 'card' | 'avatar' | 'button'
  width?: string
  height?: string
  className?: string
  count?: number
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton skeleton-${variant} ${className}`}
      style={{ width, height }}
    />
  ))

  return <>{elements}</>
}

export default Skeleton
