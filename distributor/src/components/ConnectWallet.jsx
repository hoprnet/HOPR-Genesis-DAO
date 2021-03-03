import { Text } from "@chakra-ui/react";

import { ActionButton } from "./ActionButton";

export const ConnectWallet = ({ address, onClick, isLoading }) => {
  return address ? (
    <Text>Wallet {address} connected</Text>
  ) : (
    <ActionButton onClick={onClick} isLoading={isLoading}>
      Connect Wallet
    </ActionButton>
  );
};
