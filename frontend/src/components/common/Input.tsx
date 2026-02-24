import React from 'react'
import './Input.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helpText?: string
    leftIcon?: React.ReactNode
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    helpText,
    leftIcon,
    className = '',
    ...props
}) => {
    return (
        <div className={`input-group ${error ? 'has-error' : ''} ${className}`}>
            {label && <label className="input-label">{label}</label>}

            <div className={`input-wrapper ${leftIcon ? 'has-icon' : ''}`}>
                {leftIcon && <span className="input-icon">{leftIcon}</span>}
                <input
                    className="input-field"
                    {...props}
                />
            </div>

            {error && <p className="input-error">{error}</p>}
            {!error && helpText && <p className="input-help">{helpText}</p>}
        </div>
    )
}

export default Input
