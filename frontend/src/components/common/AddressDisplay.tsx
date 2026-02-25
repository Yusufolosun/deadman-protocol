import React, { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { truncateAddress } from '@/lib/format'
import { copyToClipboard } from '@/lib/clipboard'
import { getAddressUrl } from '@/lib/explorer'
import './AddressDisplay.css'

interface AddressDisplayProps {
  address: string
  truncate?: boolean
  copyable?: boolean
  linkToExplorer?: boolean
  className?: string
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  truncate = true,
  copyable = true,
  linkToExplorer = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await copyToClipboard(address)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayAddress = truncate ? truncateAddress(address) : address

  return (
    <span className={`address-display ${className}`} title={address}>
      <span className="address-text">{displayAddress}</span>
      {copyable && (
        <button
          className={`address-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy address'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
      {linkToExplorer && (
        <a
          href={getAddressUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="address-link"
          title="View in Explorer"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} />
        </a>
      )}
    </span>
  )
}

export default AddressDisplay
