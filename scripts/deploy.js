const hre = require("hardhat");
const ethers = require("ethers");

// set minimum liveness in seconds for netwrok. Use 8 hours for mainnet, 1 second for testnets.
const MINIMUM_LIVENESS = 8 * 60 * 60;
// update finder address for network
const FINDER_ADDRESS = "0x40f941E48A552bF496B154Af6bf55725f18D77c3"; // <mainnet "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e"; // <goerli
const GAS_SETTINGS = {
  maxFeePerGas: ethers.utils.parseUnits("17", "gwei"),
  maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
};

async function main() {
  // DEPLOY DECENTRALIST
  const Decentralist = await hre.ethers.getContractFactory("Decentralist");
  const decentralist = await Decentralist.deploy(GAS_SETTINGS);
  let tx1 = await decentralist.deployed();

  tx1 = await tx1.deployTransaction.wait();

  console.log(`Decentralist deployed to ${decentralist.address} 
  --gas used: ${tx1.gasUsed} 
  --effective price in gwei: ${ethers.utils.formatUnits(
    tx1.effectiveGasPrice,
    "gwei"
  )}
  --gas cost (ETH): ${ethers.utils.formatEther(
    tx1.gasUsed.mul(tx1.effectiveGasPrice)
  )}`);

  // DEPLOY PROXY FACTORY

    const DECENTRALIST_ADDRESS = "0x1053fe820b68D71b2a3cE4565b285B6bDAbAaF74";

  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const proxyFactory = await DecentralistProxyFactory.deploy(
    DECENTRALIST_ADDRESS, //decentralist.address,
    FINDER_ADDRESS,
    MINIMUM_LIVENESS,
    GAS_SETTINGS
  );
  let tx2 = await proxyFactory.deployed();
  tx2 = await tx2.deployTransaction.wait();

  console.log(`Proxy Factory deployed to ${proxyFactory.address},
  --gas used: ${tx2.gasUsed} 
  --effective price in gwei: ${ethers.utils.formatUnits(tx2.effectiveGasPrice, "gwei")}
  --gas cost (ETH): ${ethers.utils.formatEther(tx2.gasUsed.mul(tx2.effectiveGasPrice))}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
