import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import Constants from 'expo-constants'
import { atom } from 'jotai'

import { userStateAtom } from './auth'

/**
 * Easiest way to connect to Ethereum when having access to users' private key. On web, you'd be looking at
 * MetaMaskProvider (Injected) or WalletConect.
 *
 * Unfortunately, WalletConnect does not work with React Native at the time of making this workshop, so we're using this instead.
 */
export const ethProvider = new StaticJsonRpcProvider(Constants.expoConfig.extra.polygonEndpoint)

export const ethWalletAtom = atom((get) => {
  const user = get(userStateAtom)
  if (!user || !user.privKey) return
  return new Wallet(user.privKey, ethProvider)
})

export const ethWalletAddress = atom((get) => get(ethWalletAtom)?.getAddress())
