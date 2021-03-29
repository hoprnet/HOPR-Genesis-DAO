import { Box, Text } from "@chakra-ui/react";
import { Badge } from "@chakra-ui/react"
import { ActionButton } from './ActionButton'


export const ConnectWallet = ({ address, onClick, isLoading, networkName, networkType, children}) => {
  const color = networkType === "mainnet" ? "green" : networkType === "testnet" ? "purple" : "red"; 
  return (
    address ? 
    <Box>
      {children}
      <Text mt={12}>Wallet {address} connected to <Badge colorScheme={color}>{networkName} {networkType}</Badge></Text>
    </Box> : 
    <ActionButton
      onClick={onClick} 
      isLoading={isLoading}
    >
      Connect Wallet
    </ActionButton>
  )
}