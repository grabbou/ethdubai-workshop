import AsyncStorage from '@react-native-async-storage/async-storage'
import { State } from '@web3auth/react-native-sdk'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

/**
 * Note: Make sure to add `@toruslabs/openlogin` to your dev dependencies, otherwise
 * the `State` type will not be expanded.
 *
 * UserState is received from Web3Auth and contains private keys as well as some social information.
 * You can use that information to customise your application.
 *
 * AtomWithStorage is automatically persisted, so you don't have to worry about your state across reloads.
 */
export const userStateAtom = atomWithStorage<State | null>(
  'userState',
  null,
  createJSONStorage(() => AsyncStorage)
)
