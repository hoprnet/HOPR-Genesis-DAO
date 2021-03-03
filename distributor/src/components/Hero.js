import { Flex, Heading } from "@chakra-ui/react";

export const Hero = ({ title }) => (
  <Flex
    justifyContent="center"
    alignItems="center"
    mt="4rem"
    min-height="100vh"
  >
    <Heading fontSize="6vw">{title}</Heading>
  </Flex>
);

Hero.defaultProps = {
  title: "Hopr Distributor",
};
