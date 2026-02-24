import React from 'react'
import './Footer.css'
import { Shield, Github, Twitter } from 'lucide-react'

const Footer: React.FC = () => {
    return (
        <footer className="footer-content">
            <div className="footer-grid">
                <div className="footer-brand">
                    <div className="brand-logo">
                        <Shield className="logo-icon" size={24} />
                        <span className="logo-text">Deadman Protocol</span>
                    </div>
                    <p className="footer-description">
                        A generalized on-chain trust delegation and conditional transfer protocol built on Stacks.
                    </p>
                </div>

                <div className="footer-links">
                    <div className="link-group">
                        <h3>Protocol</h3>
                        <a href="#github">Documentation</a>
                        <a href="#audit">Security</a>
                        <a href="#stats">Analytics</a>
                    </div>
                    <div className="link-group">
                        <h3>Community</h3>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                            <Twitter size={16} /> Twitter
                        </a>
                        <a href="https://github.com/Yusufolosun/deadman-protocol" target="_blank" rel="noopener noreferrer">
                            <Github size={16} /> GitHub
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Deadman Protocol. Built on Stacks.</p>
                <div className="footer-badge">
                    <span className="dot"></span>
                    Stacks Mainnet
                </div>
            </div>
        </footer>
    )
}

export default Footer
