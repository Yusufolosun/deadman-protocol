import React from 'react'
import './Card.css'

interface CardProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    hoverable?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    style?: React.CSSProperties
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    hoverable = false,
    padding = 'md',
    style,
}) => {
    return (
        <div
            className={`card glass ${hoverable ? 'hoverable' : ''} ${onClick ? 'clickable' : ''} padding-${padding} ${className}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    )
}

export default Card
