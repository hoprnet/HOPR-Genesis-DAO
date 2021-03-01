import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup, InputLeftAddon
} from "@chakra-ui/react"


export const TokenInput = ({ symbol = "xHOPR", value = 0}) => {
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
    </InputGroup>
  )
}