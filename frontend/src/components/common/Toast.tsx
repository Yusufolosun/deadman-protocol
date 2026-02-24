import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    message: string
    type?: ToastType
    onClose: () => void
    duration?: number
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    onClose,
    duration = 5000,
}) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [onClose, duration])

    const icons = {
        success: <CheckCircle className="toast-icon success" size={20} />,
        error: <AlertCircle className="toast-icon error" size={20} />,
        info: <Info className="toast-icon info" size={20} />,
    }

    return (
        <div className={`toast glass animate-slide-up type-${type}`}>
            {icons[type]}
            <p className="toast-message">{message}</p>
            <button className="toast-close" onClick={onClose}>
                <X size={16} />
            </button>
        </div>
    )
}

export default Toast
