import {
  Link,
  Text,
  Code,
  List,
  ListItem,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Web3 from 'web3';
import { ethers } from "ethers";

import { Hero } from '../components/Hero'
import { Container } from '../components/Container'
import { ConnectWallet } from '../components/ConnectWallet'
import { Main } from '../components/Main'
import { TokenInput } from '../components/TokenInput'
import { DarkModeSwitch } from '../components/DarkModeSwitch'


const Index = () => {
  const [web3Modal, setWeb3Modal] = useState();
  const [isLoading, setLoading] = useState(false);
  const [provider, setProvider] = useState();
  const [chainId, setChainId] = useState();
  const [address, setAddress] = useState();
  const [txHash, setTxHash] = useState();
  const [xHOPRBalance, setxHOPRBalance] = useState(0);
  const [wxHOPRBalance, setwxHOPRBalance] = useState(0); 

  const XDAI_CHAIN_ID = 100;
  const xHOPR_TOKEN_ADDRESS = "0xD057604A14982FE8D88c5fC25Aac3267eA142a08";
  const wrapper_CONTRACT_ADDRESS = "0x097707143e01318734535676cfe2e5cF8b656ae8";
  const wxHOPR_TOKEN_ADDRESS = "0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1";
  const tokenAddresses = [xHOPR_TOKEN_ADDRESS, wxHOPR_TOKEN_ADDRESS]
  const ERC20_balanceOf_ABI = [
    "function balanceOf(address) view returns (uint)",
  ]

  const transferAndCallToken = async (provider, amount) => {
    const abi = ['function transferAndCall(address, uint256, bytes)'];
    const tokenContract = new ethers.Contract(
      xHOPR_TOKEN_ADDRESS,
      abi,
      provider.getSigner(),
    );
    return tokenContract.transferAndCall(wrapper_CONTRACT_ADDRESS, ethers.utils.parseEther(amount), '0x');
  };

  const transferToken = async (provider, amount) => {
    const abi = ['function transfer(address, uint256)'];
    const tokenContract = new ethers.Contract(
      wxHOPR_TOKEN_ADDRESS,
      abi,
      provider.getSigner(),
    )    
    return tokenContract.transfer(wrapper_CONTRACT_ADDRESS, ethers.utils.parseEther(amount));
  };

  // trigger on initial load
  useEffect(() => {
    const loadModal = () => {
      const _web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {},
      });
      setWeb3Modal(_web3Modal);
    };
    loadModal();
  }, []);

  // trigger once provider is set
  useEffect(() => {
    const updateProviderData = async () => {
      setLoading(true);

      const network = await provider.getNetwork();
      const address = await provider.getSigner().getAddress();

      setChainId(network.chainId);
      setAddress(address);
      setLoading(false);
    };

    if (provider) updateProviderData();
  }, [provider]);

  // trigger once chain or address changes
  useEffect(() => {
    const updateUserData = async () => {
      setLoading(true);

      const tokenContracts = tokenAddresses.map(tokenAddress => new ethers.Contract(tokenAddress, ERC20_balanceOf_ABI, provider));
      const [xHOPRBalance, wxHOPRBalance] = await Promise.all(tokenContracts.map(async (contract) => {
        try {
          return await contract.balanceOf(address)
        } catch {
          return 0
        }
      }))

      setxHOPRBalance(ethers.utils.formatEther(xHOPRBalance))
      setwxHOPRBalance(ethers.utils.formatEther(wxHOPRBalance))
      setLoading(false);
    };

    if (chainId && address) updateUserData();
  }, [chainId, address, txHash]);

  const handleConnectWeb3 = async () => {
    setLoading(true);

    const modalProvider = await web3Modal.connect();
    const web3Provider = new Web3(modalProvider);
    const provider = new ethers.providers.Web3Provider(
      web3Provider.currentProvider
    );

    modalProvider.on("accountsChanged", (accounts) => setAddress(accounts[0]));
    modalProvider.on("chainChanged", (chainId) =>
      setChainId(parseInt(chainId, 16))
    );

    setProvider(provider);
    setLoading(false);
  };

  const HandleSwap = (swap) => async () => {
    setLoading(true)

    const receipt = await swap()
    setTxHash(receipt.hash)

    setLoading(false)
  }

  const wrongNetwork = chainId !== XDAI_CHAIN_ID;

  return (<Container height="100vh">
    <Hero />
    <Main>
      <Text>
        Utility to wrap <Code>(xHOPR -> wxHOPR)</Code> and unwrap <Code>(wxHOPR -> xHOPR)</Code> xHOPR tokens.
      </Text>
      {
        !address ? null : wrongNetwork ? (
          <Text textAlign="center">Please switch to the xDAI chain.</Text>
        ) : (
          <List spacing={3} my={0}>
            <ListItem>
              <TokenInput symbol="xHOPR" address={address} value={xHOPRBalance} setValue={setxHOPRBalance} handleSwap={HandleSwap(() => transferAndCallToken(provider, xHOPRBalance))} />
            </ListItem>
            <ListItem>
              <TokenInput symbol="wxHOPR" address={address} value={wxHOPRBalance} setValue={setwxHOPRBalance} handleSwap={HandleSwap(() => transferToken(provider, wxHOPRBalance))} />
            </ListItem>
          </List>
        )
      }
      <ConnectWallet
        address={address}
        onClick={handleConnectWeb3}
        isLoading={isLoading}
      />
      {txHash ? (
        <Text>
          Swapping is under way! Check out the transaction progress{" "}
          <Link
            href={`https://blockscout.com/poa/xdai/tx/${txHash}`}
            isExternal
          >
            here <ExternalLinkIcon mx="2px" />
          </Link>
          .
        </Text>
      ) : null}
    </Main>
    <DarkModeSwitch />
  </Container>);
}

export default Index
