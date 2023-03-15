import { isAddress } from '@ethersproject/address'
import { formatEther, formatUnits, parseEther, parseUnits } from '@ethersproject/units'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Web3Auth, { LOGIN_PROVIDER, OPENLOGIN_NETWORK } from '@web3auth/react-native-sdk'
import * as Clipboard from 'expo-clipboard'
import Constants, { AppOwnership } from 'expo-constants'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useAtom, useAtomValue } from 'jotai'
import { Suspense, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { userStateAtom } from '../data/auth'
import { testToken, testTokenContractAtom } from '../data/contracts'
import { ethProvider, ethWalletAddress, ethWalletAtom } from '../data/ethereum'

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
          <TransferToWallet />
          <ERC20TokenBalance />
          <TransferERC20TokenToWallet />
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

/**
 * Transfers tokens to another wallet address
 */
const TransferToWallet = () => {
  const queryClient = useQueryClient()
  const wallet = useAtomValue(ethWalletAtom)
  /**
   * Clipboard doesn't work across Apple M1 devices and iOS simulators, so you may consider substituting
   * the following empty string default value with your destination wallet.
   *
   * For prototyping, you can use: "0x7D15080A13c8128dBAf90a2c2326058b5c1D5eac" which is my wallet.
   */
  const [toWallet, setToWallet] = useState('')

  /**
   * We are using React Query's `useMutation` to send a transaction. Thanks to that,
   * we have nice error handling and pending state management out of the box, together
   * with the ability to invalidate the cache when the transaction is completed.
   */
  const sendEthToWallet = useMutation({
    mutationKey: ['sendToWallet'],
    mutationFn: async () => {
      /**
       * Validate address before attempting the transaction
       */
      if (!isAddress(toWallet)) {
        throw new Error('Invalid wallet address')
      }

      /**
       * There are more options available, but for now we're going to send a simple
       * transaction. If you were building something more sophisticated, you would
       * look into other options, such as `gasLimit`, `maxGasPrice` or `nonce`.
       */
      const tx = await wallet.sendTransaction({
        to: toWallet,
        value: parseEther('0.01'),
      })

      /**
       * Get the receipt of the transaction. This is a promise that resolves once the
       * transaction is confirmed on the blockchain. We can use that to learn about
       * effective gas amount and gas price.
       */
      const receipt = await tx.wait()

      // Whatever you return from here is available in `onSuccess` handler, so return at your convinenience
      return { tx, receipt }
    },
    onSuccess: ({ tx, receipt }) => {
      /**
       * React Native Alert component allows to configure multiple buttons.
       * We're going to use them for time being to allow the user to view the transaction
       * on Polygonscan.
       */
      Alert.alert('Transaction completed', `Transaction hash: ${tx.hash}`, [
        {
          text: 'OK',
        },
        {
          text: 'View on Polygonscan',
          onPress: () => WebBrowser.openBrowserAsync(`https://mumbai.polygonscan.com/tx/${tx.hash}`),
        },
      ])
      /**
       * Optimistic update: Once we have confirmed transaction, the receipt object
       * contains the effective gas price and gas used. We can use that to calculate
       * the balance in the account.
       *
       * Note this assumes that no other transactions happened in the future. Depending on your
       * use case and whether you control wallet (like here), you can also just call `invalidateQueries`
       * and tell React Query to automatically refetch the balance from chain.
       */
      queryClient.setQueryData(['balance'], (balance: typeof tx.value) =>
        balance.sub(tx.value).sub(receipt.effectiveGasPrice.mul(receipt.gasUsed))
      )
    },
    onError: (error) => {
      /**
       * We're dealing with a mix of on-chain errors and ones that we throw ourselves,
       * so it's easier to just stringify this shape for faster debugging. In real world
       * scenario, you would like to handle this better.
       */
      Alert.alert('Something went wrong', JSON.stringify(error))
    },
  })

  return (
    <>
      <TextInput placeholder="Wallet address" onChangeText={setToWallet} value={toWallet} />
      <Text onPress={() => sendEthToWallet.mutateAsync()}>Transfer Eth to a friend</Text>
      {sendEthToWallet.isLoading && <ActivityIndicator />}
    </>
  )
}

/**
 * Transfering ERC20 tokens to another wallet address.
 *
 * To airdrop some tokens, visit Polygon Faucet https://faucet.polygon.technology,
 * pick `Mumbai` (unless you changed the default configuration) and then,
 * choose `Test ERC20` to airdrop some tokens
 */
const ERC20TokenBalance = () => {
  const wallet = useAtomValue(ethWalletAtom)
  const tokenContract = useAtomValue(testTokenContractAtom)

  const balance = useQuery({
    /**
     * Note that `queryKey` is an array. This is useful when we want to invalidate queries
     * that are related.
     *
     * For example, in order to invalidate all `balances`, a simple: invalidateQueries: ['balance'] would do.
     */
    queryKey: ['balance', 'testToken'],
    queryFn: async () => {
      return await tokenContract.balanceOf(wallet.address)
    },
  }).data!

  return (
    <>
      <Text>Balance of test ERC-20 token: {formatUnits(balance, testToken.decimals)}</Text>
    </>
  )
}

const TransferERC20TokenToWallet = () => {
  const queryClient = useQueryClient()
  const tokenContract = useAtomValue(testTokenContractAtom)

  /** Read similar comment in `TransferTokenToWallet` */
  const [toWallet, setToWallet] = useState('')

  const sendEthToWallet = useMutation({
    mutationKey: ['sendToWallet', 'testToken'],
    mutationFn: async () => {
      if (!isAddress(toWallet)) {
        throw new Error('Invalid wallet address')
      }

      /**
       * We're temporarily asserting types here until we provide type definitions
       * for our token contract
       */
      const tx = await tokenContract.transfer(
        toWallet,
        /**
         * Keep in mind that Faucet is rate-limited, so for testing purposes, it's a good idea
         * to keep the number of tokens transferred on the lower side
         */
        parseUnits('0.0001', testToken.decimals)
      )

      const receipt = await tx.wait()

      return { tx, receipt }
    },
    onSuccess: ({ tx }) => {
      Alert.alert('Transaction completed', `Transaction hash: ${tx.hash}`, [
        {
          text: 'OK',
        },
        {
          text: 'View on Polygonscan',
          onPress: () => WebBrowser.openBrowserAsync(`https://mumbai.polygonscan.com/tx/${tx.hash}`),
        },
      ])
      /**
       * We not only have to update ERC-20 token balance, but also balance of main wallet
       * where some tokens were spent on gas fees.
       *
       * At this point, I think we're good to just re-fetch both queries (note we're invalidating only the
       * root key).
       *
       * This is just to demonstrate alternative approaches, you should pick one that works better for your use case.
       */
      queryClient.invalidateQueries(['balance'])
    },
    onError: (error) => {
      Alert.alert('Something went wrong', JSON.stringify(error))
    },
  })

  return (
    <>
      <TextInput placeholder="Wallet address" onChangeText={setToWallet} value={toWallet} />
      <Text onPress={() => sendEthToWallet.mutateAsync()}>Transfer Eth to a friend</Text>
      {sendEthToWallet.isLoading && <ActivityIndicator />}
    </>
  )
}
