/** Condition type constants matching the Clarity contract */
export enum ConditionType {
    BlockHeight = 1,
    Inactivity = 2,
    Threshold = 3,
}

/** On-chain vault data returned by get-vault read-only call */
export interface Vault {
    owner: string
    amount: number
    conditionType: ConditionType
    targetBlock: number
    inactivityBlocks: number
    requiredThreshold: number
    released: boolean
    createdAt: number
}

/** Extended vault data with off-chain or derived fields */
export interface VaultDisplay extends Vault {
    id: number
    beneficiary: string | null
    cosignerCount: number
    approvalCount: number
}

/** Protocol configuration from admin-config get-config */
export interface ProtocolConfig {
    minLockBlocks: number
    maxCosigners: number
    maxBeneficiaries: number
    paused: boolean
}

/** Form data for creating a new vault */
export interface CreateVaultForm {
    name: string
    amount: string
    conditionType: string
    targetBlock: string
    inactivityBlocks: string
    threshold: string
    beneficiary: string
    cosigners: string[]
}

/** Approval entry for co-signer display */
export interface PendingApproval {
    vaultId: number
    vaultOwner: string
    amount: number
    condition: string
    currentApprovals: number
    requiredApprovals: number
}
