import {
  NumberInput,
  NumberInputField,
  InputGroup, InputLeftAddon, InputRightElement,
} from "@chakra-ui/react"
import { useState } from 'react'

import { ActionButton } from './ActionButton';


export const TokenInput = ({ symbol = "xHOPR", value = 0, setValue, handleSwap}) => {
  return (
    <InputGroup>
      <InputLeftAddon children={symbol} />
      <NumberInput 
        onChange={setValue} 
        value={value} 
        precision={2} 
        step={0.01} 
        width="100%"
      >
        <NumberInputField />
      </NumberInput>
      <InputRightElement width="4.5rem">
        {
          value > 0 && <ActionButton h="1.75rem" size="sm" mr="5px" onClick={handleSwap}>
          Swap
          </ActionButton>
        }
      </InputRightElement>
    </InputGroup>
  )
}