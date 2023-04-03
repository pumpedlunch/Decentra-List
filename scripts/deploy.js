const hre = require("hardhat");
const ethers = require("ethers");

// DEPLOY VARIABLES (UPDATE FOR DESIRED NETWORK)

FINDER_ADDRESS = "0x278d6b1aA37d09769E519f05FcC5923161A8536D"; // <optimism
// const FINDER_ADDRESS = "0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64"; // <polygon
// const FINDER_ADDRESS = "0xb22033fF04AD01fbE8d78ef4622a20626834271B"; // <mumbai
// const FINDER_ADDRESS = "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e"; // <goerli
// const FINDER_ADDRESS = "0x40f941E48A552bF496B154Af6bf55725f18D77c3"; // <mainnet
// const MINIMUM_LIVENESS = 1;
const MINIMUM_LIVENESS =  8 * 60 * 60; // <mainnets 1 // <testnets

/* const GAS_SETTINGS = {
  maxFeePerGas: ethers.utils.parseUnits("31", "gwei"),
  maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
}; */

async function main() {
  // DEPLOY DECENTRALIST
  // const Decentralist = await hre.ethers.getContractFactory("Decentralist");
  // const decentralist = await Decentralist.deploy(/* GAS_SETTINGS */);
  // let tx1 = await decentralist.deployed();

  // tx1 = await tx1.deployTransaction.wait();

  // console.log(`Decentralist deployed to ${decentralist.address} 
  // --gas used: ${tx1.gasUsed} 
  // --effective price in gwei: ${ethers.utils.formatUnits(
  //   tx1.effectiveGasPrice,
  //   "gwei"
  // )}
  // --gas cost (ETH): ${ethers.utils.formatEther(
  //   tx1.gasUsed.mul(tx1.effectiveGasPrice)
  // )}`);

  // DEPLOY PROXY FACTORY

  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const proxyFactory = await DecentralistProxyFactory.deploy(
    "0x1053fe820b68D71b2a3cE4565b285B6bDAbAaF74", // decentralist.address,
    FINDER_ADDRESS,
    MINIMUM_LIVENESS,
    /* GAS_SETTINGS */
  );
  let tx2 = await proxyFactory.deployed();
  tx2 = await tx2.deployTransaction.wait();

  // console.log(`Proxy Factory deployed to ${proxyFactory.address},
  // --gas used: ${tx2.gasUsed} 
  // --effective price in gwei: ${ethers.utils.formatUnits(
  //   tx2.effectiveGasPrice,
  //   "gwei"
  // )}
  // --gas cost (ETH): ${ethers.utils.formatEther(
  //   tx2.gasUsed.mul(tx2.effectiveGasPrice)
  // )}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
