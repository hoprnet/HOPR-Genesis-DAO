# Example app with [chakra-ui](https://github.com/chakra-ui/chakra-ui)

This example features how to use [chakra-ui](https://github.com/chakra-ui/chakra-ui) as the component library within a Next.js app.

We are connecting the Next.js `_app.js` with `chakra-ui`'s Theme and ColorMode containers so the pages can have app-wide dark/light mode. We are also creating some components which shows the usage of `chakra-ui`'s style props.

## Deploy your own

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=next-example):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/next.js/tree/canary/examples/with-chakra-ui&project-name=with-chakra-ui&repository-name=with-chakra-ui)

## How to use

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init) or [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) to bootstrap the example:

```bash
npx create-next-app --example with-chakra-ui with-chakra-ui-app
# or
yarn create next-app --example with-chakra-ui with-chakra-ui-app
```

Deploy it to the cloud with [Vercel](https://vercel.com/new?utm_source=github&utm_medium=readme&utm_campaign=next-example) ([Documentation](https://nextjs.org/docs/deployment)).

## Farm

### Plant
1. If allowance is not enough, it calls `approve` function on the pool token contract, to allow the "farm contract" to move tokens for the signer
2. It calls `openFarm` function

### Harvest
1. It claims for all the possible incentives for the signer with `claimFor`.
2. It closes entirely the farm for the signer, by calling `closeFarm`.

### Relavant contracts
#### Kovan
1. Pool: [0xc2A11f70FFFbc9D18954bc3742DC2eF57d9f74a8](https://kovan.etherscan.io/address/0xc2A11f70FFFbc9D18954bc3742DC2eF57d9f74a8)
2. Hopr: [0xdE05bB0d847ac6f6128425B1d97654Bc9E94f434](https://kovan.etherscan.io/address/0xdE05bB0d847ac6f6128425B1d97654Bc9E94f434)
3. Multisig: [0xcefFa80ba3A32B165727EcaFcC670018276d1F2B](https://kovan.etherscan.io/address/0xcefFa80ba3A32B165727EcaFcC670018276d1F2B)
4. Farm: [0x6Ce47b960dFB4121709f07a1459DD52F34647e97](https://kovan.etherscan.io/address/0x6Ce47b960dFB4121709f07a1459DD52F34647e97)

#### Source code
- `Farm`: 
    - [Original source code](https://github.com/hoprnet/hopr-farm/blob/main/contracts/HoprFarm.sol) 
    - [Mock contract for test](https://gist.github.com/QYuQianchen/89fc15aa4dcc4d3694ced81861387405) Can be directly copied to Remix and change parameters.
- `Pool`:
    - [Original source code](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol) 
    - [Mock contract for test](https://gist.github.com/QYuQianchen/4590022a302027222afb937205b7f45d) One can call `mint100ForSelf` to get some test liquidity tokens. 