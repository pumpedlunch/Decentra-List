const { Contract } = require("ethers");
const hre = require("hardhat");

const WETH_ABI = require("../public/abis/WETH.json");
const WETH_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; //goerli
const OOV2_ABI = require("../public/abis/OptimisticOracleV2.json");
const { ethers } = require("hardhat");
const OOV2_ADDRESS = "0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884"; //goerli



async function main() {

  const [signer] = await hre.ethers.getSigners();

  // DEPLOY DECENTRALIST
  const Decentralist = await hre.ethers.getContractFactory("Decentralist");
/*   const decentralist = await Decentralist.deploy();
  await decentralist.deployed();

  console.log(`Decentralist deployed to ${decentralist.address}`);

  // DEPLOY PROXY FACTORY
  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const dpf = await DecentralistProxyFactory.deploy(decentralist.address);
  await dpf.deployed();

  console.log(`Proxy Factory deployed to ${dpf.address}`);

  // DEPLOY NEW LIST

  const FIXEDANCILLARYDATA =
    "0x4469642074686520616464726573732062656c6f7720706172746963697061746520696e2058206861636b206261736564206f6e20592063726974657269613f2031203d207965732c2030203d206e6f";
  const TITLE = "X Hackers";
  const LIVENESSPERIOD = 1;
  const BONDAMOUNT = 555;
  const REWARD = 100;
  const OWNER = "0xac21e8867f4EC67fd1c03f0cfFB6c2961fD45a4b";

  let list1 = await dpf.createNewDecentralist(
    FIXEDANCILLARYDATA,
    TITLE,
    LIVENESSPERIOD,
    BONDAMOUNT,
    REWARD,
    REWARD,
    OWNER
  );
  list1 = await list1.wait();
  const list1Address = list1.logs[0].address;
  console.log(`New List deployed to: ${list1Address}`); */

  // APPROVE WETH SPEND
    //override list1Address if commented out above
  const list1Address = "0x8AF964Ab7BaBC8e9027a9f175C7D1e69DC66b088";

  const WETH = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);
  let approveTx = await WETH.approve(list1Address, ethers.utils.parseEther("1"));
  approveTx = await approveTx.wait();
  console.log(`approve spend tx: ${approveTx.transactionHash}`);

  // PROPOSE ADDRESSES TO LIST 
  const list1Contract = Decentralist.attach(list1Address);
  let addTx = await list1Contract.addAddresses(["0x64e89807E4C2c006202834404FDb40C6F13a4279", "0xDDBB2e0C2806dFB96945751fd9B01fa6c65F765D"]);
  addTx = await addTx.wait();
  console.log(`add addresses tx: ${addTx.transactionHash}`);
  console.log(addTx);

  //TO DO:parse OOv2 request info (timestamp & ancill data) from addTx to continue test file

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
