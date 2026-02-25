import { useCallback, useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { useAuth } from './useAuth'
import { useStacks } from './useStacks'
import * as contractHelpers from '@/lib/contracts'
import type { VaultDisplay } from '@/types'

export const useVault = () => {
    const { userSession, stxAddress } = useAuth()
    const stacks = useStacks()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const executeContractCall = useCallback(async (params: any) => {
        setLoading(true)
        setError(null)
        try {
            const result = await new Promise((resolve, reject) => {
                openContractCall({
                    ...params,
                    userSession,
                    onFinish: (data) => {
                        console.log('Transaction finished:', data)
                        resolve(data)
                    },
                    onCancel: () => {
                        console.log('Transaction cancelled')
                        reject(new Error('Transaction cancelled'))
                    },
                })
            })
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Transaction failed'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [userSession])

    const createVault = (amount: number, type: number, target: number, inactivity: number, threshold: number, beneficiary: string) =>
        executeContractCall(contractHelpers.createVault(amount, type, target, inactivity, threshold, beneficiary))

    const cancelVault = (vaultId: number) =>
        executeContractCall(contractHelpers.cancelVault(vaultId))

    const triggerRelease = (vaultId: number) =>
        executeContractCall(contractHelpers.triggerRelease(vaultId))

    const pingActivity = () =>
        executeContractCall(contractHelpers.pingActivity())

    const submitApproval = (vaultId: number) =>
        executeContractCall(contractHelpers.submitApproval(vaultId))

    const addCosigner = (vaultId: number, cosigner: string) =>
        executeContractCall(contractHelpers.addCosigner(vaultId, cosigner))

    /** Fetch a single vault with delegation data and return VaultDisplay */
    const fetchVaultDisplay = useCallback(async (vaultId: number): Promise<VaultDisplay | null> => {
        const vault = await stacks.getVault(vaultId)
        if (!vault) return null

        const [beneficiary, cosignerCount, approvalCount] = await Promise.all([
            stacks.getBeneficiary(vaultId),
            stacks.getCosignerCount(vaultId),
            stacks.getApprovalCount(vaultId),
        ])

        return {
            id: vaultId,
            owner: vault.owner,
            amount: Number(vault.amount),
            conditionType: Number(vault['condition-type']),
            targetBlock: Number(vault['target-block']),
            inactivityBlocks: Number(vault['inactivity-blocks']),
            requiredThreshold: Number(vault['required-threshold']),
            released: vault.released,
            createdAt: Number(vault['created-at']),
            beneficiary: beneficiary ?? null,
            cosignerCount: Number(cosignerCount ?? 0),
            approvalCount: Number(approvalCount ?? 0),
        }
    }, [stacks])

    /** Fetch all vaults owned by the connected wallet */
    const fetchMyVaults = useCallback(async (): Promise<VaultDisplay[]> => {
        if (!stxAddress) return []
        const count = await stacks.getOwnerVaultCount(stxAddress)
        if (!count || Number(count) === 0) return []

        const vaults: VaultDisplay[] = []
        for (let i = 0; i < Number(count); i++) {
            const vaultId = await stacks.getOwnerVaultId(stxAddress, i)
            if (vaultId != null) {
                const display = await fetchVaultDisplay(Number(vaultId))
                if (display) vaults.push(display)
            }
        }
        return vaults
    }, [stxAddress, stacks, fetchVaultDisplay])

    const clearError = useCallback(() => setError(null), [])

    return {
        createVault,
        cancelVault,
        triggerRelease,
        pingActivity,
        submitApproval,
        addCosigner,
        fetchVaultDisplay,
        fetchMyVaults,
        loading,
        error,
        clearError,
    }
}
