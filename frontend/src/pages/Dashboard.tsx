import React, { useState, useEffect, useCallback } from 'react'
import './Dashboard.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import Skeleton from '@/components/common/Skeleton'
import { VaultCard } from '@/components/vault'
import { PlusCircle, Shield, Activity, Lock, Search, Filter, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useVault } from '@/hooks/useVault'
import { CONDITION_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { VaultDisplay } from '@/types'

type FilterStatus = 'all' | '0' | '1' | '2'

const Dashboard: React.FC = () => {
    const navigate = useNavigate()
    const { isConnected, stxAddress } = useAuth()
    const { fetchMyVaults } = useVault()

    const [vaults, setVaults] = useState<VaultDisplay[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

    const loadVaults = useCallback(async (isRefresh = false) => {
        if (!isConnected) return
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        try {
            const data = await fetchMyVaults()
            setVaults(data)
        } catch (err) {
            console.error('Failed to load vaults:', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [isConnected, fetchMyVaults])

    useEffect(() => {
        loadVaults()
    }, [loadVaults])

    if (!isConnected) {
        return (
            <div className="dashboard-empty animate-fade">
                <Lock size={64} className="empty-icon" />
                <h2 className="font-heading">Wallet Not Connected</h2>
                <p className="text-secondary">Please connect your Stacks wallet to view your vaults and dashboard.</p>
                <Button onClick={() => navigate('/')}>Back to Home</Button>
            </div>
        )
    }

    const filteredVaults = vaults.filter((vault) => {
        if (statusFilter !== 'all' && vault.status !== Number(statusFilter)) return false
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const condLabel = (CONDITION_LABELS[vault.conditionType] || '').toLowerCase()
            const statusLabel = (STATUS_LABELS[vault.status] || '').toLowerCase()
            return (
                String(vault.id).includes(query) ||
                condLabel.includes(query) ||
                statusLabel.includes(query) ||
                vault.owner.toLowerCase().includes(query)
            )
        }
        return true
    })

    const activeVaults = vaults.filter((v) => v.status === 0)
    const totalLocked = activeVaults.reduce((sum, v) => sum + v.amount, 0)

    const stats = [
        { label: 'Total Locked', value: `${totalLocked.toLocaleString()} STX`, icon: <Lock size={20} /> },
        { label: 'Active Vaults', value: String(activeVaults.length), icon: <Shield size={20} /> },
        { label: 'Total Vaults', value: String(vaults.length), icon: <Activity size={20} /> },
    ]

    return (
        <div className="dashboard-page animate-slide-up">
            <header className="dashboard-header">
                <div className="header-text">
                    <h1 className="font-heading">Your Dashboard</h1>
                    <p className="text-secondary">
                        Manage your trust delegations and conditional vaults.
                        {stxAddress && <code className="address-mini"> {stxAddress.slice(0, 8)}...</code>}
                    </p>
                </div>
                <div className="header-actions">
                    <Button variant="ghost" size="sm" onClick={() => loadVaults(true)} isLoading={refreshing} leftIcon={<RefreshCw size={16} />}>
                        Refresh
                    </Button>
                    <Button onClick={() => navigate('/vault/create')} leftIcon={<PlusCircle size={20} />}>
                        Create New Vault
                    </Button>
                </div>
            </header>

            {/* Stats Grid */}
            <section className="stats-grid">
                {loading ? (
                    <>
                        <Skeleton variant="card" height="90px" />
                        <Skeleton variant="card" height="90px" />
                        <Skeleton variant="card" height="90px" />
                    </>
                ) : (
                    stats.map((stat, index) => (
                        <Card key={index} className="stat-card">
                            <div className="stat-icon-wrapper">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                            </div>
                        </Card>
                    ))
                )}
            </section>

            {/* Vaults List */}
            <section className="vaults-section">
                <div className="section-header">
                    <h2 className="font-heading">My Vaults</h2>
                    <div className="section-controls">
                        <div className="search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search vaults..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="filter-group">
                            <Filter size={16} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="0">Active</option>
                                <option value="1">Released</option>
                                <option value="2">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="vaults-grid">
                        <Skeleton variant="card" height="180px" />
                        <Skeleton variant="card" height="180px" />
                        <Skeleton variant="card" height="180px" />
                    </div>
                ) : filteredVaults.length > 0 ? (
                    <div className="vaults-grid">
                        {filteredVaults.map((vault) => (
                            <VaultCard
                                key={vault.id}
                                vault={vault}
                                onClick={() => navigate(`/vault/${vault.id}`)}
                            />
                        ))}
                        <Card hoverable className="create-vault-card" onClick={() => navigate('/vault/create')}>
                            <PlusCircle size={32} className="create-icon" />
                            <span className="create-text">Create New Vault</span>
                        </Card>
                    </div>
                ) : vaults.length === 0 ? (
                    <div className="no-vaults animate-fade">
                        <Shield size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                        <h3 className="font-heading">No Vaults Yet</h3>
                        <p className="text-secondary">Create your first conditional vault to get started.</p>
                        <Button onClick={() => navigate('/vault/create')} leftIcon={<PlusCircle size={18} />}>
                            Create Your First Vault
                        </Button>
                    </div>
                ) : (
                    <div className="no-vaults animate-fade">
                        <Search size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                        <h3 className="font-heading">No Results</h3>
                        <p className="text-secondary">No vaults match your search criteria.</p>
                        <Button variant="ghost" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                            Clear Filters
                        </Button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Dashboard
