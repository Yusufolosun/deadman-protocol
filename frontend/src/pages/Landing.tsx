import React from 'react'
import './Landing.css'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import { Shield, Clock, Users, Zap, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const Landing: React.FC = () => {
    const { isConnected, connect } = useAuth()
    const navigate = useNavigate()

    const features = [
        {
            icon: <Clock size={32} className="feature-icon" />,
            title: "Dead Man's Switch",
            description: "Automatically release assets if your account remains inactive for a specific block height threshold."
        },
        {
            icon: <Users size={32} className="feature-icon" />,
            title: "Conditional Delivery",
            description: "Funds only release when M-of-N designated co-signers approve the activation condition."
        },
        {
            icon: <Shield size={32} className="feature-icon" />,
            title: "Time-Locked Disclosure",
            description: "Make sensitive data or encrypted keys retrievable only after reaching a specific Bitcoin block height."
        },
        {
            icon: <Zap size={32} className="feature-icon" />,
            title: "Purely On-Chain",
            description: "No oracles. No off-chain dependencies. 100% verifiable Clarity smart contracts on Stacks."
        }
    ]

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section animate-slide-up">
                <div className="hero-badge animate-fade">
                    <span className="badge-text">Trusted by Principals on Stacks</span>
                </div>
                <h1 className="hero-title font-heading">
                    On-Chain Trust <span className="text-gradient">Delegation</span>
                </h1>
                <p className="hero-subtitle text-secondary">
                    Secure your digital legacy with the world's first generalized conditional transfer protocol.
                    No intermediaries. Just verifiable code.
                </p>

                <div className="hero-actions">
                    {isConnected ? (
                        <Button size="lg" onClick={() => navigate('/dashboard')} rightIcon={<ArrowRight size={20} />}>
                            Go to Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button size="lg" onClick={connect} leftIcon={<Shield size={20} />}>
                                Secure Your Assets
                            </Button>
                            <Button size="lg" variant="ghost" className="learn-more">
                                Learn How It Works
                            </Button>
                        </>
                    )}
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-grid">
                {features.map((feature, index) => (
                    <Card key={index} hoverable className="feature-card animate-fade" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="feature-icon-wrapper">
                            {feature.icon}
                        </div>
                        <h3 className="feature-title font-heading">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                    </Card>
                ))}
            </section>

            {/* Trust Section */}
            <section className="trust-section glass animate-fade">
                <div className="trust-content">
                    <div className="trust-text">
                        <h2 className="font-heading">Verifiable Governance</h2>
                        <p className="text-secondary">
                            Deadman Protocol uses explicit inter-contract calls to enforce activation conditions.
                            Once a vault is created, its logic is immutable and guaranteed by the blockchain.
                        </p>
                    </div>
                    <div className="trust-stats">
                        <div className="stat-item">
                            <span className="stat-value">14</span>
                            <span className="stat-label">Clarity Contracts</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Off-Chain Oracles</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">3</span>
                            <span className="stat-label">Condition Types</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section animate-slide-up">
                <h2 className="font-heading">Ready to Secure Your Future?</h2>
                <p className="text-secondary">Start creating your first conditional vault in less than 2 minutes.</p>
                <Button size="lg" onClick={isConnected ? () => navigate('/vault/create') : connect} variant="primary">
                    {isConnected ? 'Create Current Vault' : 'Connect Wallet to Start'}
                </Button>
            </section>
        </div>
    )
}

export default Landing
