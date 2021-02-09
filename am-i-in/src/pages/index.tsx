import {
  Link as ChakraLink,
  Text,
  FormErrorMessage,
  FormControl,
  FormLabel,
  Button,
  Input
} from '@chakra-ui/react'
import { LinkIcon } from '@chakra-ui/icons'

import { Hero } from '../components/Hero'
import { Container } from '../components/Container'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { Formik, Field, Form } from "formik";
import { ethers } from "ethers";


const Index = () => {
  function validateName(value: string) {
    let error
    if (!value) {
      error = "An ethereum address is required"
    }
    return error
  }

  const provider = new ethers.providers.JsonRpcProvider("https://xdai.poanetwork.dev");
  const genesisDAOAddress = "0x67E9540b33f8d8c07169bccA3F1b8f5e6cF6f9F3";

  const genesisDAOABI = [
    "function balanceOf(address) view returns (uint256)",
  ]

  const xdaiContract = new ethers.Contract(genesisDAOAddress, genesisDAOABI, provider);

  return (
    <Container height="100vh">
      <Hero>
        <Text>
          Learn if your address is part of the <ChakraLink
            isExternal
            href="https://hoprnet.org"
            flexGrow={1}
            mr={2}
          >
            Genesis DAO <LinkIcon />
          </ChakraLink>
        </Text>
        <br/>
        <Formik
          initialValues={{ name: "" }}
          onSubmit={(values, actions) => {
            setTimeout(async() => {
              const balance = await xdaiContract.balanceOf(values.name)
              const included = +balance > 0;
              alert(included ? 'You are part of the Genesis DAO' : 'Sorry, you are not part of the Genesis DAO')
              actions.setSubmitting(false)
            }, 0)
          }}
        >
          {(props) => (
            <Form style={{ width: '100%' }}>
              <Field name="name" validate={validateName}>
                {({ field, form }: { field: any, form: any }) => (
                  <FormControl isInvalid={form.errors.name && form.touched.name}>
                    <FormLabel htmlFor="name">Ethereum Address</FormLabel>
                    <Input {...field} id="name" placeholder="0x111..." />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Button
                mt={4}
                colorScheme="teal"
                isLoading={props.isSubmitting}
                type="submit"
              >
                Submit
          </Button>
            </Form>
          )}
        </Formik>

      </Hero>
      <DarkModeSwitch />
    </Container>
  )
}

export default Index
