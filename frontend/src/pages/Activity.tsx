import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import './Activity.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import { Activity as ActivityIcon, Clock, Zap, History, RefreshCw, AlertTriangle } from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { useAuth } from '@/hooks/useAuth'
import { useStacks } from '@/hooks/useStacks'
import { useBlockHeight } from '@/hooks/useBlockHeight'
import { formatBlockHeight, blocksToTime } from '@/lib/format'

const ActivityPage: React.FC = () => {
    const { isConnected, stxAddress } = useAuth()
    const { pingActivity } = useVault()
    const { getLastActive } = useStacks()
    const { blockHeight } = useBlockHeight()

    const [loading, setLoading] = useState(true)
    const [lastActive, setLastActive] = useState<number | null>(null)
    const [isPinging, setIsPinging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastPingTime, setLastPingTime] = useState<Date | null>(null)

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
            setLastPingTime(new Date())
            // Refresh last-active after ping
            await fetchActivity()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ping failed'
            setError(message)
        } finally {
            setIsPinging(false)
        }
    }

    const blocksSinceActive = lastActive && blockHeight ? blockHeight - lastActive : null
    const isStale = blocksSinceActive !== null && blocksSinceActive > 2016 // ~2 weeks

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
                <div>
                    <h1 className="font-heading">Protocol Activity</h1>
                    <p className="text-secondary">Track your on-chain liveness and reset inactivity timers.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchActivity} leftIcon={<RefreshCw size={16} />}>
                    Refresh
                </Button>
            </header>

            <div className="activity-grid">
                <section className="status-section">
                    <Card className="current-status-card glass">
                        <div className="status-header">
                            <div className="status-indicator">
                                <div className={`pulse-dot ${isStale ? 'stale' : ''}`}></div>
                                <span className="status-text">{isStale ? 'Activity Stale' : 'Account Active'}</span>
                            </div>
                            <Badge variant={isStale ? 'warning' : 'success'}>{isStale ? 'At Risk' : 'Secured'}</Badge>
                        </div>

                        <div className="last-seen-info">
                            <span className="label">Last Active Block</span>
                            {loading ? <Spinner size="sm" /> : <span className="value">{lastActive ? formatBlockHeight(lastActive) : 'Never'}</span>}
                        </div>

                        {blocksSinceActive !== null && (
                            <div className="blocks-ago">
                                <span className="label">Time Since Last Ping</span>
                                <span className={`value ${isStale ? 'text-warning' : ''}`}>
                                    {blocksSinceActive.toLocaleString()} blocks ({blocksToTime(blocksSinceActive)})
                                </span>
                            </div>
                        )}

                        {blockHeight && (
                            <div className="current-block">
                                <span className="label">Current Block Height</span>
                                <span className="value-sm">{formatBlockHeight(blockHeight)}</span>
                            </div>
                        )}

                        {isStale && (
                            <div className="stale-warning">
                                <AlertTriangle size={16} />
                                <span>Your inactivity vaults may become eligible for release. Ping now to reset.</span>
                            </div>
                        )}

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
                        {lastPingTime && (
                            <p className="ping-success">Last ping submitted at {lastPingTime.toLocaleTimeString()}</p>
                        )}
                        {error && <p className="text-error" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
                    </Card>

                    <Card className="activity-info-card">
                        <h3 className="card-title"><Clock size={18} /> How it works</h3>
                        <p className="text-secondary">
                            The Deadman Protocol monitors the <strong>activity-tracker</strong> contract.
                            By calling the <code>ping</code> function, you update your "last seen" block height.
                            If this height exceeds your vault's threshold, assets become eligible for release.
                        </p>
                        <ul className="info-list">
                            <li>One Stacks block ≈ 10 minutes</li>
                            <li>144 blocks ≈ 1 day</li>
                            <li>1,008 blocks ≈ 1 week</li>
                            <li>2,016 blocks ≈ 2 weeks</li>
                        </ul>
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
