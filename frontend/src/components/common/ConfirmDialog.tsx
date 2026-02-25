import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'warning' | 'danger'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-dialog-icon ${variant}`}>
          <AlertTriangle size={32} />
        </div>
        <h3 className="font-heading">{title}</h3>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
