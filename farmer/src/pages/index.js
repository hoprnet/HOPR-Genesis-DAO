import {
  Link as ChakraLink,
  Text,
  Code,
  List,
  ListItem,
} from '@chakra-ui/react'
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

const BLOCK_CONFIRMATION = 3; // default number of blocks for confirmation

const Index = () => {
  const [balance, setBalance] = useState(0);
  const [hoprBalance, setHoprBalance] = useState(0);
  const [seedBalance, setSeedBalance] = useState(0);
  const [poolBalance, setPoolBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [virtualEarning, setVirtualEarning] = useState(0);

  const [hoprAddress, setHoprAddress] = useState("0xf5581dfefd8fb0e4aec526be659cfab1f8c781da");
  const [poolAddress, setPoolAddress] = useState("0x92c2fc5f306405eab0ff0958f6d85d7f8892cf4d");
  const [farmAddress, setFarmAddress] = useState("0x");

  const [web3Modal, setWeb3Modal] = useState();
  const [isLoading, setLoading] = useState(false);
  const [provider, setProvider] = useState();
  const [wallet, setWallet] = useState();
  const [address, setAddress] = useState();

  const approveAndFarm = async (provider, amount, allowance) => {
    if (amount.gt(allowance)) {
      // if approve is needed
      const poolAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
      const poolContract = new ethers.Contract(
        poolAddress,
        poolAbi,
        provider.getSigner(),
      );
      // Not doing increaseAllowance, but full speed to max uin256 instead.
      const approveTx = await poolContract.approve(farmAddress, ethers.constants.MaxUint256.toString());
      // wait for 3 block
      await provider.waitForTransaction(approveTx.hash, BLOCK_CONFIRMATION);
    }
    // stake tokens to the pool
    const farmAbi = ["function openFarm(uint256 amount)"]
    const farmContract = new ethers.Contract(
      farmAddress,
      farmAbi,
      provider.getSigner()
    )
    const tx = await farmContract.openFarm(amount);
    // wait for 3 block
    await provider.waitForTransaction(tx.hash, BLOCK_CONFIRMATION);
  };

  const claimAndClose = async (provider, amount, virtualEarning) => {
    const farmAbi = ['function claimFor(address provider)', "function closeFarm(uint256 amount)"];
    const farmContract = new ethers.Contract(
      farmAddress,
      farmAbi,
      provider.getSigner()
    ) 
    if (potentialEarning.gt(ethers.constants.Zero)) {
      // need to claim earnings
      const claimTx =await farmContract.claimFor(liquidityProviderAddress);
      await provider.waitForTransaction(claimTx.hash, BLOCK_CONFIRMATION);
    }
    // close farm  
    const tx = await farmContract.closeFarm(amount);
    return provider.waitForTransaction(tx.hash, BLOCK_CONFIRMATION);
  };

  useEffect(() => {
    const loadModal = () => {
      const _web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {}
      });
      setWeb3Modal(_web3Modal)
    }
    loadModal()
  }, [])

  //@TODO: Refactor to a proper Web3Context
  const handleConnectWeb3 = async() => {
    setLoading(true)

    const modalProvider = await web3Modal.connect();
    const web3Provider = new Web3(modalProvider);
    const provider = new ethers.providers.Web3Provider(
      web3Provider.currentProvider,
    );

    const wallet = provider.getSigner();
    const address = await wallet.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    const hoprAddress = network === undefined || network.chainId === 42 ? "0xdE05bB0d847ac6f6128425B1d97654Bc9E94f434" : "0xf5581dfefd8fb0e4aec526be659cfab1f8c781da";
    const poolAddress = network === undefined || network.chainId === 42 ? "0xc2A11f70FFFbc9D18954bc3742DC2eF57d9f74a8" : "0x92c2fc5f306405eab0ff0958f6d85d7f8892cf4d";
    const farmAddress = network === undefined || network.chainId === 42 ? "0x6Ce47b960dFB4121709f07a1459DD52F34647e97" : "0x"; // TODO: Update when farm is deployed on mainnet
    
    const tokenAddresses = [hoprAddress, poolAddress]

    const tokenABI = ["function balanceOf(address) view returns (uint)"]

    const tokenContracts = tokenAddresses.map(tokenAddress => new ethers.Contract(tokenAddress, tokenABI, provider));
    const [hoprBalance, poolBalance] = await Promise.all(tokenContracts.map(async (contract) => contract.balanceOf(address)))
    const seedBalance = poolBalance;

    const poolABI = ["function allowance(address owner, address spender) view returns (uint256)"]
    const poolContract = new ethers.Contract(poolAddress, poolABI, provider)
    const allowance = await poolContract.allowance(address, farmAddress);

    const farmABI = ["function incentiveToBeClaimed(address provider) public view returns (uint256)"];
    const farmContract = new ethers.Contract(farmAddress, farmABI, provider);
    const virtualEarning = await farmContract.incentiveToBeClaimed(address);

    setProvider(provider);
    setWallet(wallet);
    setAddress(address);
    setBalance(balance)
    setHoprBalance(hoprBalance)
    setSeedBalance(seedBalance)
    setPoolBalance(poolBalance)
    setAllowance(allowance)
    setVirtualEarning(virtualEarning)
    setHoprAddress(hoprAddress)
    setPoolAddress(poolAddress)
    setFarmAddress(farmAddress)
    console.log(network, balance, wallet, provider);
    setLoading(false)
  }

  return (<Container height="100vh">
    <Hero />
    <Main>
      <Text>
        Utility for HOPR-DAI liquidity mining on Uniswap. Deposit (Plant) Uniswap HOPR-DAI liquidity tokens (<Code>UNI-V2</Code>) to claim (harvest) HOPR tokens.
      </Text>
      <List spacing={3} my={0}>
        <ListItem>
          <TokenInput symbol="Plant" address={address} value={ethers.utils.formatEther(seedBalance)} setValue={setSeedBalance} handleSwap={() => approveAndFarm(provider, seedBalance, allowance)} />
        </ListItem>
        <ListItem>
          <TokenInput symbol="Harvest" address={address} displayOnly={true} value={ethers.utils.formatEther(virtualEarning)} handleSwap={() => claimAndClose(provider, poolBalance, virtualEarning)} />
        </ListItem>
      </List>
      <ConnectWallet
        address={address}
        onClick={handleConnectWeb3}
        isLoading={isLoading}
      />
    </Main>
    <DarkModeSwitch />
  </Container>);
}

export default Index
