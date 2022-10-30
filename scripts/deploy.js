// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const FIXEDANCILLARYDATA = "0x4469642074686520616464726573732062656c6f7720706172746963697061746520696e2058206861636b206261736564206f6e20592063726974657269613f2031203d207965732c2030203d206e6f";
const TITLE = "X Hackers";
const LIVENESSPERIOD = 30;
const BONDAMOUNT =1000;
const REWARD = 500;

async function main() {
  const Decentralist = await hre.ethers.getContractFactory("Decentralist");
  const decentralist = await Decentralist.deploy();
  await decentralist.deployed();

  console.log(
    `Decentralist deployed to ${decentralist.address}`
  );

  const DecentralistProxyFactory = await hre.ethers.getContractFactory("DecentralistProxyFactory");
  const dpf = await DecentralistProxyFactory.deploy(decentralist.address);
  await dpf.deployed();

  console.log(
    `Proxy Factory deployed to ${dpf.address}`
  );

  const listAddress = await dpf.createNewDecentralist(FIXEDANCILLARYDATA, TITLE, LIVENESSPERIOD, BONDAMOUNT, REWARD, REWARD);

  console.log(
    `New List deployed to:`
  );
  console.log(
    listAddress
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
