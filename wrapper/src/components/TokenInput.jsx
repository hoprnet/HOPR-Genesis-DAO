import {
  Input, InputGroup, InputLeftAddon, InputRightElement,
} from "@chakra-ui/react"
import { useState } from 'react'

import { ActionButton } from './ActionButton';


export const TokenInput = ({ symbol = "xHOPR", value = 0, address, setValue, handleSwap}) => {
  const toSwapSymbol = { xHOPR: "wxHOPR", wxHOPR: "xHOPR" }
  const format = (event) => event && Number(event.target.value).toFixed(2) || "0.00"
  return (
    <InputGroup>
      <InputLeftAddon children={
        <div style={{ display:"flex", width:"100px" }}>
          {symbol}
        </div>
      } />
      <Input
        placeholder="0.0"
        onChange={(e) => setValue(e.target.value)}
        type="number"
        value={value}
        width="100%"
      >
      </Input>
      <InputRightElement width="10rem">
        {
          value > 0 && address && <ActionButton h="1.75rem" size="sm" mr="5px" onClick={handleSwap}>
           Swap to {toSwapSymbol[symbol]}
          </ActionButton>
        }
      </InputRightElement>
    </InputGroup>
  )
}