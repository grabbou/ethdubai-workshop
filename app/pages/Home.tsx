import { formatEther } from '@ethersproject/units'
import { useQuery } from '@tanstack/react-query'
import Web3Auth, { LOGIN_PROVIDER, OPENLOGIN_NETWORK } from '@web3auth/react-native-sdk'
import * as Clipboard from 'expo-clipboard'
import Constants, { AppOwnership } from 'expo-constants'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useAtom, useAtomValue } from 'jotai'
import { Suspense, useEffect, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { userStateAtom } from '../data/auth'
import { ethProvider, ethWalletAddress } from '../data/ethereum'

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
          <WalletBalance />
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

/**
 * Reads balance from chain and displays it on screen
 *
 * To airdrop some tokens, visit Polygon Faucet https://faucet.polygon.technology
 * and pick `Mumbai` (unless you changed the default configuration)
 */
const WalletBalance = () => {
  const walletAddress = useAtomValue(ethWalletAddress)

  /**
   * We could use `useState` and `useEffect` to accomplish the same thing, but
   * it is more future-proof to use React Query here. Not only it has first-class
   * support for Suspense, but also allows for caching and invalidating results
   * when an update is needed.
   *
   * We will get to it soon, when we start working on sending transactions.
   */
  const balance = useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      return await ethProvider.getBalance(walletAddress)
    },
    /**
     * We're asserting `data!` exists. This is because we know we're running in Suspense mode.
     * At the time of making this workshop, React Query doesn't have Suspense-specific hooks yet,
     * which means that we would have to handle the loading state explicitly. That, of course,
     * makes no sense in Suspense mode because the execution will pause until this Promise is resolved.
     *
     * Context: https://github.com/TanStack/query/issues/1297#issuecomment-1153092135
     */
  }).data!

  return (
    <>
      <Text>Balance: {formatEther(balance)}</Text>
    </>
  )
}
