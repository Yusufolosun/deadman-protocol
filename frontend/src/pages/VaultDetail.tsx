import React, { useState, useEffect, useCallback } from 'react'
import './VaultDetail.css'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import Input from '@/components/common/Input'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import AddressDisplay from '@/components/common/AddressDisplay'
import { VaultStatusBadge } from '@/components/vault'
import { Shield, Clock, Users, ArrowLeft, Trash2, Zap, UserPlus, Info, CheckCircle } from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { useAuth } from '@/hooks/useAuth'
import { useStacks } from '@/hooks/useStacks'
import { blocksToTime, formatBlockHeight } from '@/lib/format'
import { isValidStxAddress } from '@/lib/validation'
import type { VaultDisplay } from '@/types'
import { VaultStatusValues as VaultStatus } from '@/types'

const VaultDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { cancelVault, triggerRelease, addCosigner, fetchVaultDisplay } = useVault()
    const { stxAddress } = useAuth()
    const { getCosigner } = useStacks()

    const [loading, setLoading] = useState(true)
    const [vault, setVault] = useState<VaultDisplay | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [cosigners, setCosigners] = useState<string[]>([])
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [newCosigner, setNewCosigner] = useState('')
    const [cosignerError, setCosignerError] = useState('')
    const [showAddCosigner, setShowAddCosigner] = useState(false)

    const loadVault = useCallback(async () => {
        if (!id) return
        try {
            const data = await fetchVaultDisplay(parseInt(id))
            setVault(data)

            // Fetch co-signers
            if (data && data.cosignerCount > 0) {
                const signers: string[] = []
                for (let i = 0; i < data.cosignerCount; i++) {
                    const signer = await getCosigner(data.id, i)
                    if (signer) signers.push(String(signer))
                }
                setCosigners(signers)
            }
        } catch (err) {
            console.error('Failed to fetch vault:', err)
            setError('Failed to load vault data.')
        } finally {
            setLoading(false)
        }
    }, [id, fetchVaultDisplay, getCosigner])

    useEffect(() => {
        loadVault()
    }, [loadVault])

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
                        <VaultStatusBadge status={vault.status} />
                    </div>
                    <div className="header-actions">
                        {isOwner && vault.status === VaultStatus.Active && (
                            <Button variant="danger" size="sm" leftIcon={<Trash2 size={16} />} onClick={() => setShowCancelDialog(true)}>
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
                                    <strong>{formatBlockHeight(vault.targetBlock)}</strong>
                                </div>
                            )}
                            {vault.conditionType === 2 && (
                                <div className="info-row">
                                    <span>Inactivity Threshold</span>
                                    <strong>{vault.inactivityBlocks.toLocaleString()} Blocks (~{blocksToTime(vault.inactivityBlocks)})</strong>
                                </div>
                            )}
                            {vault.conditionType === 3 && (
                                <div className="info-row">
                                    <span>Required Approvals</span>
                                    <strong>{vault.approvalCount} / {vault.requiredThreshold}</strong>
                                </div>
                            )}
                        </div>
                        {vault.status === VaultStatus.Active && (
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
                            <AddressDisplay address={vault.owner} linkToExplorer />
                        </div>
                        <div className="party-item">
                            <span className="label">Beneficiary</span>
                            {vault.beneficiary ? (
                                <AddressDisplay address={vault.beneficiary} linkToExplorer />
                            ) : (
                                <span className="text-secondary">Not set</span>
                            )}
                        </div>
                        <div className="cosigners-section">
                            <div className="cosigners-header">
                                <span className="label">Co-signers ({cosigners.length})</span>
                                {isOwner && vault.status === VaultStatus.Active && (
                                    <Button variant="ghost" size="sm" leftIcon={<UserPlus size={14} />}
                                        onClick={() => setShowAddCosigner(!showAddCosigner)}>
                                        Add
                                    </Button>
                                )}
                            </div>
                            {showAddCosigner && (
                                <div className="add-cosigner-form">
                                    <Input
                                        placeholder="ST... or SP..."
                                        value={newCosigner}
                                        onChange={(e) => { setNewCosigner(e.target.value); setCosignerError(''); }}
                                        error={cosignerError}
                                    />
                                    <Button size="sm" onClick={async () => {
                                        if (!isValidStxAddress(newCosigner)) {
                                            setCosignerError('Invalid Stacks address')
                                            return
                                        }
                                        try {
                                            await addCosigner(parseInt(id!), newCosigner)
                                            setNewCosigner('')
                                            setShowAddCosigner(false)
                                            loadVault()
                                        } catch {
                                            setCosignerError('Failed to add co-signer')
                                        }
                                    }}>
                                        Add Co-signer
                                    </Button>
                                </div>
                            )}
                            <div className="cosigners-list">
                                {cosigners.length > 0 ? cosigners.map((signer, i) => (
                                    <div key={i} className="cosigner-item">
                                        <CheckCircle size={14} className="text-success" />
                                        <AddressDisplay address={signer} />
                                    </div>
                                )) : (
                                    <p className="empty-text">No co-signers added yet.</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="meta-card">
                        <div className="meta-row">
                            <span>Created At</span>
                            <span>Block {formatBlockHeight(vault.createdAt)}</span>
                        </div>
                        <div className="meta-row">
                            <span>Vault ID</span>
                            <span>#{vault.id}</span>
                        </div>
                        <div className="meta-row">
                            <span>Status</span>
                            <VaultStatusBadge status={vault.status} />
                        </div>
                    </Card>
                </section>
            </div>

            <ConfirmDialog
                isOpen={showCancelDialog}
                title="Cancel Vault"
                message={`Are you sure you want to cancel Vault #${vault.id}? This will refund ${vault.amount.toLocaleString()} STX to your wallet. This action cannot be undone.`}
                confirmLabel="Cancel Vault"
                variant="danger"
                isLoading={cancelling}
                onConfirm={async () => {
                    setCancelling(true)
                    try {
                        await cancelVault(parseInt(id!))
                        setShowCancelDialog(false)
                        loadVault()
                    } catch {
                        // Error handled by useVault
                    } finally {
                        setCancelling(false)
                    }
                }}
                onCancel={() => setShowCancelDialog(false)}
            />
        </div>
    )
}

export default VaultDetail
