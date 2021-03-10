import { Text, Code, List, ListItem } from "@chakra-ui/react";
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
import { UniModal } from "../components/UniModal";

const BLOCK_CONFIRMATION = 3; // default number of blocks for confirmation
const CONTRACT_ADDRESSES = {
  42: {
    network: "Kovan testnet",
    hopr: "0xdE05bB0d847ac6f6128425B1d97654Bc9E94f434",
    pool: "0xc2A11f70FFFbc9D18954bc3742DC2eF57d9f74a8",
    farm: "0x6Ce47b960dFB4121709f07a1459DD52F34647e97"
  }, 
  1: {
    network: "Ethereum mainnet",
    hopr: "0xf5581dfefd8fb0e4aec526be659cfab1f8c781da",
    pool: "0x92c2fc5f306405eab0ff0958f6d85d7f8892cf4d",
    farm: "0x" // TODO: Update when farm is deployed on mainnet
  }
};

const tokenABI = ["function balanceOf(address) view returns (uint)"];
const poolABI = ["function allowance(address owner, address spender) view returns (uint256)"];
const farmABI = ["function incentiveToBeClaimed(address provider) public view returns (uint256)"];

const Index = () => {
  const [web3Modal, setWeb3Modal] = useState();
  const [isLoading, setLoading] = useState(false);
  
  const [provider, setProvider] = useState();
  const [chainId, setChainId] = useState();

  const [address, setAddress] = useState();

  const [hoprBalance, setHoprBalance] = useState(0);
  const [seedBalance, setSeedBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [virtualEarning, setVirtualEarning] = useState(0);

  const [hoprAddress, setHoprAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [farmAddress, setFarmAddress] = useState("");

  const updateUserData = async () => {
    setLoading(true);
    if (CONTRACT_ADDRESSES.hasOwnProperty(chainId)) {
      const hoprAddress = CONTRACT_ADDRESSES[chainId].hopr;
      const poolAddress = CONTRACT_ADDRESSES[chainId].pool;
      const farmAddress = CONTRACT_ADDRESSES[chainId].farm; 
      // update addressees
      setHoprAddress(hoprAddress)
      setPoolAddress(poolAddress)
      setFarmAddress(farmAddress)
  
      // update hopr/pool/seed balance
      const tokenContracts = [hoprAddress, poolAddress].map(tokenAddress => new ethers.Contract(tokenAddress, tokenABI, provider));
      const [hoprBalance, seedBalance] = await Promise.all(tokenContracts.map(async (contract) => contract.balanceOf(address)))

      setHoprBalance(hoprBalance)
      setSeedBalance(seedBalance)
  
      try {
        // update allowance
        const poolContract = new ethers.Contract(poolAddress, poolABI, provider)
        const allowance = await poolContract.allowance(address, farmAddress);
        setAllowance(allowance)
      } catch (error) {
        setAllowance(0)
      }
  
      try {
        // update farm contract
        const farmContract = new ethers.Contract(farmAddress, farmABI, provider);
        const virtualEarning = await farmContract.incentiveToBeClaimed(address);
        setVirtualEarning(virtualEarning)
      } catch (error) {
        setVirtualEarning(0)
      }
  
    }
    setLoading(false);
  };

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

  const claimAndClose = async (provider, virtualEarning) => {
    const farmAbi = ['function claimAndClose()'];
    const farmContract = new ethers.Contract(
      farmAddress,
      farmAbi,
      provider.getSigner()
    ) 
    if (virtualEarning.gt(ethers.constants.Zero)) {
      // need to claim earnings and close farm
      const claimTx =await farmContract.claimAndClose();
      await provider.waitForTransaction(claimTx.hash, BLOCK_CONFIRMATION);
    }
  };

  // trigger on initial load
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

  // trigger once user/contract address changes
  useEffect(() => {
    if (chainId && address) updateUserData();
  }, [chainId, address]);


  const handleConnectWeb3 = async() => {
    setLoading(true)

    const modalProvider = await web3Modal.connect();
    const web3Provider = new Web3(modalProvider);
    const provider = new ethers.providers.Web3Provider(
      web3Provider.currentProvider,
    );

    modalProvider.on("accountsChanged", (accounts) => setAddress(accounts[0]));
    modalProvider.on("chainChanged", (_chainId) =>
      setProvider(new ethers.providers.Web3Provider(
        web3Provider.currentProvider,
      ))
    );
    
    setProvider(provider);
    setLoading(false)
  }

  return (<Container height="100vh">
    <Hero />
    <Main>
      <Text>
        Utility for HOPR-DAI liquidity mining on Uniswap. Deposit (Plant) Uniswap HOPR-DAI liquidity tokens (<Code>UNI-V2</Code>) to claim (harvest) HOPR tokens.
      </Text>
      <ConnectWallet
        address={address}
        onClick={handleConnectWeb3}
        isLoading={isLoading}
        network={CONTRACT_ADDRESSES.hasOwnProperty(chainId) ? CONTRACT_ADDRESSES[chainId].network : "wrong network"}
      />
      <UniModal onClose={updateUserData} highlight={provider ? true : false}/>
      <List spacing={3} my={0}>
        <ListItem>
          <TokenInput symbol="Plant" address={address} value={ethers.utils.formatEther(seedBalance)} setValue={setSeedBalance} handleSwap={() => approveAndFarm(provider, seedBalance, allowance)} />
        </ListItem>
        <ListItem>
          <TokenInput symbol="Harvest" address={address} displayOnly={true} value={ethers.utils.formatEther(virtualEarning)} handleSwap={() => claimAndClose(provider, virtualEarning)} />
        </ListItem>
      </List>

    </Main>
    <DarkModeSwitch />
  </Container>);
}

export default Index
