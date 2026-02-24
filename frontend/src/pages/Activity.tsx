import React, { useState, useEffect } from 'react'
import './Activity.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import { Activity as ActivityIcon, Clock, Zap, ShieldCheck, History } from 'lucide-react'
import { useStacks } from '@/hooks/useStacks'
import { useVault } from '@/hooks/useVault'
import { useAuth } from '@/hooks/useAuth'

const ActivityPage: React.FC = () => {
    const { isConnected, userData } = useAuth()
    const { getLastActive } = useStacks()
    const { pingActivity } = useVault()

    const [loading, setLoading] = useState(true)
    const [lastActive, setLastActive] = useState<number | null>(null)
    const [isPinging, setIsPinging] = useState(false)

    const address = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || ''

    useEffect(() => {
        const fetchActivity = async () => {
            if (isConnected && address) {
                // In a real app, query the activity-tracker mapping
                // const block = await getLastActive(address)
                // setLastActive(block)

                // Mock data
                setTimeout(() => {
                    setLastActive(124560)
                    setLoading(false)
                }, 600)
            }
        }
        fetchActivity()
    }, [isConnected, address])

    const handlePing = async () => {
        setIsPinging(true)
        try {
            await pingActivity()
            // Success modal or toast would go here
        } catch (error) {
            console.error('Ping failed:', error)
        } finally {
            setIsPinging(false)
        }
    }

    if (!isConnected) {
        return (
            <div className="activity-empty animate-fade">
                <ActivityIcon size={64} className="empty-icon" />
                <h2 className="font-heading">Connect Wallet</h2>
                <p className="text-secondary">Please connect your wallet to track your activity status.</p>
            </div>
        )
    }

    return (
        <div className="activity-page animate-slide-up">
            <header className="page-header">
                <h1 className="font-heading">Protocol Activity</h1>
                <p className="text-secondary">Track your on-chain liveness and reset inactivity timers.</p>
            </header>

            <div className="activity-grid">
                <section className="status-section">
                    <Card className="current-status-card glass">
                        <div className="status-header">
                            <div className="status-indicator">
                                <div className="pulse-dot"></div>
                                <span className="status-text">Account Active</span>
                            </div>
                            <Badge variant="success">Secured</Badge>
                        </div>

                        <div className="last-seen-info">
                            <span className="label">Last Active Block</span>
                            {loading ? <Spinner size="sm" /> : <span className="value">#{lastActive || 'Never'}</span>}
                        </div>

                        <Button
                            size="lg"
                            className="ping-button"
                            onClick={handlePing}
                            isLoading={isPinging}
                            leftIcon={<Zap size={20} />}
                            fullWidth
                        >
                            Broadcast Liveness Ping
                        </Button>
                        <p className="ping-helper">Pinging resets the inactivity counter for all your "Inactivity" conditioned vaults.</p>
                    </Card>

                    <Card className="activity-info-card">
                        <h3 className="card-title"><Clock size={18} /> How it works</h3>
                        <p className="text-secondary">
                            The Deadman Protocol monitors the <strong>activity-tracker</strong> contract.
                            By calling the <code>ping</code> function, you update your "last seen" block height.
                            If this height exceeds your vault's threshold, assets become eligible for release.
                        </p>
                    </Card>
                </section>

                <section className="history-section">
                    <div className="section-header">
                        <h3 className="font-heading"><History size={20} /> Recent Activity</h3>
                    </div>
                    <Card className="history-list-card">
                        <div className="history-item">
                            <div className="item-icon success"><ShieldCheck size={16} /></div>
                            <div className="item-details">
                                <span className="item-action">Vault "Main Savings" Created</span>
                                <span className="item-meta">Block #124,500 • Success</span>
                            </div>
                        </div>
                        <div className="history-item">
                            <div className="item-icon info"><Zap size={16} /></div>
                            <div className="item-details">
                                <span className="item-action">Liveness Ping Sent</span>
                                <span className="item-meta">Block #124,480 • Success</span>
                            </div>
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    )
}

export default ActivityPage
