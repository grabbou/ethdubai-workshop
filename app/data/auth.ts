import AsyncStorage from '@react-native-async-storage/async-storage'
import { State } from '@web3auth/react-native-sdk'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

export const userStateAtom = atomWithStorage<State | null>(
  'userState',
  null,
  createJSONStorage(() => AsyncStorage)
)
