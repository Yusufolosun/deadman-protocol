import React from 'react'
import Badge from '../common/Badge'
import { VaultStatusValues as VaultStatus } from '@/types'

type VaultStatusLabel = 'active' | 'released' | 'cancelled'

interface VaultStatusBadgeProps {
    status: number
}

function getVaultStatusLabel(status: number): VaultStatusLabel {
    switch (status) {
        case VaultStatus.Released:
            return 'released'
        case VaultStatus.Cancelled:
            return 'cancelled'
        default:
            return 'active'
    }
}

const statusLabels: Record<VaultStatusLabel, string> = {
    active: 'Active',
    released: 'Released',
    cancelled: 'Cancelled',
}

const statusVariants: Record<VaultStatusLabel, 'success' | 'warning' | 'error' | 'info'> = {
    active: 'success',
    released: 'info',
    cancelled: 'warning',
}

const VaultStatusBadge: React.FC<VaultStatusBadgeProps> = ({ status }) => {
    const label = getVaultStatusLabel(status)
    return (
        <Badge variant={statusVariants[label]}>
            {statusLabels[label]}
        </Badge>
    )
}

export default VaultStatusBadge
