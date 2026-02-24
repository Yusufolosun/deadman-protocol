import React from 'react'
import './Card.css'

interface CardProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    hoverable?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    hoverable = false,
    padding = 'md',
}) => {
    return (
        <div
            className={`card glass ${hoverable ? 'hoverable' : ''} ${onClick ? 'clickable' : ''} padding-${padding} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

export default Card
