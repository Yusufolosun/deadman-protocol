import { uintCV, principalCV } from '@stacks/transactions'
import { getNetwork, getContractOwnerAddress } from './stacks'

// Contract Names
export const CONTRACTS = {
    VAULT_CORE: 'deadman-vault-core-v2',
    CONDITION_ENGINE: 'condition-engine',
    DELEGATION_REGISTRY: 'deadman-delegation-registry-v2',
    ACTIVITY_TRACKER: 'activity-tracker',
    RELEASE_HANDLER: 'deadman-release-handler-v2',
    ADMIN_CONFIG: 'admin-config',
    FEE_VAULT: 'deadman-fee-vault',
    VAULT_REGISTRY: 'deadman-vault-registry',
    NOTIFICATION_LOGGER: 'deadman-notification-logger',
    VAULT_EXTENSIONS: 'deadman-vault-extensions',
    TIME_UTILS: 'deadman-time-utils',
    ACCESS_CONTROL: 'deadman-access-control',
    EMERGENCY_STOP: 'deadman-emergency-stop',
    RECOVERY: 'deadman-recovery',
}

// Utility to create contract call objects
export const getContractCallParams = (contractName: string, functionName: string, functionArgs: any[]) => {
    return {
        contractAddress: getContractOwnerAddress(),
        contractName,
        functionName,
        functionArgs,
        network: getNetwork(),
    }
}

// --- deadman-vault-core ---

export const createVault = (amount: number, conditionType: number, targetBlock: number, inactivityBlocks: number, threshold: number, beneficiary: string) => {
    return getContractCallParams(CONTRACTS.VAULT_CORE, 'create-vault', [
        uintCV(amount),
        uintCV(conditionType),
        uintCV(targetBlock),
        uintCV(inactivityBlocks),
        uintCV(threshold),
        principalCV(beneficiary),
    ])
}

export const cancelVault = (vaultId: number) => {
    return getContractCallParams(CONTRACTS.VAULT_CORE, 'cancel-vault', [uintCV(vaultId)])
}

export const triggerRelease = (vaultId: number) => {
    return getContractCallParams(CONTRACTS.VAULT_CORE, 'trigger-release', [uintCV(vaultId)])
}

// --- activity-tracker ---

export const pingActivity = () => {
    return getContractCallParams(CONTRACTS.ACTIVITY_TRACKER, 'ping', [])
}

// --- delegation-registry ---

export const submitApproval = (vaultId: number) => {
    return getContractCallParams(CONTRACTS.VAULT_CORE, 'submit-approval', [uintCV(vaultId)])
}

export const addCosigner = (vaultId: number, cosigner: string) => {
    return getContractCallParams(CONTRACTS.VAULT_CORE, 'add-cosigner', [
        uintCV(vaultId),
        principalCV(cosigner),
    ])
}
