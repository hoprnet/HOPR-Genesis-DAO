import { Text, Code, List, ListItem, Link } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Web3 from 'web3';
import { BigNumber, constants, ethers } from "ethers";
import { Hero } from '../components/Hero'
import { Container } from '../components/Container'
import { ConnectWallet } from '../components/ConnectWallet'
import { Main } from '../components/Main'
import { TokenInput } from '../components/TokenInput'
import { DarkModeSwitch } from '../components/DarkModeSwitch'
import { UniModal } from "../components/UniModal";
import { DEFAULT_COUNTDOWN, TOTAL_CLAIM_PERIOD, WEEKLY_BLOCK_NUMBER, ProgressBar } from "../components/ProgressBar";
import { ExternalLinkIcon } from "@chakra-ui/icons";

const BLOCK_CONFIRMATION = 3; // default number of blocks for confirmation
const TEN_MINUTE_MS = 600000;
const CONTRACT_ADDRESSES = {
  42: {
    networkName: "Kovan",
    networkType: "testnet",
    hopr: "0xdE05bB0d847ac6f6128425B1d97654Bc9E94f434",
    pool: "0xc2A11f70FFFbc9D18954bc3742DC2eF57d9f74a8",
    farm: "0x713bAdD773A3776C43442be746584d0616c9Ee67"
  }, 
  4: {
    networkName: "Rinkeby",
    networkType: "testnet",
    hopr: "0x3eeEF5e497F3B937724289E4f2254CAFeeCcB994",
    pool: "0xEF25A0fc7A0aFd29579f5e774999c0795d2aa9b9",
    farm: "0x2c7a1e89a5A45Ccfe36a7B16e553d54C87ac2663"
  }, 
  1: {
    networkName: "Ethereum",
    networkType: "mainnet",
    hopr: "0xf5581dfefd8fb0e4aec526be659cfab1f8c781da",
    pool: "0x92c2fc5f306405eab0ff0958f6d85d7f8892cf4d",
    farm: "0x" // TODO: Update when farm is deployed on mainnet
  }
};

const tokenABI = ["function balanceOf(address) view returns (uint)"];
const poolABI = ["function allowance(address owner, address spender) view returns (uint256)", "function nonces(address owner) view returns(uint256)"];
const farmABI = [
  "function incentiveToBeClaimed(address provider) public view returns (uint256)",
  "function openFarmWithPermit(uint256 amount, address owner, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  "function openFarm(uint256 amount)",
  "function claimFor(address provider)",
  "function claimAndClose()",
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
  const [startBlock, setStartBlock] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [nextPeriodCountdown, setNextPeriodCountdown] = useState(DEFAULT_COUNTDOWN);

  const [hoprAddress, setHoprAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [farmAddress, setFarmAddress] = useState("");

  const [waitForPlant, setWaitForPlant] = useState(false);
  const [waitForHarvest, setWaitForHarvest] = useState(false);

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
        const startBlock = (await farmContract.distributionBlocks(0)).toNumber();
        setVirtualEarning(virtualEarning)
        setCurrentStake(currentStakeTuple[1])
        setStartBlock(startBlock)
        await updatePeriod(startBlock);
      } catch (error) {
        setVirtualEarning(0)
        setCurrentStake(0)
        setStartBlock(0)
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
    setWaitForHarvest(true);
    const farmContract = new ethers.Contract(
      farmAddress,
      farmABI,
      provider.getSigner()
    ) 
    if (currentStake.gt(ethers.constants.Zero)) {
      // need to claim earnings and close farm
      const claimTx =await farmContract.claimAndClose();
      await provider.waitForTransaction(claimTx.hash, BLOCK_CONFIRMATION);
    }
    setWaitForHarvest(false);
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

  const updatePeriod = async(startBlock) => {
    if (startBlock > 0) {
      // calculate currentPeriod and countdown to next period
      const currentBlockNumber = await provider.getBlockNumber();
      const currentPeriod = currentBlockNumber <= startBlock ? 0 : Math.floor((currentBlockNumber - startBlock - 1)/WEEKLY_BLOCK_NUMBER) + 1;
      const nextPeriodCountdown = currentPeriod > TOTAL_CLAIM_PERIOD ? 0 : startBlock + currentPeriod * WEEKLY_BLOCK_NUMBER - currentBlockNumber + 1

      setCurrentPeriod(currentPeriod)
      setNextPeriodCountdown(nextPeriodCountdown)
    } else {
      setCurrentPeriod(0)
      setNextPeriodCountdown(DEFAULT_COUNTDOWN)
    }
  }

  // trigger every 10 minutes when contract is known
  useEffect(() => {
    const interval = setInterval(() => {
      updatePeriod(startBlock);
    }, TEN_MINUTE_MS );
  
    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [])

  return (<Container height="100vh">
    <Hero />
    <Main>
      <Text mb={3}>
        Utility for HOPR-DAI liquidity mining on Uniswap. Deposit (plant) Uniswap HOPR-DAI liquidity tokens (<Code>UNI-V2</Code>) to claim (harvest) <Link href="https://etherscan.io/token/0xf5581dfefd8fb0e4aec526be659cfab1f8c781da" isExternal>
            HOPR tokens<ExternalLinkIcon mx="2px" />
          </Link>.
      </Text>
      <ConnectWallet
        address={address}
        onClick={handleConnectWeb3}
        isLoading={isLoading}
        networkName={CONTRACT_ADDRESSES.hasOwnProperty(chainId) ? CONTRACT_ADDRESSES[chainId].networkName : "wrong"}
        networkType={CONTRACT_ADDRESSES.hasOwnProperty(chainId) ? CONTRACT_ADDRESSES[chainId].networkType : "network"}
      >
        <ProgressBar currentPeriod={currentPeriod} countdown={nextPeriodCountdown}/>
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
            additionalRequirement={currentPeriod>1}
            handleSwap={() => claimAndClose(provider, currentStake)}
            waiting={waitForHarvest}
          />
        </ListItem>    
      </List>

    </Main>
    <DarkModeSwitch />
  </Container>);
}

export default Index
