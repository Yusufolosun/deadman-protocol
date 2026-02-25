import type React from 'react'
import './NetworkIndicator.css'

interface NetworkIndicatorProps {
  className?: string
}

const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ className = '' }) => {
  const network = import.meta.env.VITE_NETWORK || 'testnet'
  const isMainnet = network === 'mainnet'

  return (
    <span className={`network-indicator ${isMainnet ? 'network-mainnet' : 'network-testnet'} ${className}`}>
      <span className="dot" />
      {isMainnet ? 'Mainnet' : 'Testnet'}
    </span>
  )
}

export default NetworkIndicator
