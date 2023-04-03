const hre = require("hardhat");
const { ethers } = require("hardhat");
const OOV2_ABI = require("../public/abis/OptimisticOracleV2.json");
const OOV2Interface = new ethers.utils.Interface(OOV2_ABI);
const WETH_ABI = require("../public/abis/WETH.json");
require("dotenv").config();

// --- FOR TESTNETS ---

const OOV2_ADDRESS = "0x60E6140330F8FE31e785190F39C1B5e5e833c2a9" //<mumbai "0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884"; //<goerli 

const LIST_CRITERIA =
  "0x41646472657373657320636f6e73696465726564205768697465204861742062792074686520637269746572696120706f73746564206279204e6f6d616420686572653a2068747470733a2f2f747769747465722e636f6d2f6e6f6d616478797a5f2f7374617475732f31353535323933393635303439363330373232"; // "0x536d61727420636f6e747261637473207468617420656e666f726365207061796d656e74206f662063726561746f722073657420726f79616c74696573206f6e20616c6c204e4654207472616e736665727320616e6420696e7465726d65646961746564207472616e7366657273";
const TITLE = "Nomad White Hat Hackers"; // "Royalty Enforcing NFT Exchanges";
const TOKEN = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"; // <USDC Goerli  "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; // <Goerli WETH
const BOND_AMOUNT = ethers.utils.parseEther("0"); //ethers.utils.parseEther("0.35");
const ADD_REWARD = ethers.utils.parseEther("0.0"); //100;
const REMOVE_REWARD = ethers.utils.parseEther("10"); //50;
const LIVENESS = 1; //8 * 60 * 60;

// --- FOR MAINNET ---

// const FINDER_ADDRESS = "0x40f941E48A552bF496B154Af6bf55725f18D77c3"; // <mainnet
// const OOV2_ADDRESS = "0xA0Ae6609447e57a42c51B50EAe921D701823FFAe"; // <mainnet

// const LIST_CRITERIA =
//   "0x4164647265737365732074686174206861766520766f74656420696e206f76657220383025206f6620554d412044564d20566f74657320746861742068617665207265736f6c76656420696e207468652070726576696f75732031383020646179732e" // Addresses that have voted in over 80% of UMA DVM Votes that have resolved in the previous 180 days." // converted to hex!
// const TITLE = "UMA Voting Allstars";
// const TOKEN = "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828" // <Mainnet UMA "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // <Mainnet WETH
// const BOND_AMOUNT = ethers.utils.parseEther("250");
// const ADD_REWARD = 0;
// const REMOVE_REWARD = ethers.utils.parseEther("4");
// const LIVENESS = 24 * 60 * 60;

// const GAS_SETTINGS = {
//   maxFeePerGas: ethers.utils.parseUnits("38", "gwei"),
//   maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
// };

/* const ADDRESSES = [
  "0xe403c7faf2c682846aa7c221b0b0b9b3cffa1d28",
  "0xca4995e1c7af0e2713f0130275736fcc2e7ea553",
  "0x7693c3545667309f112eb2d1a0d7bdfcfc536411",
  "0x5337122c6b5ce24d970ce771510d22aeaf038c44",
  "0xfafbc6d9a4b227e8981e725cc4b277a1049f20a1",
  "0xe43aa34ee3bf322a680c708eea5e64a9e4a99ed3",
  "0xe3f40743cc18fd45d475fae149ce3ecc40af68c3",
  "0x1a6bbeacb9eb39701d9c08f0a48b1c89ffc8ab0e",
  "0x35679e61e5946f711ca1288255b1f32376c416d7",
  "0x11b3544828b358cd528e72a9f7ffb7212fc3fb85",
  "0x998a5d74223ec9f848c5946db26aa73db42ec33b",
  "0x666bed4762790fab9fb6d9635ab5a009d4d5d216",
  "0x0000000052e0b16081d489a9e60e9182a86e6761",
  "0x25c77aafbccce15ceec211b483928be70efc2bad",
  "0xd45ece50811082f6185a73b6a1d7c6eef0e75e0f",
  "0x00000cc0a3d2430b13894624bcdee0b2bb3628e1",
  "0xfe6ac63f0bd9ffee3988c5e6a2b8f047105f9c50",
  "0xc1a4aa4a4ed635210bc0a352d36720ab7872bdbb",
  "0x8f0b53d08c1f67849bc7ba649086316b43022738",
  "0x7951e5e78857055c46ddec770178e13c263e62a1",
  "0x54c218034c739fe454f8e11c7c6f80f9fe32455c",
  "0xc9d21f523f577f0754a6d23243b7bd2b46114092",
  "0x8dec128c0baa3405dd529d84a91874b641d299a3",
  "0x5a27a63832b9066be4aba5075a029d0e32001cc0",
  "0x139e3338c204609e6dcffab0ee53a553e63c49f0",
  "0xb63d434fafc6240e928928f27cdfcec90eba69d6",
  "0x2c31aa7944a9673edfeb8e5351cfacd1dbf381d7",
  "0x4f2094a42e60d736868a7d4de868b8342fff06c6",
  "0xd83238be308761d17315a9ee53adeb3c898cd8c7",
  "0xccbf8dd3dd9a7f627873b2b34e4e365ed992cb95",
  "0x94ada95fcecfd79c99a8a3ada38e1c1328884142",
  "0x76579878300c28264397942c2fd41efee1e2134e",
  "0x53c787bbb6c6e7649828c79bb237b8128fd92a6a",
  "0x48c90b76a83955628ba355fec9c960aef5792f75",
  "0x20da297f4332d94aeded1a44942f6f70ce3ea37b",
  "0x14cb03795295489baa3b5cf9d1d7069c2734d329",
  "0x23ab3f12c2e6cb22926886ecd0fdbfda275cb1d7",
  "0xa7a83407283c1ef726aee0f4ee31e1fc0cec0214",
  "0x9bdeb450375770cfbd5c86c740d3bdb8fc980e5f",
  "0x951f864eeb7976144409a050828012837fd4e749",
  "0x9518e8c40ef9b1d261d4f971936db68c64bf960b",
  "0xc0eab859481c28c2689395194d24997851a36eb4",
  "0x7674a3460a657517c338fb80a635b26d18430446",
  "0xe405f85ca01c96bf98b2a3e0c5987409a45f1ab1",
  "0xaf81a82cce1d341d4e3e9586357e44513b1585e9",
  "0x10959926fb4926d181a2ea46ceb234150ab70c9b",
  "0xae114864da2ec540be0d0a3d50006cb9611ce5ee",
  "0x9997da3de3ec197c853bcc96caecf08a81de9d69",
  "0x376accbd875b44385736168e545b0e866f9990a3",
  "0xc9d0816ee844e1ff004670636e425f2b7b990952",
  "0x8a092d6835ef0a3eab726da89dcf7ed6832a3de2",
  "0xfaf02d4712ce5b9c8ad7afa293e6f71db395ff8d",
  "0xf58921f742009c1e71ac755203a34590fbe91301",
  "0xf41cce45725df4378e7a4387c337ee5eda66f331",
  "0xf0ae4f60a4dc379ae25371a34b4b699dee8d530f",
  "0xb61c06eef65e9aa59f371a77699c34fbef477f0d",
  "0xafcbf95c1432220f344dd86bb3557a84f483e138",
  "0xa5af711e752be82da4e45475d4bb91d40b4f4f8f",
  "0xa147b99a0e3f1373300f48faf1a1aac3e87c88ce",
  "0x95b18dd40867b0fc79657ef66a2c7f3ad5dd23df",
  "0x93939362fec176659bb845119d81cbe507e6d4da",
  "0x8867f3da0e1bfbdc5b68aacb73ac44a5ab318c4e",
  "0x84a2377aace0e43810ebf91638b7d1f06836a84e",
  "0x76484d49a08adf8bf1abc7a6fdd35eaf13e19336",
  "0x75f785804ecf71450d9e7c34af71c3364a7fe6c9",
  "0x61e37b7ded3a72aff5d7fd4ab3da87a3048f845b",
  "0x608f56fe8c90abcf13c6e81ee5086f6b7a0aa365",
  "0x5b8c32a4e0185ad15d3610705ae050903a1c4a4e",
  "0x4db9ef1daf5cb18eb778c134d69b1e67000fb8d2",
  "0x433ea2df6d7c567b1dd55e3fb99512222cb23d95",
  "0x3f4adba7bfa1806cf3d0c067a20a9144205c4734",
  "0x3ead4a9c2d4d8eff7fd534dc0dd396793dbacbe9",
  "0x3e30bbe8264f72b30cc901b365fae1fcaacb5cb0",
  "0x3a9f0c5126d55a201b70a77d73782829423613b0",
  "0x379b6b927a058ef220b5b6eade5bad0b2e20ab12",
  "0x355ed2ccd8d27a569414867832c184cf2993d685",
  "0x2973e77a8e60b6a1313a30687e979741ed559aa7",
  "0x266c97351c81eadb56d0a291b2f7feb961922e67",
  "0x11656a7ad11fb6b1b32dba47c137409429e12d61",
  "0x0e61a8fb14f6ac999646212d30b2192cd02080dd",
  "0x00000000ba88001a2698008824a89152bdfbaec4",
  "0xa80163e183af5e7530d708dbc9080d90cefc60c7",
  "0xf4619cc40b143343ecabfa69a9f6b2097d6b91ba",
  "0x5bcb88caa64f199c6dc74bcb2c3056bae48e5ecb",
  "0x5ee42438d0d8fc399c94ef3543665e993e847b49",
  "0x3c2d2e44f2d7e54be8cbbbb35a3747e0ba5efdf2",
  "0xd3749a3c9e0dcc9ea9ccf07d89b2b621db8312f9",
  "0x10206b3ff7a283948bba13c2b0300b9381fa1157",
  "0xe0b2026e3db1606ef0beb764ccdf7b3cee30db4a",
  "0x7e0dadc0dd0d74b4d9e49d14a865765f47121476",
  "0x49c144bb553d02a19ccc45119724342ac996c600",
  "0x3d6e4e2e1748628ed053a831c03b8189c37b6f23",
  "0x2cfbf3d40f71ceed2997cacbafe9d31e630860cb",
  "0x93bcf26c4dd1ad618251567f23568e1b836ff013",
  "0xf26306e1b0a1677e1f19207ee720f6619ed4593a",
  "0xe4eee5580b2e91130fa65b14d5e2abc1bd250811",
  "0xdfb81a8663df23bc59ba75b60b99015f3f7ae725",
  "0xd3f46fa485a91b63fde5a05b6f06b147cce3b56a",
]; // NFT Exchanges: "0x00000000006c3852cbEf3e08E8dF289169EdE581","0x7Fed7eD540c0731088190fed191FCF854ed65Efa","0x1E0049783F008A0085193E00003D00cd54003c71"
 */
const proxyFactoryAddress = process.env.MAINNET_FACTORY; // UPDATE .env for this

async function main() {
  const Decentralist = await hre.ethers.getContractFactory("Decentralist");
  const DecentralistProxyFactory = await hre.ethers.getContractFactory(
    "DecentralistProxyFactory"
  );
  const [signer] = await hre.ethers.getSigners();

  //generate proxyFactory contract
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
    signer.address,
    GAS_SETTINGS
  );
  tx1 = await tx1.wait();
  const listAddress = tx1.logs[0].address;
  console.log(`New List deployed to: ${listAddress}`);
/* 
  // ADD ADDRESSES

  //create list contract
  const listContract = Decentralist.attach(listAddress).connect(signer);

  // approve transfer for bond
  const wethContract = new ethers.Contract(TOKEN, WETH_ABI, signer);
  await wethContract.deposit({ value: ethers.utils.parseEther("10") });
  await wethContract.approve(listAddress, ethers.utils.parseEther("10"));

  //propose revision to add addresses
  let tx4 = await listContract.proposeRevision(1, ADDRESSES);

  console.log("revision proposed");

  //get OO request data
  const receipt1 = await tx4.wait();
  // console.log(receipt1);
  let log = OOV2Interface.parseLog(receipt1.logs[0]);
  const { requester, identifier, timestamp, ancillaryData } = log.args;

  // use on local network
  // increaseTime 
  // await signer.provider.send("evm_increaseTime", [LIVENESS * 2]);

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

  console.log("revision executed"); */
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
