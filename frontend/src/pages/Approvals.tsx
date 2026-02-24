import React, { useState, useEffect } from 'react'
import './Approvals.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import { Users, CheckCircle, Shield, ArrowUpRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useVault } from '@/hooks/useVault'

const Approvals: React.FC = () => {
    const { isConnected, userData } = useAuth()
    const { submitApproval } = useVault()

    const [loading, setLoading] = useState(true)
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([])

    useEffect(() => {
        if (isConnected) {
            // Mock data: Vaults where user is a co-signer and release is possible
            setTimeout(() => {
                setPendingApprovals([
                    {
                        id: 3,
                        name: "Team Treasury",
                        amount: 5000,
                        owner: "SP123...456",
                        condition: "Threshold (3 of 5)",
                        currentApprovals: 2,
                        requiredApprovals: 3
                    }
                ])
                setLoading(false)
            }, 700)
        }
    }, [isConnected])

    const handleApprove = async (vaultId: number) => {
        try {
            await submitApproval(vaultId)
            // Success toast would go here
        } catch (error) {
            console.error('Approval failed:', error)
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
                    {pendingApprovals.map((vault) => (
                        <Card key={vault.id} className="approval-card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{vault.name}</h3>
                                    <span className="owner-label">Owned by {vault.owner}</span>
                                </div>
                                <Badge variant="warning">{vault.currentApprovals} / {vault.requiredApprovals} Signed</Badge>
                            </div>

                            <div className="vault-preview">
                                <div className="preview-item">
                                    <span className="label">Total Amount</span>
                                    <span className="value">{vault.amount} STX</span>
                                </div>
                                <div className="preview-item">
                                    <span className="label">Condition</span>
                                    <span className="value">{vault.condition}</span>
                                </div>
                            </div>

                            <div className="card-actions">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    leftIcon={<CheckCircle size={18} />}
                                    onClick={() => handleApprove(vault.id)}
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
