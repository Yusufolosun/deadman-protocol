import React from 'react'
import './Badge.css'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: 'sm' | 'md'
    dot?: boolean
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    size = 'md',
    dot = false,
}) => {
    return (
        <span className={`badge badge-${variant} badge-${size}`}>
            {dot && <span className="badge-dot"></span>}
            {children}
        </span>
    )
}

export default Badge
