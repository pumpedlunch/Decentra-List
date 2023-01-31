const hre = require("hardhat");
const ethers = require("ethers");

// DEPLOY VARIABLES (UPDATE FOR DESIRED NETWORK)
// const FINDER_ADDRESS = "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e"; // <goerli
const FINDER_ADDRESS = "0x40f941E48A552bF496B154Af6bf55725f18D77c3"; // <mainnet
// const MINIMUM_LIVENESS = 1;
const MINIMUM_LIVENESS = 8 * 60 * 60; // <mainnet

const GAS_SETTINGS = {
  maxFeePerGas: ethers.utils.parseUnits("31", "gwei"),
  maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
};

async function main() {
  // DEPLOY DECENTRALIST
  /* const Decentralist = await hre.ethers.getContractFactory("Decentralist");
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
 */
  // DEPLOY PROXY FACTORY

  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const proxyFactory = await DecentralistProxyFactory.deploy(
    "0xD752023C17645362B5fe561D5A11B0fe7C9bFeAE", // <<mainnet deployed contract decentralist.address, // 
    FINDER_ADDRESS,
    MINIMUM_LIVENESS,
    GAS_SETTINGS
  );
  let tx2 = await proxyFactory.deployed();
  tx2 = await tx2.deployTransaction.wait();

  console.log(`Proxy Factory deployed to ${proxyFactory.address},
  --gas used: ${tx2.gasUsed} 
  --effective price in gwei: ${ethers.utils.formatUnits(
    tx2.effectiveGasPrice,
    "gwei"
  )}
  --gas cost (ETH): ${ethers.utils.formatEther(
    tx2.gasUsed.mul(tx2.effectiveGasPrice)
  )}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
