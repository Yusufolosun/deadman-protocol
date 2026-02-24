import React, { createContext, useState, useEffect, useCallback } from 'react'
import { AppConfig, UserSession, showConnect, UserData } from '@stacks/connect'
import { APP_DETAILS } from '@/lib/stacks'

interface AuthContextType {
    userSession: UserSession
    userData: UserData | null
    isConnected: boolean
    connect: () => void
    disconnect: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userData, setUserData] = useState<UserData | null>(null)

    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            setUserData(userSession.loadUserData())
        } else if (userSession.isSignInPending()) {
            userSession.handlePendingSignIn().then((data) => {
                setUserData(data)
            })
        }
    }, [])

    const connect = useCallback(() => {
        showConnect({
            appDetails: APP_DETAILS,
            userSession,
            onFinish: () => {
                setUserData(userSession.loadUserData())
            },
            onCancel: () => {
                console.log('User cancelled connect')
            },
        })
    }, [])

    const disconnect = useCallback(() => {
        userSession.signUserOut()
        setUserData(null)
    }, [])

    const value = {
        userSession,
        userData,
        isConnected: !!userData,
        connect,
        disconnect,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
