import { useCallback } from 'react'
import { fetchCallReadOnlyFunction, cvToValue } from '@stacks/transactions'
import { getNetwork, getContractOwnerAddress } from '@/lib/stacks'
import { CONTRACTS } from '@/lib/contracts'
import { uintCV, principalCV } from '@stacks/transactions'

export const useStacks = () => {
    const network = getNetwork()
    const contractAddress = getContractOwnerAddress()

    const readOnly = useCallback(async (contractName: string, functionName: string, functionArgs: any[]) => {
        try {
            const options = {
                contractAddress,
                contractName,
                functionName,
                functionArgs,
                network,
                senderAddress: contractAddress, // Default sender
            }
            const response = await fetchCallReadOnlyFunction(options)
            return cvToValue(response)
        } catch (error) {
            console.error(`Read-only call failed: ${functionName}`, error)
            return null
        }
    }, [contractAddress, network])

    const getVault = (vaultId: number) =>
        readOnly(CONTRACTS.VAULT_CORE, 'get-vault', [uintCV(vaultId)])

    const getNextVaultId = () =>
        readOnly(CONTRACTS.VAULT_CORE, 'get-next-vault-id', [])

    const getOwnerVaultCount = (owner: string) =>
        readOnly(CONTRACTS.VAULT_CORE, 'get-owner-vault-count', [principalCV(owner)])

    const getOwnerVaultId = (owner: string, index: number) =>
        readOnly(CONTRACTS.VAULT_CORE, 'get-owner-vault-id', [principalCV(owner), uintCV(index)])

    const getLastActive = (address: string) =>
        readOnly(CONTRACTS.ACTIVITY_TRACKER, 'get-last-active', [principalCV(address)])

    const getProtocolConfig = () =>
        readOnly(CONTRACTS.ADMIN_CONFIG, 'get-config', [])

    const getBeneficiary = (vaultId: number) =>
        readOnly(CONTRACTS.DELEGATION_REGISTRY, 'get-beneficiary', [uintCV(vaultId)])

    const getCosignerCount = (vaultId: number) =>
        readOnly(CONTRACTS.DELEGATION_REGISTRY, 'get-cosigner-count', [uintCV(vaultId)])

    const getCosigner = (vaultId: number, index: number) =>
        readOnly(CONTRACTS.DELEGATION_REGISTRY, 'get-cosigner', [uintCV(vaultId), uintCV(index)])

    const getApprovalCount = (vaultId: number) =>
        readOnly(CONTRACTS.DELEGATION_REGISTRY, 'get-approval-count', [uintCV(vaultId)])

    const hasApproved = (vaultId: number, cosigner: string) =>
        readOnly(CONTRACTS.DELEGATION_REGISTRY, 'has-approved', [uintCV(vaultId), principalCV(cosigner)])

    return {
        getVault,
        getNextVaultId,
        getOwnerVaultCount,
        getOwnerVaultId,
        getLastActive,
        getProtocolConfig,
        getBeneficiary,
        getCosignerCount,
        getCosigner,
        getApprovalCount,
        hasApproved,
        readOnly,
    }
}
