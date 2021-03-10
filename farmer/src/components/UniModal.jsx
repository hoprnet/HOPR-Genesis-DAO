import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button,
  useColorMode,
  AspectRatio,
  useDisclosure
} from "@chakra-ui/react"

export const UniModal = ({highlight}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {colorMode} = useColorMode()

  const bgColorModal = { light: 'rgb(246, 246, 248)', dark: 'rgb(44, 47, 53)' }
  const bgColor = { light: 'rgb(0, 0, 80, 0.8)', dark: 'rgb(255,255,160,0.8)' }
  const hoverBgColor = { light: 'rgb(0, 0, 80)', dark: 'rgb(255,255,160)' }
  const modalColor = { light: '#414141', dark: 'white' }
  const color = { light: 'white', dark: '#414141' }

  return (
    <>
      <Button onClick={onOpen} bg={highlight? bgColor[colorMode] : null} color={highlight? color[colorMode] : null}> Become a liquidity provider</Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={bgColorModal[colorMode]} color={modalColor[colorMode]} mt={7} mb={0}>
          <ModalHeader>Add liquidity on Uniswap</ModalHeader>
          <ModalBody>
            <AspectRatio ratio={3/4}>
              <iframe
                title="uniswap-add-liquidity"
                src="https://app.uniswap.org/#/add/0x6B175474E89094C44Da98b954EedeAC495271d0F/0xF5581dFeFD8Fb0e4aeC526bE659CFaB1f8c781dA"
                allowFullScreen
              />
            </AspectRatio>
          </ModalBody>

          <ModalFooter>
            <Button bg={bgColor[colorMode]} color={color[colorMode]} mr={3} onClick={onClose}>
              Return to Farm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}