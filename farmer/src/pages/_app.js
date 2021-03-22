import Head from "next/head";
import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'

import theme from '../styles/theme'
import { Fonts } from "../styles/fonts"


function MyApp({ Component, pageProps }) {
  return (
    <>
    <Head>
      <title>Hopr Farm</title>
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
