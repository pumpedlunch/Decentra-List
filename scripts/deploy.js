const hre = require("hardhat");
const ethers = require("ethers");

// set minimum liveness in seconds for network. Use 8 hours for mainnet, 1 second for testnets.

// --- FOR MAINNET ---
/* const MINIMUM_LIVENESS = 8 * 60 * 60;
const FINDER_ADDRESS = "0x40f941E48A552bF496B154Af6bf55725f18D77c3"; // <mainnet  */

// --- FOR GOERLI ---
const FINDER_ADDRESS = "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e"; // <goerli
const MINIMUM_LIVENESS = 1;

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

  //const DECENTRALIST_ADDRESS = "0x78e411a1C59c11Ef8C0FdC0AeC7cc44A8216d490";

  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const proxyFactory = await DecentralistProxyFactory.deploy(
    decentralist.address, // DECENTRALIST_ADDRESS,
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
