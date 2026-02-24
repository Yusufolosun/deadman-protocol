import React from 'react'
import './Spinner.css'

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    color?: 'primary' | 'white'
    className?: string
}

const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    color = 'primary',
    className = '',
}) => {
    return (
        <div className={`spinner-container ${className}`}>
            <div className={`spinner spinner-${size} spinner-${color}`}></div>
        </div>
    )
}

export default Spinner
