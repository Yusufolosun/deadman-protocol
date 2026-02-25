import React from 'react'
import Badge from '../common/Badge'

export type VaultStatus = 'active' | 'released' | 'cancelled'

interface VaultStatusBadgeProps {
    released: boolean
}

function getVaultStatus(released: boolean): VaultStatus {
    return released ? 'released' : 'active'
}

const statusLabels: Record<VaultStatus, string> = {
    active: 'Active',
    released: 'Released',
    cancelled: 'Cancelled',
}

const statusVariants: Record<VaultStatus, 'success' | 'warning' | 'error' | 'info'> = {
    active: 'success',
    released: 'info',
    cancelled: 'warning',
}

const VaultStatusBadge: React.FC<VaultStatusBadgeProps> = ({ released }) => {
    const status = getVaultStatus(released)
    return (
        <Badge variant={statusVariants[status]}>
            {statusLabels[status]}
        </Badge>
    )
}

export default VaultStatusBadge
