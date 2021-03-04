import { Button, useColorMode } from '@chakra-ui/react'

export const ActionButton = (props) => {
  const { onClick, children, isLoading } = props;
  const {colorMode} = useColorMode()

  const bgColor = { light: 'rgb(0, 0, 80, 0.8)', dark: 'rgb(255,255,160,0.8)' }
  const hoverBgColor = { light: 'rgb(0, 0, 80)', dark: 'rgb(255,255,160)' }
  const color = { light: 'white', dark: '#414141' }

  return (
    <Button
      onClick={onClick}
      width="100%"
      variant="solid"
      variantcolor="green"
      bg={bgColor[colorMode]}
      color={color[colorMode]}
      _hover={{ bg: hoverBgColor[colorMode] }}
      isLoading={isLoading}
      {...props}
    >
      {children}
    </Button>
  )
}