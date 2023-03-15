import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import Constants from 'expo-constants'
import { atom } from 'jotai'

import { userStateAtom } from './auth'

export const ethProvider = new StaticJsonRpcProvider(Constants.expoConfig.extra.polygonEndpoint)

export const ethWalletAtom = atom((get) => {
  const user = get(userStateAtom)
  if (!user || !user.privKey) return
  return new Wallet(user.privKey, ethProvider)
})

export const ethWalletAddress = atom((get) => get(ethWalletAtom)?.getAddress())
