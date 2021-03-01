import {
  Link as ChakraLink,
  Text,
  Code,
  List,
  ListItem,
} from '@chakra-ui/react'
import { CheckCircleIcon, LinkIcon } from '@chakra-ui/icons'
import { useState } from "react";

import { Hero } from '../components/Hero'
import { Container } from '../components/Container'
import { ConnectWallet } from '../components/ConnectWallet'
import { Main } from '../components/Main'
import { TokenInput } from '../components/TokenInput'
import { DarkModeSwitch } from '../components/DarkModeSwitch'


const Index = () => {
  const [balance, setBalance] = useState(0);
  const [xHOPRBalance, setxHOPRBalance] = useState(0);
  const [wxHOPRBalance, setwxHOPRBalance] = useState(0);

  return (<Container height="100vh">
    <Hero />
    <Main>
      <Text>
        Utility to wrap <Code>(xHOPR -> wxHOPR)</Code> and unwrap <Code>(wxHOPR -> xHOPR)</Code> xHOPR tokens.
      </Text>

      <List spacing={3} my={0}>
        <ListItem>
          <TokenInput symbol="_xHOPR" value={xHOPRBalance} />
        </ListItem>
        <ListItem>
          <TokenInput symbol="wxHOPR" value={wxHOPRBalance} />
        </ListItem>
      </List>
      <ConnectWallet
        setBalance={setBalance}
        setxHOPRBalance={setxHOPRBalance}
        setwxHOPRBalance={setwxHOPRBalance}
      />
    </Main>
    <DarkModeSwitch />
  </Container>);
}

export default Index
