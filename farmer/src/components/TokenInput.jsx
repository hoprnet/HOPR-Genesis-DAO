import {
  Input, InputGroup, InputLeftAddon, InputRightElement, Spinner
} from "@chakra-ui/react"

import { ActionButton } from './ActionButton';


export const TokenInput = ({ symbol = "Plant", action = "Do it!", value = 0, displayOnly=false, address, setValue, handleSwap, waiting, additionalRequirement}) => {
  const format = (event) => event && Number(event.target.value).toFixed(2) || "0.00"
  const warning = additionalRequirement ?? true;
  return (
    <InputGroup>
      <InputLeftAddon children={
        <div style={{ display:"flex", width:"100px" }}>
          {symbol}
        </div>
      } />
      <Input
        disabled={displayOnly}
        placeholder="0.0"
        onChange={(e) => setValue(e.target.value)}
        type="number"
        value={value}
        width="100%"
      >
      </Input>
      <InputRightElement width="10rem">
        {
          value > 0 && address && warning && <ActionButton h="1.75rem" size="sm" mr="5px" onClick={handleSwap} disabled={waiting}>
            {waiting ? <Spinner /> : action}
          </ActionButton>
        }
      </InputRightElement>
    </InputGroup>
  )
}