import { useCallback } from 'react'
import { openContractCall } from '@stacks/connect'
import { useAuth } from './useAuth'
import * as contractHelpers from '@/lib/contracts'

export const useVault = () => {
    const { userSession } = useAuth()

    const executeContractCall = useCallback(async (params: any) => {
        return new Promise((resolve, reject) => {
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

    return {
        createVault,
        cancelVault,
        triggerRelease,
        pingActivity,
        submitApproval,
        addCosigner,
    }
}
