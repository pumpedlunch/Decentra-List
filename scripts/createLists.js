const hre = require("hardhat");
const { ethers } = require("hardhat");
const OOV2_ABI = require("../public/abis/OptimisticOracleV2.json");
const OOV2Interface = new ethers.utils.Interface(OOV2_ABI);
const WETH_ABI = require("../public/abis/WETH.json");
require("dotenv").config();

//goerli
const OOV2_ADDRESS = "0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884"; //goerli

const LIST_CRITERIA =
  "0x5468657365206164647265737365732061726520736d61727420636f6e747261637473207468617420656e666f726365207061796d656e74206f662063726561746f722073657420726f79616c74696573206f6e20616c6c204e4654207472616e73616374696f6e7320616e6420696e7465726d65646961746564207472616e73616374696f6e732e";
const TITLE = "Royalty Enforcing NFT Exchanges";
const TOKEN = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; // <Goerli WETH
const BOND_AMOUNT = ethers.utils.parseEther("0"); //ethers.utils.parseEther("0.35");
const ADD_REWARD = ethers.utils.parseEther("0.01"); //100;
const REMOVE_REWARD = ethers.utils.parseEther("0.25"); //50;
const LIVENESS = 1; //8 * 60 * 60;

/* //mainnet
const FINDER_ADDRESS = "0x40f941E48A552bF496B154Af6bf55725f18D77c3"; // <mainnet
const OOV2_ADDRESS = "0xA0Ae6609447e57a42c51B50EAe921D701823FFAe"; // <mainnet

const LIST_CRITERIA =
  "0x4469642074686520616464726573732062656C6F7720706172746963697061746520696E2058206861636B206261736564206F6E20592063726974657269613F";
const TITLE = "Z Hackers";
const TOKEN = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // <Mainnet WETH
const BOND_AMOUNT = ethers.utils.parseEther("1");
const ADD_REWARD = 100;
const REMOVE_REWARD = 50;
const LIVENESS = 8 * 60 * 60; */

const ADDRESSES = [
  "0x00000000006c3852cbEf3e08E8dF289169EdE581",
  "0x7Fed7eD540c0731088190fed191FCF854ed65Efa",
  "0x1E0049783F008A0085193E00003D00cd54003c71",
];

const proxyFactoryAddress = process.env.GOERLI_FACTORY; // UPDATE MANUALLY

async function main() {
  const Decentralist = await hre.ethers.getContractFactory("Decentralist");
  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const [signer] = await hre.ethers.getSigners();

  //create proxyFactory contract
  const proxyFactory = DecentralistProxyFactory.attach(
    proxyFactoryAddress
  ).connect(signer);

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

  // ADD ADDRESSES

  //create list contract
  const listContract = Decentralist.attach(listAddress).connect(signer);

  // approve transfer for bond
  /*   const wethContract = new ethers.Contract(TOKEN, WETH_ABI, signer);
  await wethContract.deposit({ value: ethers.utils.parseEther("10") });
  await wethContract.approve(listAddress, ethers.utils.parseEther("10")); */

  //propose revision to add addresses
  let tx4 = await listContract.proposeRevision(
    ethers.utils.parseEther("1"), // YES value
    ADDRESSES
  );

  console.log("revision proposed");

  //get OO request data
  const receipt1 = await tx4.wait();
  // console.log(receipt1);
  let log = OOV2Interface.parseLog(receipt1.logs[0]);
  const { requester, identifier, timestamp, ancillaryData } = log.args;

  /* use on local network
  // increaseTime 
  await signer.provider.send("evm_increaseTime", [LIVENESS * 2]); */

  // call settle on OOV2
  const OOV2 = new ethers.Contract(OOV2_ADDRESS, OOV2Interface, signer);
  const tx5 = await OOV2.settle(
    requester,
    identifier,
    timestamp,
    ancillaryData
  );

  console.log("oracle settled");

  const tx6 = await listContract.executeRevision(1, ADDRESSES);

  console.log("revision executed");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
