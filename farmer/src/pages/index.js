import { Text, Code, List, ListItem, Link } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Web3 from 'web3';
import { BigNumber, constants, ethers } from "ethers";
import Fortmatic from "fortmatic";

import { Hero } from '../components/Hero'
import { Container } from '../components/Container'
import { ConnectWallet } from '../components/ConnectWallet'
import { Main } from '../components/Main'
import { TokenInput } from '../components/TokenInput'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { UniModal } from "../components/UniModal";
import { DEFAULT_COUNTDOWN, TOTAL_CLAIM_PERIOD, WEEKLY_BLOCK_NUMBER, ProgressBar } from "../components/ProgressBar";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import useRecursiveTimeout from "../lib/recursiveTimeout";

const BLOCK_CONFIRMATION = 3; // default number of blocks for confirmation
const TEN_MINUTE_MS = 600000;
const CONTRACT_ADDRESSES = {
  1: {
    networkName: "Ethereum",
    networkType: "mainnet",
    hopr: "0xf5581dfefd8fb0e4aec526be659cfab1f8c781da",
    pool: "0x92c2fc5f306405eab0ff0958f6d85d7f8892cf4d",
    farm: "0x2fc0e2cfe5d6ea300d555e5907319a5f7e09884f",
    startBlock: 12141500
  }
};

const tokenABI = ["function balanceOf(address) view returns (uint)"];
const poolABI = ["function allowance(address owner, address spender) view returns (uint256)", "function nonces(address owner) view returns(uint256)", "function approve(address spender, uint value) external returns (bool)"];
const farmABI = [
  "function incentiveToBeClaimed(address provider) public view returns (uint256)",
  "function openFarmWithPermit(uint256 amount, address owner, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  "function openFarm(uint256 amount)",
  "function claimFor(address provider)",
  "function claimAndClose()",
  "function closeFarm(uint256 amount)",
  "function liquidityProviders(address provider) view returns (tuple(uint256 claimedUntil, uint256 currentBalance) liquidityProviders)",
  "function distributionBlocks(uint256) view returns(uint256)"
];

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
  const [currentStake, setCurrentStake] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [nextPeriodCountdown, setNextPeriodCountdown] = useState(DEFAULT_COUNTDOWN);

  const [hoprAddress, setHoprAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [farmAddress, setFarmAddress] = useState("");

  const [waitForPlant, setWaitForPlant] = useState(false);
  const [waitForHarvest, setWaitForHarvest] = useState(false);
  const [waitForDestroy, setWaitForDestroy] = useState(false);

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
        const currentStakeTuple = await farmContract.liquidityProviders(address);
        setVirtualEarning(virtualEarning)
        setCurrentStake(currentStakeTuple[1])
        await updatePeriod();
      } catch (error) {
        setVirtualEarning(0)
        setCurrentStake(0)
      }
  
    }
    setLoading(false);
  };

  const approveAndFarm = async (provider, seedBalance, allowance) => {
    setWaitForPlant(true);
    const farmContract = new ethers.Contract(
      farmAddress,
      farmABI,
      provider.getSigner()
    ); 
    const amount = ethers.BigNumber.isBigNumber(seedBalance) ? seedBalance : ethers.utils.parseUnits(seedBalance);
    if (amount.lte(allowance)) {
      // call `openFarm` to stake tokens to the farm
      const tx = await farmContract.openFarm(amount);
      // wait for 3 block
      await provider.waitForTransaction(tx.hash, BLOCK_CONFIRMATION);
      setWaitForPlant(false);
    } else {
      // if approve is needed, call `openFarmWithPermit`
      // // prepare signature, assuming prospective LP wants to stake all of their UNI tokens.
      const poolContract = new ethers.Contract(
        poolAddress,
        poolABI,
        provider.getSigner()
      ); 
      const nonce = await poolContract.nonces(address);
      const deadline = Math.floor(Date.now()/1000 + 360); // 6 min timeout
      const msgParams = {
        domain: {
          chainId,
          name: "Uniswap V2",
          verifyingContract: poolAddress,
          version: '1',
        },
        message: {
          owner: address,
          spender: farmAddress,
          value: amount.toString(),
          nonce: nonce.toString(),
          deadline
        },
        primaryType: 'Permit',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ]
        }
      }
      try {
        const rawSig = await provider.send("eth_signTypedData_v4", [address, JSON.stringify(msgParams)]);
        const {v, r, s} = ethers.utils.splitSignature(rawSig);

        // prepare `openFarmWithPermit`
        const tx = await farmContract.openFarmWithPermit(amount, address, deadline, v, r, s)
        // wait for 3 block
        await provider.waitForTransaction(tx.hash, BLOCK_CONFIRMATION);
      } catch (error) {
        console.log(error)
        // ledger does not support signing typed data through MM. Two tx: approve and openFarm
        // approve UNI token transfer
        const approveTx = await poolContract.approve(farmAddress, amount);
        await provider.waitForTransaction(approveTx.hash, BLOCK_CONFIRMATION);
        const openFarmTx = await farmContract.openFarm(amount);
        // wait for 3 block
        await provider.waitForTransaction(openFarmTx.hash, BLOCK_CONFIRMATION);
      }
      setWaitForPlant(false);
    }
  };

  const claimOnly = async (provider, virtualEarning) => {
    setWaitForHarvest(true);
    const farmContract = new ethers.Contract(
      farmAddress,
      farmABI,
      provider.getSigner()
    ) 
    if (virtualEarning.gt(ethers.constants.Zero)) {
      // need to claim earnings and close farm
      const claimTx =await farmContract.claimFor(address);
      await provider.waitForTransaction(claimTx.hash, BLOCK_CONFIRMATION);
    }
    setWaitForHarvest(false);
  };

  const claimAndClose = async (provider, currentStake) => {
    setWaitForDestroy(true);
    const farmContract = new ethers.Contract(
      farmAddress,
      farmABI,
      provider.getSigner()
    ) 
    if (currentStake.gt(ethers.constants.Zero)) {
      // need to claim earnings, if applicable, and close farm
      const claimTx = virtualEarning.gt(ethers.constants.Zero) ? await farmContract.claimAndClose() : await farmContract.closeFarm(currentStake);
      await provider.waitForTransaction(claimTx.hash, BLOCK_CONFIRMATION);
    }
    setWaitForDestroy(false);
  };

  // trigger on initial load
  useEffect(() => {
    const loadModal = () => {
      const _web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {
          fortmatic: {
            package: Fortmatic, // required
            options: {
                key: "pk_live_AB45EC6FDFB1C5C5" // required
            }
          },
        }
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

  // trigger once tx is mined
  useEffect(() => {
    if (!waitForPlant && chainId && address) updateUserData();
  }, [waitForPlant]);
  useEffect(() => {
    if (!waitForHarvest && chainId && address) updateUserData();
  }, [waitForHarvest]);
  useEffect(() => {
    if (!waitForDestroy && chainId && address) updateUserData(); 
  }, [waitForDestroy]);

  const handleConnectWeb3 = async() => {
    setLoading(true)

    const modalProvider = await web3Modal.connect();
    const web3Provider = new Web3(modalProvider);
    const provider = new ethers.providers.Web3Provider(
      web3Provider.currentProvider,
    );

    if (modalProvider !== null && modalProvider.on) {
      modalProvider.on("accountsChanged", (accounts) => setAddress(accounts[0]));
      modalProvider.on("chainChanged", (_chainId) =>
        setProvider(new ethers.providers.Web3Provider(
          web3Provider.currentProvider,
        ))
      );
    }
    
    setProvider(provider);
    setLoading(false)
  }

  const updatePeriod = async() => {
    if (CONTRACT_ADDRESSES.hasOwnProperty(chainId)) {
      const {startBlock} = CONTRACT_ADDRESSES[chainId]
      // calculate currentPeriod and countdown to next period
      const currentBlockNumber = await provider.getBlockNumber();
      const currentPeriod = currentBlockNumber <= startBlock ? 0 : Math.floor((currentBlockNumber - startBlock - 1)/WEEKLY_BLOCK_NUMBER) + 1;
      const nextPeriodCountdown = currentPeriod > TOTAL_CLAIM_PERIOD ? 0 : startBlock + currentPeriod * WEEKLY_BLOCK_NUMBER - currentBlockNumber + 1
  
      setCurrentPeriod(currentPeriod)
      setNextPeriodCountdown(nextPeriodCountdown)
    }
  }

  useRecursiveTimeout(() => updatePeriod(), TEN_MINUTE_MS);

  return (<Container height="100vh">
    <Hero />
    <Main>
      <Text mb={3}>
        Utility for HOPR-DAI liquidity mining on Uniswap. Deposit (plant) Uniswap HOPR-DAI liquidity tokens (
          <Link href="https://etherscan.io/token/0x92c2fc5f306405eab0ff0958f6d85d7f8892cf4d" isExternal>
            <Code>UNI-V2</Code><ExternalLinkIcon mx="2px" />
          </Link>) to claim (harvest) <Link 
            href="https://etherscan.io/token/0xf5581dfefd8fb0e4aec526be659cfab1f8c781da" isExternal>
            <Code>HOPR</Code><ExternalLinkIcon mx="2px" />
          </Link>tokens.
      </Text>
      <ConnectWallet
        address={address}
        onClick={handleConnectWeb3}
        isLoading={isLoading}
        networkName={CONTRACT_ADDRESSES.hasOwnProperty(chainId) ? CONTRACT_ADDRESSES[chainId].networkName : "wrong"}
        networkType={CONTRACT_ADDRESSES.hasOwnProperty(chainId) ? CONTRACT_ADDRESSES[chainId].networkType : "network"}
      >
        <ProgressBar currentPeriod={currentPeriod} countdown={nextPeriodCountdown} rightChain={CONTRACT_ADDRESSES.hasOwnProperty(chainId)}/>
      </ConnectWallet>
      <UniModal onClose={updateUserData} highlight={provider ? true : false}/>
      <List spacing={3} my={0}>
        <ListItem>
          <TokenInput 
            symbol="Plant"
            action="Stake UNI-V2"
            address={address}
            value={seedBalance ? ethers.BigNumber.isBigNumber(seedBalance) ? ethers.utils.formatEther(seedBalance) : ethers.utils.formatEther(ethers.utils.parseUnits(seedBalance)) : "0"}
            setValue={setSeedBalance}
            handleSwap={() => approveAndFarm(provider, seedBalance, allowance)}
            waiting={waitForPlant}
          />
        </ListItem>
        <ListItem>
          <TokenInput 
            symbol="Harvest" 
            action="Claim HOPR"
            address={address} 
            displayOnly={true} 
            value={ethers.utils.formatEther(virtualEarning)}
            handleSwap={() => claimOnly(provider, virtualEarning)}
            waiting={waitForHarvest}
          />
        </ListItem>
        <ListItem>
          <TokenInput 
            symbol="Destroy"
            action="Withdraw UNI-V2"
            address={address} 
            displayOnly={true} 
            value={ethers.utils.formatEther(currentStake)}
            handleSwap={() => claimAndClose(provider, currentStake)}
            waiting={waitForDestroy}
          />
        </ListItem>    
      </List>

    </Main>
    <DarkModeSwitch />
  </Container>);
}

export default Index
