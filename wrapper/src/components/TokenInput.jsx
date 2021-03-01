import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup, InputLeftAddon, InputRightElement,
} from "@chakra-ui/react"

import { ActionButton } from './ActionButton';


export const TokenInput = ({ symbol = "xHOPR", value = 0}) => {
  const handleClick = () => {
    console.log("Swap!")
  }

  return (
    <InputGroup>
      <InputLeftAddon children={symbol} />
      <NumberInput defaultValue={0} value={value} precision={2} step={0.01} width="100%">
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      <InputRightElement width="4.5rem">
        <ActionButton h="1.75rem" size="sm" mr="30px" onClick={handleClick}>
          Swap
        </ActionButton>
      </InputRightElement>
    </InputGroup>
  )
}