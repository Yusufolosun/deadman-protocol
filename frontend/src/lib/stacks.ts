import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network'

export const getNetwork = () => {
    const networkType = import.meta.env.VITE_NETWORK || 'testnet'
    return networkType === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET
}

export const getContractOwnerAddress = () => {
    return import.meta.env.VITE_CONTRACT_ADDRESS || ''
}

export const APP_DETAILS = {
    name: 'Deadman Protocol',
    icon: typeof window !== 'undefined' ? window.location.origin + '/logo.svg' : '',
}
