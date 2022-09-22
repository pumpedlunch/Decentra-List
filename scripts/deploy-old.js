// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

/* const FIXEDANCILLARYDATA = "0x4469642074686520616464726573732062656c6f7720706172746963697061746520696e2058206861636b206261736564206f6e20592063726974657269613f2031203d207965732c2030203d206e6f";
const TITLE = "X Hackers";
const LIVENESSPERIOD = 30;
const BONDAMOUNT =1000; */

async function main() {
  const Decentralist = await hre.ethers.getContractFactory("Decentralist");
  const decentralist = await Decentralist.deploy(
    "0x4469642074686520616464726573732062656c6f7720706172746963697061746520696e2041206861636b206261736564206f6e20422063726974657269613f2031203d207965732c2030203d206e6f", 
    "A Hackers", 
    60, 
    500)

  await decentralist.deployed();

  console.log(
    `Decentralist deployed to ${decentralist.address}`
  );
  console.log(
    decentralist
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
