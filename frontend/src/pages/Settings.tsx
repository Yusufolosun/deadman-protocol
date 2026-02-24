import React, { useState, useEffect } from 'react'
import './Settings.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import { Info, ShieldAlert, Cpu, Network } from 'lucide-react'
import { useStacks } from '@/hooks/useStacks'

const SettingsPage: React.FC = () => {
    const { getProtocolConfig } = useStacks()

    const [loading, setLoading] = useState(true)
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        const fetchConfig = async () => {
            // In a real app, query admin-config contract
            // const data = await getProtocolConfig()
            // setConfig(data)

            // Mock data
            setTimeout(() => {
                setConfig({
                    minLockBlocks: 144,
                    maxCosigners: 5,
                    protocolPaused: false,
                    owner: 'SP123...789',
                    network: 'Stacks Testnet'
                })
                setLoading(false)
            }, 500)
        }
        fetchConfig()
    }, [])

    if (loading) return <div className="page-loader"><Spinner size="lg" /></div>

    return (
        <div className="settings-page animate-slide-up">
            <header className="page-header">
                <h1 className="font-heading">Protocol Settings</h1>
                <p className="text-secondary">View protocol configurations and network status.</p>
            </header>

            <div className="settings-grid">
                <section className="config-section">
                    <Card className="config-card">
                        <h2 className="card-title"><Cpu size={20} /> Parameters</h2>
                        <div className="config-list">
                            <div className="config-item">
                                <div className="item-label">
                                    <span>Minimum Lock Time</span>
                                    <p className="helper">Minimum block height for time-based pings.</p>
                                </div>
                                <strong>{config.minLockBlocks} Blocks</strong>
                            </div>
                            <div className="config-item">
                                <div className="item-label">
                                    <span>Maximum Co-signers</span>
                                    <p className="helper">Max number of co-signers per vault.</p>
                                </div>
                                <strong>{config.maxCosigners}</strong>
                            </div>
                        </div>
                    </Card>

                    <Card className="network-card">
                        <h2 className="card-title"><Network size={20} /> Network Info</h2>
                        <div className="config-list">
                            <div className="config-item">
                                <span>Target Network</span>
                                <strong>{config.network}</strong>
                            </div>
                            <div className="config-item">
                                <span>Contract Owner</span>
                                <code className="address-mini">{config.owner}</code>
                            </div>
                        </div>
                    </Card>
                </section>

                <section className="info-section">
                    <Card className="alert-card glass info">
                        <div className="alert-header">
                            <ShieldAlert size={20} />
                            <h3 className="card-title">Security Notice</h3>
                        </div>
                        <p className="text-secondary">
                            The Deadman Protocol is currently in alpha. All code is public and open-source,
                            but has not yet undergone a formal security audit. Use with caution for large amounts of STX.
                        </p>
                        <Button variant="ghost" size="sm" className="doc-link">Read Whitepaper</Button>
                    </Card>

                    <Card className="help-card">
                        <h3 className="card-title"><Info size={20} /> About</h3>
                        <p className="text-secondary">
                            Deadman Protocol is an autonomous trust delegation system that enables
                            inheritance, secure recovery, and conditional delivery of digital assets.
                        </p>
                        <div className="version-info">
                            <span>Version 0.1.0-alpha</span>
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    )
}

export default SettingsPage
