import { Contract } from '@ethersproject/contracts'
import { atom } from 'jotai'

import { ethWalletAtom } from './ethereum'

/**
 * ERC20 tokens are a bit different to work with than Ethers. They are Smart Contracts
 * that hold a map of owners and balances. To transfer tokens, we need to know smart contract address.
 */
const testToken = {
  address: '0x2d7882beDcbfDDce29Ba99965dd3cdF7fcB10A1e',
  abi: [
    'function balanceOf(address _owner) public view returns (uint256 balance)',
    'function transfer(address _to, uint256 _value) public returns (bool success)',
  ],
}

export const testTokenContractAtom = atom((get) => {
  const ethWallet = get(ethWalletAtom)
  return new Contract(testToken.address, testToken.abi, ethWallet)
})
