import { Text } from "@chakra-ui/react";
import { ActionButton } from "./ActionButton";

export const Claimable = ({ claimable, name, onClick }) => {
  const canClaim = claimable > 0;

  return (
    <>
      <Text>
        You can claim {claimable} wxHOPR from "{name}" schedule.
      </Text>

      <ActionButton onClick={onClick} disabled={!canClaim}>
        Claim
      </ActionButton>
    </>
  );
};
