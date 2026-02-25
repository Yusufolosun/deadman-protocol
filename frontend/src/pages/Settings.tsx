import type React from 'react'
import { useState, useEffect } from 'react'
import './Settings.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import AddressDisplay from '@/components/common/AddressDisplay'
import { Info, ShieldAlert, Cpu, Network, ExternalLink } from 'lucide-react'
import { useStacks } from '@/hooks/useStacks'
import { useBlockHeight } from '@/hooks/useBlockHeight'
import { getContractOwnerAddress, getNetworkName } from '@/lib/stacks'
import { blocksToTime, formatBlockHeight } from '@/lib/format'
import { LINKS } from '@/lib/constants'
import type { ProtocolConfig } from '@/types'

const SettingsPage: React.FC = () => {
    const { getProtocolConfig } = useStacks()
    const { blockHeight } = useBlockHeight()

    const [loading, setLoading] = useState(true)
    const [config, setConfig] = useState<ProtocolConfig | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getProtocolConfig()
                if (data) {
                    setConfig({
                        minLockBlocks: Number(data['min-lock-blocks'] ?? data.minLockBlocks ?? 144),
                        maxCosigners: Number(data['max-cosigners'] ?? data.maxCosigners ?? 5),
                        maxBeneficiaries: Number(data['max-beneficiaries'] ?? data.maxBeneficiaries ?? 5),
                        paused: Boolean(data['protocol-paused'] ?? data.paused ?? false),
                    })
                } else {
                    setError('Failed to load protocol configuration.')
                }
            } catch (err) {
                console.error('Failed to fetch config:', err)
                setError('Failed to load protocol configuration.')
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [getProtocolConfig])

    if (loading) return <div className="page-loader"><Spinner size="lg" /></div>

    if (error || !config) {
        return (
            <div className="settings-page animate-fade">
                <header className="page-header">
                    <h1 className="font-heading">Protocol Settings</h1>
                </header>
                <Card>
                    <p className="text-secondary">{error || 'Unable to load configuration.'}</p>
                    <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
                </Card>
            </div>
        )
    }

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
                                <strong>{config.minLockBlocks} Blocks ({blocksToTime(config.minLockBlocks)})</strong>
                            </div>
                            <div className="config-item">
                                <div className="item-label">
                                    <span>Maximum Co-signers</span>
                                    <p className="helper">Max number of co-signers per vault.</p>
                                </div>
                                <strong>{config.maxCosigners}</strong>
                            </div>
                            <div className="config-item">
                                <div className="item-label">
                                    <span>Maximum Beneficiaries</span>
                                    <p className="helper">Max beneficiaries per vault.</p>
                                </div>
                                <strong>{config.maxBeneficiaries}</strong>
                            </div>
                            <div className="config-item">
                                <div className="item-label">
                                    <span>Protocol Status</span>
                                    <p className="helper">Whether new vaults can be created.</p>
                                </div>
                                <Badge variant={config.paused ? 'error' : 'success'}>{config.paused ? 'Paused' : 'Active'}</Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="network-card">
                        <h2 className="card-title"><Network size={20} /> Network Info</h2>
                        <div className="config-list">
                            <div className="config-item">
                                <span>Target Network</span>
                                <strong>{getNetworkName()}</strong>
                            </div>
                            <div className="config-item">
                                <span>Contract Owner</span>
                                <AddressDisplay address={getContractOwnerAddress()} />
                            </div>
                            {blockHeight && (
                                <div className="config-item">
                                    <span>Current Block Height</span>
                                    <strong>{formatBlockHeight(blockHeight)}</strong>
                                </div>
                            )}
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
                        <a href={LINKS.DOCS} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="doc-link" rightIcon={<ExternalLink size={14} />}>Documentation</Button>
                        </a>
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
