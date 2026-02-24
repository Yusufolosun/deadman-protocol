import React, { useState, useEffect } from 'react'
import './VaultDetail.css'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import { Shield, Clock, Users, ArrowLeft, Trash2, Zap, UserPlus, Info } from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { useAuth } from '@/hooks/useAuth'

const VaultDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { cancelVault, triggerRelease } = useVault()
    const { userData } = useAuth()

    const [loading, setLoading] = useState(true)
    const [vault, setVault] = useState<any>(null)

    useEffect(() => {
        const fetchVault = async () => {
            if (id) {
                // In a real app, we'd call the real contract
                // const data = await getVault(parseInt(id))
                // setVault(data)

                // Mocking for now
                setTimeout(() => {
                    setVault({
                        id,
                        name: 'Inheritance Vault',
                        amount: 750,
                        conditionType: 2,
                        targetBlock: 0,
                        inactivityBlocks: 2000,
                        requiredThreshold: 2,
                        released: false,
                        createdAt: 124500,
                        owner: userData?.profile?.stxAddress?.testnet || 'ST...',
                        beneficiary: 'SP3FG...JK21',
                        approvals: 1
                    })
                    setLoading(false)
                }, 800)
            }
        }
        fetchVault()
    }, [id, userData])

    if (loading) return <div className="page-loader"><Spinner size="lg" /></div>
    if (!vault) return <div>Vault not found</div>

    const isOwner = userData?.profile?.stxAddress?.testnet === vault.owner || userData?.profile?.stxAddress?.mainnet === vault.owner

    return (
        <div className="vault-detail-page animate-slide-up">
            <header className="page-header">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft size={16} />}>
                    Back to Dashboard
                </Button>
                <div className="header-main">
                    <div className="title-group">
                        <h1 className="font-heading">{vault.name}</h1>
                        <Badge variant={vault.released ? 'neutral' : 'success'}>
                            {vault.released ? 'Released' : 'Active'}
                        </Badge>
                    </div>
                    <div className="header-actions">
                        {isOwner && !vault.released && (
                            <Button variant="danger" size="sm" leftIcon={<Trash2 size={16} />} onClick={() => cancelVault(parseInt(id!))}>
                                Cancel Vault
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="detail-grid">
                <section className="detail-main">
                    <Card className="amount-card glass">
                        <div className="amount-info">
                            <span className="label">Total Value Locked</span>
                            <span className="value text-gradient">{vault.amount} STX</span>
                        </div>
                        <Zap className="decoration-icon" size={80} />
                    </Card>

                    <Card className="condition-card">
                        <div className="card-header">
                            <h3 className="card-title">Activation Condition</h3>
                            <div className="condition-icon">
                                {vault.conditionType === 1 ? <Shield /> : vault.conditionType === 2 ? <Clock /> : <Users />}
                            </div>
                        </div>
                        <div className="condition-info">
                            {vault.conditionType === 1 && (
                                <div className="info-row">
                                    <span>Target Block</span>
                                    <strong>#{vault.targetBlock}</strong>
                                </div>
                            )}
                            {vault.conditionType === 2 && (
                                <div className="info-row">
                                    <span>Inactivity Threshold</span>
                                    <strong>{vault.inactivityBlocks} Blocks (~2 weeks)</strong>
                                </div>
                            )}
                            {vault.conditionType === 3 && (
                                <div className="info-row">
                                    <span>Required Approvals</span>
                                    <strong>{vault.approvals} / {vault.requiredThreshold}</strong>
                                </div>
                            )}
                        </div>
                        {!vault.released && (
                            <div className="condition-action">
                                <Button variant="outline" fullWidth onClick={() => triggerRelease(parseInt(id!))}>
                                    Attempt Manual Release
                                </Button>
                                <p className="helper-text"><Info size={12} /> Only works if conditions are met.</p>
                            </div>
                        )}
                    </Card>
                </section>

                <section className="detail-sidebar">
                    <Card className="parties-card">
                        <h3 className="card-title">Participants</h3>
                        <div className="party-item">
                            <span className="label">Owner</span>
                            <code className="address">{vault.owner}</code>
                        </div>
                        <div className="party-item">
                            <span className="label">Beneficiary</span>
                            <code className="address">{vault.beneficiary}</code>
                        </div>
                        <div className="cosigners-section">
                            <div className="section-header">
                                <span className="label">Co-signers</span>
                                {isOwner && <Button variant="ghost" size="sm" leftIcon={<UserPlus size={14} />}></Button>}
                            </div>
                            <div className="cosigners-list">
                                <p className="empty-text">No co-signers added yet.</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="meta-card">
                        <div className="meta-row">
                            <span>Created At</span>
                            <span>Block #{vault.createdAt}</span>
                        </div>
                        <div className="meta-row">
                            <span>Vault ID</span>
                            <span>#{vault.id}</span>
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    )
}

export default VaultDetail
