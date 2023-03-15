import Web3Auth, { LOGIN_PROVIDER, OPENLOGIN_NETWORK } from '@web3auth/react-native-sdk'
import * as Clipboard from 'expo-clipboard'
import Constants, { AppOwnership } from 'expo-constants'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useAtom, useAtomValue } from 'jotai'
import { Suspense, useEffect, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { userStateAtom } from '../data/auth'
import { ethWalletAddress } from '../data/ethereum'

/**
 * Automatically determine redirect URL whether we're running in Managed mode or Standalone
 */
const resolvedRedirectUrl =
  Constants.appOwnership == AppOwnership.Expo || Constants.appOwnership == AppOwnership.Guest
    ? Linking.createURL('web3auth', {})
    : Linking.createURL('web3auth', { scheme: 'myworkshopapp' })

const web3auth = new Web3Auth(WebBrowser, {
  clientId: Constants.expoConfig.extra.web3authClientId,
  network: OPENLOGIN_NETWORK.TESTNET,
  redirectUrl: resolvedRedirectUrl,
})

export default function Home() {
  const [user, setUser] = useAtom(userStateAtom)
  const login = async () => {
    try {
      const state = await web3auth.login({
        loginProvider: LOGIN_PROVIDER.GOOGLE,
        redirectUrl: resolvedRedirectUrl,
      })
      setUser(state)
    } catch (e) {
      alert(e.message)
    }
  }
  const logout = async () => {
    setUser(null)
  }
  return (
    <View>
      {user && (
        <Suspense fallback={<ActivityIndicator />}>
          <WalletAddress />
        </Suspense>
      )}
      {user ? (
        <TouchableOpacity onPress={logout}>
          <Text>Logout</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={login}>
          <Text>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const WalletAddress = () => {
  const address = useAtomValue(ethWalletAddress)

  /**
   * Little utility to show a small "Copied!" indicator after copying the address
   * for a few seconds (configured to 5s)
   */
  const [copied, setCopied] = useState(false)
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(address)
    setCopied(true)
  }
  useEffect(() => {
    const timeout = copied && setTimeout(() => setCopied(false), 5000)
    return () => clearTimeout(timeout)
  })

  return (
    <>
      <Text onPress={copyToClipboard}>Wallet address: {address}</Text>
      {copied && <Text>Copied!</Text>}
    </>
  )
}
