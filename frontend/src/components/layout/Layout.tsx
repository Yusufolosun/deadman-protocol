import React from 'react'
import Navbar from './Navbar'
import './Layout.css'

interface LayoutProps {
    children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="layout-root">
            {/* Background blobs for depth */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <div className="layout-container">
                <Navbar />

                <main className="layout-main animate-fade">
                    {children}
                </main>

                <footer className="layout-footer">
                    {/* Placeholder for Footer */}
                </footer>
            </div>
        </div>
    )
}

export default Layout
