import React, { useState, useEffect } from 'react'
import './Approvals.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import { Users, CheckCircle, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useVault } from '@/hooks/useVault'
import type { PendingApproval } from '@/types'

const Approvals: React.FC = () => {
    const { isConnected } = useAuth()
    const { submitApproval } = useVault()

    const [loading, setLoading] = useState(true)
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isConnected) {
            // Discovering vaults where the user is a co-signer requires an
            // event indexer or off-chain registry. Until that infrastructure
            // exists, we display an empty state. When vault IDs are known,
            // use useStacks().getApprovalCount / hasApproved per vault.
            setLoading(false)
        }
    }, [isConnected])

    const handleApprove = async (vaultId: number) => {
        try {
            await submitApproval(vaultId)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Approval failed'
            setError(message)
        }
    }

    if (!isConnected) {
        return (
            <div className="approvals-empty animate-fade">
                <Users size={64} className="empty-icon" />
                <h2 className="font-heading">Connect Wallet</h2>
                <p className="text-secondary">Connect your wallet to see vaults requiring your signature.</p>
            </div>
        )
    }

    return (
        <div className="approvals-page animate-slide-up">
            <header className="page-header">
                <h1 className="font-heading">Co-signer Approvals</h1>
                <p className="text-secondary">Approve activation conditions for vaults you co-sign.</p>
            </header>

            {loading ? (
                <div className="page-loader"><Spinner size="lg" /></div>
            ) : pendingApprovals.length > 0 ? (
                <div className="approvals-grid">
                    {pendingApprovals.map((approval) => (
                        <Card key={approval.vaultId} className="approval-card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">Vault #{approval.vaultId}</h3>
                                    <span className="owner-label">Owned by {approval.vaultOwner}</span>
                                </div>
                                <Badge variant="warning">{approval.currentApprovals} / {approval.requiredApprovals} Signed</Badge>
                            </div>

                            <div className="vault-preview">
                                <div className="preview-item">
                                    <span className="label">Total Amount</span>
                                    <span className="value">{approval.amount.toLocaleString()} STX</span>
                                </div>
                                <div className="preview-item">
                                    <span className="label">Condition</span>
                                    <span className="value">{approval.condition}</span>
                                </div>
                            </div>

                            {error && (
                                <p className="text-error" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</p>
                            )}

                            <div className="card-actions">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    leftIcon={<CheckCircle size={18} />}
                                    onClick={() => handleApprove(approval.vaultId)}
                                >
                                    Submit My Approval
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="no-pending animate-fade">
                    <Shield size={48} className="shield-icon" />
                    <h3>No Pending Approvals</h3>
                    <p className="text-secondary">You are all caught up! There are no vaults currently requiring your signature.</p>
                </div>
            )}
        </div>
    )
}

export default Approvals
