import React from 'react'
import './Dashboard.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import { PlusCircle, Shield, Activity, Lock, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const Dashboard: React.FC = () => {
    const navigate = useNavigate()
    const { isConnected, userData } = useAuth()

    // Mock data for initial layout
    const stats = [
        { label: 'Total Locked', value: '1,250 STX', icon: <Lock size={20} /> },
        { label: 'Active Vaults', value: '3', icon: <Shield size={20} /> },
        { label: 'Pending Approvals', value: '1', icon: <Activity size={20} /> },
    ]

    const mockVaults = [
        { id: 1, name: 'Main Savings', amount: 500, type: 'Block Height', status: 'Active', target: 'Block #144,200' },
        { id: 2, name: 'Inheritance Vault', amount: 750, type: 'Inactivity', status: 'Active', target: '2,000 Blocks' },
    ]

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

    return (
        <div className="dashboard-page animate-slide-up">
            <header className="dashboard-header">
                <div className="header-text">
                    <h1 className="font-heading">Your Dashboard</h1>
                    <p className="text-secondary">Manage your trust delegations and conditional vaults.</p>
                </div>
                <Button onClick={() => navigate('/vault/create')} leftIcon={<PlusCircle size={20} />}>
                    Create New Vault
                </Button>
            </header>

            {/* Stats Grid */}
            <section className="stats-grid">
                {stats.map((stat, index) => (
                    <Card key={index} className="stat-card">
                        <div className="stat-icon-wrapper">
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-value">{stat.value}</span>
                        </div>
                    </Card>
                ))}
            </section>

            {/* Vaults List */}
            <section className="vaults-section">
                <div className="section-header">
                    <h2 className="font-heading">My Vaults</h2>
                    <Button variant="ghost" size="sm">View All</Button>
                </div>

                <div className="vaults-grid">
                    {mockVaults.map((vault) => (
                        <Card key={vault.id} hoverable className="vault-card" onClick={() => navigate(`/vault/${vault.id}`)}>
                            <div className="card-header">
                                <h3 className="card-title">{vault.name}</h3>
                                <Badge variant="success" dot>{vault.status}</Badge>
                            </div>
                            <div className="vault-details">
                                <div className="detail-item">
                                    <span className="detail-label">Amount</span>
                                    <span className="detail-value">{vault.amount} STX</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Type</span>
                                    <span className="detail-value">{vault.type}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Condition</span>
                                    <span className="detail-value">{vault.target}</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <span className="view-link">View Details <ArrowUpRight size={14} /></span>
                            </div>
                        </Card>
                    ))}

                    <Card hoverable className="create-vault-card" onClick={() => navigate('/vault/create')}>
                        <PlusCircle size={32} className="create-icon" />
                        <span className="create-text">Create New Vault</span>
                    </Card>
                </div>
            </section>
        </div>
    )
}

export default Dashboard
