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
  const [claimable, setClaimable] = useState([]);
  const [web3Modal, setWeb3Modal] = useState();
  const [isLoading, setLoading] = useState(false);
  const [provider, setProvider] = useState();
  const [chainId, setChainId] = useState();
  const [wallet, setWallet] = useState();
  const [address, setAddress] = useState();

  const XDAI_CHAIN_ID = 100;
  const distributor_CONTRACT_ADDRESS =
    "0x987cb736fbfbc4a397acd06045bf0cd9b9defe66";
  const schedules = ["marketing", "bounties"];

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

    const claimable = await Promise.all(
      schedules.map(async (schedule) => {
        const amount = await getClaimable(provider, address, schedule);

        return {
          schedule,
          claimable: amount,
          claimablePretty: ethers.utils.formatEther(amount),
        };
      })
    ).then((list) => list.filter((o) => o.claimable > 0));

    setProvider(provider);
    setChainId(network.chainId);
    setWallet(wallet);
    setAddress(address);
    setBalance(ethers.utils.formatEther(balance));
    setClaimable(claimable);
    console.log(network, balance, wallet, provider);
    setLoading(false);
  };

  const wrongNetwork = chainId !== XDAI_CHAIN_ID;

  return (
    <Container height="100vh">
      <Hero />
      <Main>
        <Text textAlign="center">
          Utility to claim locked <Code>wxHOPR</Code>.
        </Text>

        {!wallet ? null : isLoading ? (
          <Text textAlign="center">Fetching schedules..</Text>
        ) : wrongNetwork ? (
          <Text textAlign="center">Please switch to the xDAI chain.</Text>
        ) : claimable.length === 0 ? (
          <Text textAlign="center">Nothing to claim.</Text>
        ) : (
          claimable.map((o) => {
            return (
              <List spacing={7} my={0}>
                <ListItem>
                  <Claimable
                    name={o.schedule}
                    claimable={o.claimablePretty}
                    onClick={() => claim(provider, o.schedule)}
                  />
                </ListItem>
              </List>
            );
          })
        )}

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
