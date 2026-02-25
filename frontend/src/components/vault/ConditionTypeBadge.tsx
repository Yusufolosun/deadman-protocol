import React from 'react'
import Badge from '../common/Badge'

const conditionLabels: Record<number, string> = {
    1: 'Block Height',
    2: 'Inactivity',
    3: 'Threshold',
}

const conditionVariants: Record<number, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    1: 'info',
    2: 'warning',
    3: 'neutral',
}

interface ConditionTypeBadgeProps {
    conditionType: number
}

const ConditionTypeBadge: React.FC<ConditionTypeBadgeProps> = ({ conditionType }) => {
    const label = conditionLabels[conditionType] || 'Unknown'
    const variant = conditionVariants[conditionType] || 'neutral'
    return (
        <Badge variant={variant}>
            {label}
        </Badge>
    )
}

export default ConditionTypeBadge
