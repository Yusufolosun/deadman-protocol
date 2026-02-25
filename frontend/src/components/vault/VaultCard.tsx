import React from 'react'
import Card from '../common/Card'
import { VaultStatusBadge } from '.'
import { ConditionTypeBadge } from '.'
import { ArrowUpRight } from 'lucide-react'
import type { VaultDisplay } from '@/types'
import './VaultCard.css'

interface VaultCardProps {
    vault: VaultDisplay
    onClick?: () => void
}

const VaultCard: React.FC<VaultCardProps> = ({ vault, onClick }) => {
    const formatConditionTarget = (v: VaultDisplay): string => {
        switch (v.conditionType) {
            case 1:
                return `Block #${v.targetBlock.toLocaleString()}`
            case 2:
                return `${v.inactivityBlocks.toLocaleString()} blocks`
            case 3:
                return `${v.requiredThreshold} of ${v.cosignerCount} signers`
            default:
                return 'Unknown'
        }
    }

    return (
        <Card hoverable onClick={onClick}>
            <div className="vault-card-header">
                <h3 className="vault-card-title">Vault #{vault.id}</h3>
                <VaultStatusBadge released={vault.released} />
            </div>
            <div className="vault-card-details">
                <div className="vault-card-detail">
                    <span className="vault-card-label">Amount</span>
                    <span className="vault-card-value">{vault.amount.toLocaleString()} STX</span>
                </div>
                <div className="vault-card-detail">
                    <span className="vault-card-label">Type</span>
                    <ConditionTypeBadge conditionType={vault.conditionType} />
                </div>
                <div className="vault-card-detail">
                    <span className="vault-card-label">Condition</span>
                    <span className="vault-card-value">{formatConditionTarget(vault)}</span>
                </div>
            </div>
            {onClick && (
                <div className="vault-card-footer">
                    <span className="vault-card-link">View Details <ArrowUpRight size={14} /></span>
                </div>
            )}
        </Card>
    )
}

export default VaultCard
