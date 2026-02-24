import React from 'react'
import './Navbar.css'
import { Link, useLocation } from 'react-router-dom'
import { Shield, LayoutDashboard, PlusCircle, Activity as ActivityIcon, Wallet } from 'lucide-react'

const Navbar: React.FC = () => {
    const location = useLocation()

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Create Vault', path: '/vault/create', icon: <PlusCircle size={18} /> },
        { label: 'Activity', path: '/activity', icon: <ActivityIcon size={18} /> },
    ]

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
                    <button className="connect-button glow-on-hover">
                        <Wallet size={18} />
                        <span>Connect Wallet</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
