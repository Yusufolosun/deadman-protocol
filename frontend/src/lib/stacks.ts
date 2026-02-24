import { StacksMainnet, StacksTestnet } from '@stacks/network'

export const getNetwork = () => {
    const networkType = import.meta.env.VITE_NETWORK || 'testnet'
    return networkType === 'mainnet' ? new StacksMainnet() : new StacksTestnet()
}

export const getContractOwnerAddress = () => {
    return import.meta.env.VITE_CONTRACT_ADDRESS || ''
}

export const APP_DETAILS = {
    name: 'Deadman Protocol',
    icon: window.location.origin + '/logo.svg', // Will add logo later
}
