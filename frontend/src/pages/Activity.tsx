import React, { useState, useEffect, useCallback } from 'react'
import './Activity.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import { Activity as ActivityIcon, Clock, Zap, History } from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { useAuth } from '@/hooks/useAuth'
import { useStacks } from '@/hooks/useStacks'

const ActivityPage: React.FC = () => {
    const { isConnected, stxAddress } = useAuth()
    const { pingActivity } = useVault()
    const { getLastActive } = useStacks()

    const [loading, setLoading] = useState(true)
    const [lastActive, setLastActive] = useState<number | null>(null)
    const [isPinging, setIsPinging] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchActivity = useCallback(async () => {
        if (!isConnected || !stxAddress) return
        try {
            const block = await getLastActive(stxAddress)
            setLastActive(block ? Number(block) : null)
        } catch (err) {
            console.error('Failed to fetch activity:', err)
        } finally {
            setLoading(false)
        }
    }, [isConnected, stxAddress, getLastActive])

    useEffect(() => {
        fetchActivity()
    }, [fetchActivity])

    const handlePing = async () => {
        setIsPinging(true)
        setError(null)
        try {
            await pingActivity()
            // Refresh last-active after ping
            await fetchActivity()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ping failed'
            setError(message)
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
                        {error && <p className="text-error" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
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
                        <p className="text-secondary" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            Transaction history requires an event indexer. Coming soon.
                        </p>
                    </Card>
                </section>
            </div>
        </div>
    )
}

export default ActivityPage
