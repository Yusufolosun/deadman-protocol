import React, { useState } from 'react'
import './Navbar.css'
import { Link, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, PlusCircle, Activity as ActivityIcon, Wallet, LogOut, ChevronDown, CheckCircle, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const Navbar: React.FC = () => {
    const location = useLocation()
    const { isConnected, userData, connect, disconnect } = useAuth()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Create Vault', path: '/vault/create', icon: <PlusCircle size={18} /> },
        { label: 'Activity', path: '/activity', icon: <ActivityIcon size={18} /> },
        { label: 'Approvals', path: '/approvals', icon: <CheckCircle size={18} /> },
    ]

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 5)}...${addr.slice(-4)}`
    }

    const address = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || ''

    return (
        <nav className="navbar glass">
            <div className="navbar-content">
                <Link to="/" className="navbar-logo">
                    <Shield className="logo-icon" size={24} />
                    <span className="logo-text">Deadman Protocol</span>
                </Link>

                <div className="navbar-links">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="navbar-actions">
                    {isConnected ? (
                        <div className="user-menu">
                            <button
                                className="address-badge glow-on-hover"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="avatar-placeholder"></div>
                                <span>{truncateAddress(address)}</span>
                                <ChevronDown size={14} />
                            </button>

                            {isDropdownOpen && (
                                <div className="user-dropdown glass animate-fade">
                                    <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                        <Settings size={16} />
                                        <span>Settings</span>
                                    </Link>
                                    <button onClick={() => { disconnect(); setIsDropdownOpen(false); }} className="dropdown-item danger">
                                        <LogOut size={16} />
                                        <span>Disconnect</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="connect-button glow-on-hover" onClick={connect}>
                            <Wallet size={18} />
                            <span>Connect Wallet</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
