import { Text } from "@chakra-ui/react";

import { ActionButton } from './ActionButton'


export const ConnectWallet = ({ address, onClick, isLoading, network }) => {
  return (
    address ? 
    <Text>Wallet {address} connected to {network}</Text> : 
    <ActionButton
      onClick={onClick} 
      isLoading={isLoading}
    >
      Connect Wallet
    </ActionButton>
  )
}