import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import './Modal.css'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg'
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="modal-overlay animate-fade" onClick={onClose}>
            <div
                className={`modal-content glass animate-slide-up size-${size}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    {title && <h3 className="modal-title font-heading">{title}</h3>}
                    <button className="modal-close btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Modal
