import { Text } from "@chakra-ui/react";
import { ActionButton } from "./ActionButton";

export const Claimable = ({ claimable, name, onClick }) => {
  const canClaim = claimable > 0;

  return (
    <div>
      {canClaim ? (
        <Text>
          You can claim {claimable} wxHOPR because of "{name}".
        </Text>
      ) : (
        <Text>Nothing to claim in "{name}" schedule.</Text>
      )}

      <ActionButton onClick={onClick} disabled={!canClaim}>
        Claim
      </ActionButton>
    </div>
  );
};
