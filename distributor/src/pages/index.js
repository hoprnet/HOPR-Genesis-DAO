import {
  Link as ChakraLink,
  Text,
  Code,
  List,
  ListItem,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Web3 from "web3";
import { ethers } from "ethers";

import { Hero } from "../components/Hero";
import { Container } from "../components/Container";
import { ConnectWallet } from "../components/ConnectWallet";
import { Main } from "../components/Main";
import { Claimable } from "../components/Claimable";
import { DarkModeSwitch } from "../components/DarkModeSwitch";

const Index = () => {
  const [balance, setBalance] = useState(0);
  const [bountiesClaimable, setBountiesClaimable] = useState(0);
  const [marketingClaimable, setMarketingClaimable] = useState(0);
  const [web3Modal, setWeb3Modal] = useState();
  const [isLoading, setLoading] = useState(false);
  const [provider, setProvider] = useState();
  const [wallet, setWallet] = useState();
  const [address, setAddress] = useState();

  const distributor_CONTRACT_ADDRESS =
    "0xa1e1E79eA9F39a7Cc82894629C49D6FDF70F0061";

  const getClaimable = async (provider, account, scheduleName) => {
    const abi = [
      "function getClaimable(address, string) view returns (uint256)",
    ];

    const distributorContract = new ethers.Contract(
      distributor_CONTRACT_ADDRESS,
      abi,
      provider.getSigner()
    );

    try {
      return await distributorContract.getClaimable(account, scheduleName);
    } catch (err) {
      return 0;
    }
  };

  const claim = async (provider, scheduleName) => {
    const abi = ["function claim(string)"];

    const distributorContract = new ethers.Contract(
      distributor_CONTRACT_ADDRESS,
      abi,
      provider.getSigner()
    );

    return distributorContract.claim(scheduleName);
  };

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

  //@TODO: Refactor to a proper Web3Context
  const handleConnectWeb3 = async () => {
    setLoading(true);

    const modalProvider = await web3Modal.connect();
    const web3Provider = new Web3(modalProvider);
    const provider = new ethers.providers.Web3Provider(
      web3Provider.currentProvider
    );

    const wallet = provider.getSigner();
    const address = await wallet.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    const claimable = await Promise.all([
      getClaimable(provider, address, "bounties"),
      getClaimable(provider, address, "marketing"),
    ]);

    setProvider(provider);
    setWallet(wallet);
    setAddress(address);
    setBalance(ethers.utils.formatEther(balance));
    setBountiesClaimable(ethers.utils.formatEther(claimable[0]));
    setMarketingClaimable(ethers.utils.formatEther(claimable[1]));
    console.log(network, balance, wallet, provider);
    setLoading(false);
  };

  return (
    <Container height="100vh">
      <Hero />
      <Main>
        <Text textAlign="center">
          Utility to claim locked <Code>wxHOPR</Code>.
        </Text>
        <List spacing={7} my={0}>
          <ListItem>
            <Claimable
              name="bounties"
              claimable={bountiesClaimable}
              onClick={() => claim(provider, "bounties")}
            />
          </ListItem>
          <ListItem>
            <Claimable
              name="marketing"
              claimable={marketingClaimable}
              onClick={() => claim(provider, "marketing")}
            />
          </ListItem>
        </List>
        <ConnectWallet
          address={address}
          onClick={handleConnectWeb3}
          isLoading={isLoading}
        />
      </Main>
      <DarkModeSwitch />
    </Container>
  );
};

export default Index;
