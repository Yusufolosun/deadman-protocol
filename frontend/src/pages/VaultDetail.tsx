import React, { useState, useEffect } from 'react'
import './VaultDetail.css'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import { VaultStatusBadge, ConditionTypeBadge } from '@/components/vault'
import { Shield, Clock, Users, ArrowLeft, Trash2, Zap, UserPlus, Info } from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { useAuth } from '@/hooks/useAuth'
import type { VaultDisplay } from '@/types'

const VaultDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { cancelVault, triggerRelease, fetchVaultDisplay } = useVault()
    const { stxAddress } = useAuth()

    const [loading, setLoading] = useState(true)
    const [vault, setVault] = useState<VaultDisplay | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadVault = async () => {
            if (!id) return
            try {
                const data = await fetchVaultDisplay(parseInt(id))
                setVault(data)
            } catch (err) {
                console.error('Failed to fetch vault:', err)
                setError('Failed to load vault data.')
            } finally {
                setLoading(false)
            }
        }
        loadVault()
    }, [id, fetchVaultDisplay])

    if (loading) return <div className="page-loader"><Spinner size="lg" /></div>

    if (error || !vault) {
        return (
            <div className="vault-detail-page animate-fade" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <Shield size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <h2 className="font-heading">{error || 'Vault not found'}</h2>
                <p className="text-secondary">The vault you are looking for does not exist or could not be loaded.</p>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>
        )
    }

    const isOwner = stxAddress === vault.owner

    return (
        <div className="vault-detail-page animate-slide-up">
            <header className="page-header">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft size={16} />}>
                    Back to Dashboard
                </Button>
                <div className="header-main">
                    <div className="title-group">
                        <h1 className="font-heading">Vault #{vault.id}</h1>
                        <VaultStatusBadge released={vault.released} />
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
                            <span className="value text-gradient">{vault.amount.toLocaleString()} STX</span>
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
                                    <strong>{vault.approvalCount} / {vault.requiredThreshold}</strong>
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
