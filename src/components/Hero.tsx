import { Flex, Heading } from '@chakra-ui/react'

export const Hero = ({ title, children }: { title: string, children: any }) => (
  <Flex justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
    <Heading fontSize="6vw">{title}</Heading>
    { children }
  </Flex>
)

Hero.defaultProps = {
  title: 'Am I in the HOPR Genesis DAO?',
}
