import Head from "next/head";
import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'

import theme from '../theme'
import { Fonts } from "../fonts"


function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Hopr Wrapper</title>
      </Head>
      <ChakraProvider resetCSS theme={theme}>
        <Fonts />
        <ColorModeProvider
          options={{
            useSystemColorMode: true,
          }}
        >
          <Component {...pageProps} />
        </ColorModeProvider>
      </ChakraProvider>
    </>
  )
}

export default MyApp
