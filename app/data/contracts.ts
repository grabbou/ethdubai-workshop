import { atom } from 'jotai'

import { Erc20__factory } from '../../types/ethers-contracts'
import { ethWalletAtom } from './ethereum'

/**
 * ERC20 tokens are a bit different to work with than Ethers. They are Smart Contracts
 * that hold a map of owners and balances. To transfer tokens, we need to know smart contract address.
 */
export const testToken = {
  address: '0x2d7882beDcbfDDce29Ba99965dd3cdF7fcB10A1e',
  abi: [
    'function decimals() public view returns (uint8 decimals)',
    'function balanceOf(address _owner) public view returns (uint256 balance)',
    'function transfer(address _to, uint256 _value) public returns (bool success)',
  ],
  // You can also run `decimals()` to get that
  decimals: 18,
}

/**
 * Returns Contract instance associated with an active wallet. This is a derived atom, so its value will change
 * only when underlying `ethWalletAtom` changes.
 */
export const testTokenContractAtom = atom((get) => {
  const ethWallet = get(ethWalletAtom)
  return Erc20__factory.connect(testToken.address, ethWallet)
})
