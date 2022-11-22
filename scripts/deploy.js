const hre = require("hardhat");
const { ethers } = require("hardhat");
const FINDER_ADDRESS = "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e" //goerli

//new list args
const LIST_CRITERIA =
  "0x4469642074686520616464726573732062656C6F7720706172746963697061746520696E2058206861636B206261736564206F6E20592063726974657269613F";
const TITLE = "X Hackers";
const TOKEN = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; //Goerli WETH
const BOND_AMOUNT = 200;
const ADD_REWARD = 100;
const REMOVE_REWARD = 50;
const LIVENESS = 1;

async function main() {

  const [signer] = await hre.ethers.getSigners();

  // DEPLOY DECENTRALIST
  const Decentralist = await hre.ethers.getContractFactory("Decentralist");
  const decentralist = await Decentralist.deploy();
  await decentralist.deployed();

  console.log(`Decentralist deployed to ${decentralist.address}`);

  // DEPLOY PROXY FACTORY
  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const proxyFactory = await DecentralistProxyFactory.deploy(decentralist.address, FINDER_ADDRESS);
  await proxyFactory.deployed();

  console.log(`Proxy Factory deployed to ${proxyFactory.address}`);
  
  // CREATE NEW LIST
  let tx1 = await proxyFactory.createNewDecentralist(
    LIST_CRITERIA,
    TITLE,
    TOKEN,
    BOND_AMOUNT,
    ADD_REWARD,
    REMOVE_REWARD,
    LIVENESS,
    signer.address
  );
  tx1 = await tx1.wait();
  const listAddress = tx1.logs[0].address;
  console.log(`New List deployed to: ${listAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
