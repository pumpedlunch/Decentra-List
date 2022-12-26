const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect, assert, anyValue } = require("chai");

const WETH_ABI = require("./abis/WETH.json");
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; //mainnet
const FINDER_ADDRESS = "0x40f941E48A552bF496B154Af6bf55725f18D77c3"; //mainnet
const UNI_SWAP_ROUTER_ABI = require("./abis/UniswapV3SwapRouter.json");
const UNI_SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const { providers } = require("ethers");
const {
  setBlockGasLimit,
} = require("@nomicfoundation/hardhat-network-helpers");
const DECENTRALIST_ABI = require("../src/artifacts/contracts/Decentralist.sol/Decentralist.json")
  .abi;
const OOV2_ABI = require("./abis/OptimisticOracleV2.json");
const { default: Ethers } = require("@typechain/ethers-v5");
const OOV2_ADDRESS = "0xa0ae6609447e57a42c51b50eae921d701823ffae"; //mainnet
const OOV2Interface = new ethers.utils.Interface(OOV2_ABI);
const UMA_STORE_ABI = require("./abis/UMAStore.json");
// all tokens on UMA's mainnet whitelist
const MAINNET_TOKENS = [
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
  "0xeca82185adCE47f39c684352B0439f030f860318",
  "0x261b45D85cCFeAbb11F022eBa346ee8D1cd488c0",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT failed -returned data
  "0x758A43EE2BFf8230eeb784879CdcFF4828F2544D",
  "0xBD2F0Cd039E0BFcf88901C98c0bFAc5ab27566e3",
  "0x19D97D8fA813EE2f51aD4B4e04EA08bAf4DFfC28",
  "0x3832d2F059E55934220881F831bE501D180671A7",
  "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  "0x0AaCfbeC6a24756c20D41914F2caba817C0d8521",
  "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", // SNX failed -timed out
  "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828",
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940",
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
  "0xd3d2E2692501A5c9Ca623199D38826e513033a17",
  "0x88D97d199b9ED37C29D846d00D443De980832a22",
  "0xa117000000f279D81A1D3cc75430fAA017FA5A2e",
  "0x0954906da0Bf32d5479e25f46056d22f08464cab",
  "0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b",
  "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
  "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272",
  "0x0f7F961648aE6Db43C75663aC7E5414Eb79b5704",
  "0xba100000625a3754423978a60c9317c58a424e3D",
  "0x7e7E112A68d8D2E221E11047a72fFC1065c38e1a",
  "0x0000000000095413afC295d19EDeb1Ad7B71c952",
  "0x69af81e73A73B40adF4f3d4223Cd9b1ECE623074",
  "0x24A6A37576377F63f194Caa5F518a60f45b42921",
  "0xb753428af26E81097e7fD17f40c88aaA3E04902c",
  "0x1b40183EFB4Dd766f11bDa7A7c3AD8982e998421",
  "0x853d955aCEf822Db058eb8505911ED77F175b99e",
  "0x5F64Ab1544D28732F0A24F4713c2C8ec0dA089f0",
  "0x0258F474786DdFd37ABCE6df6BBb1Dd5dfC4434a",
  "0x0391D2021f89DC339F60Fff84546EA23E337750f",
  "0x69BbE2FA02b4D90A944fF328663667DC32786385",
  "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
  "0x1571eD0bed4D987fe2b498DdBaE7DFA19519F651",
  "0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9",
  "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD",
  "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
  "0x48Fb253446873234F2fEBbF9BdeAA72d9d387f94",
  "0xBA11D00c5f74255f56a5E366F4F77f5A186d7f55",
  "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F",
  "0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44",
  "0x2ba592F78dB6436527729929AAf6c908497cB200",
  "0xC4C2614E694cF534D407Ee49F8E44D125E4681c4",
  "0xBBc2AE13b23d715c30720F079fcd9B4a74093505",
  "0x69e8b9528CABDA89fe846C67675B5D73d463a916",
  "0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c",
  "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
  "0xc00e94Cb662C3520282E6f5717214004A7f26888",
  "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
  "0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF",
  "0xa1faa113cbE53436Df28FF0aEe54275c13B40975",
  "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
  "0x408e41876cCCDC0F92210600ef50372656052a38",
  "0xD533a949740bb3306d119CC777fa900bA034cd52",
  "0xD291E7a03283640FDc51b121aC401383A46cC623",
  "0x87d73E916D7057945c9BcD8cdd94e42A6F47f776",
  "0x888888435FDe8e7d4c54cAb67f206e4199454c60",
  "0x44564d0bd94343f72E3C8a0D22308B7Fa71DB0Bb",
  "0x3472A5A71965499acd81997a54BBA8D852C6E53d",
  "0x383518188C0C6d7730D91b2c03a03C837814a899",
  "0x875773784Af8135eA0ef43b5a374AaD105c5D39e",
  "0x6810e776880C02933D47DB1b9fc05908e5386b96",
  "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e",
  "0xad32A8e6220741182940c5aBF610bDE99E737b2D",
  "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
  "0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B",
  "0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d",
  "0xbEa98c05eEAe2f3bC8c3565Db7551Eb738c8CCAb",
  "0x8888801aF4d980682e47f1A9036e589479e835C5",
  "0x4104b135DBC9609Fc1A9490E61369036497660c8",
  "0xfe9A29aB92522D14Fc65880d817214261D8479AE",
  "0x86772b1409b61c639EaAc9Ba0AcfBb6E238e5F83",
  "0x6123B0049F904d730dB3C36a31167D9d4121fA6B",
  "0x2d94AA3e47d9D5024503Ca8491fcE9A2fB4DA198",
  "0x7815bDa662050D84718B988735218CFfd32f75ea",
  "0xbbBBBBB5AA847A2003fbC6b5C16DF0Bd1E725f61",
  "0x5166E09628b696285E3A151e84FB977736a83575",
  "0xB0e1fc65C1a741b4662B813eB787d369b8614Af1",
  "0xbC396689893D065F41bc2C6EcbeE5e0085233447",
  "0x3Ec8798B81485A254928B70CDA1cf0A2BB0B74D7",
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  "0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb",
  "0x8A9C67fee641579dEbA04928c4BC45F66e26343A",
  "0xD34a24006b862f4E9936c506691539D6433aD297",
  "0x0b15Ddf19D47E6a86A56148fb4aFFFc6929BcB89",
  "0xbA8A621b4a54e61C442F5Ec623687e2a942225ef",
  "0xc4E15973E6fF2A35cC804c2CF9D2a1b817a8b40F",
  "0x42bBFa2e77757C645eeaAd1655E0911a7553Efbc",
  "0xef5Fa9f3Dede72Ec306dfFf1A7eA0bB0A2F7046F",
  "0xaa61D5dec73971CD4a026ef2820bB87b4a4Ed8d6",
  "0x752Efadc0a7E05ad1BCCcDA22c141D01a75EF1e4",
  "0xEd1480d12bE41d92F36f5f7bDd88212E381A3677",
  "0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5",
  "0xDC59ac4FeFa32293A95889Dc396682858d52e5Db",
  "0xB0c7a3Ba49C7a6EaBa6cD4a96C55a1391070Ac9A",
  "0xa5f2211B9b8170F694421f2046281775E8468044",
  "0x44108f0223A3C3028F5Fe7AEC7f9bb2E66beF82F",
];

const provider = ethers.provider;
const YES = "1000000000000000000"; //1e18

let signer1,
  signer2,
  Decentralist,
  decentralist,
  proxyFactory,
  listAddress,
  list,
  OOV2,
  wethContract,
  requester,
  identifier,
  timestamp,
  ancillaryData;

// list args
const LIST_CRITERIA = "0x74657374";
const TITLE = "Test";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; //mainnet WETH
const BOND_AMOUNT = ethers.utils.parseEther(".35"); //final fee for WETH
const ADD_REWARD = 10;
const REMOVE_REWARD = 5;
const LIVENESS = 10 * 60 * 60; //8 hours
const ADDRESSES = generateAddressArray(10); //set address array length here
// proxy factory args
const MINIMUM_LIVENESS = 8 * 60 * 60;

describe("DecentraList Test", function() {
  it("Deploys DecentraList and ProxyFactory", async function() {
    // GET SIGNERS
    [signer1, signer2] = await hre.ethers.getSigners();
    // console.log("signer1: ", signer1.address);
    // console.log("signer2: ", signer2.address);

    // DEPLOY DECENTRALIST
    Decentralist = await hre.ethers.getContractFactory("Decentralist");
    decentralist = await Decentralist.deploy();
    await decentralist.deployed();

    // console.log(`Decentralist deployed to ${decentralist.address}`);

    // DEPLOY PROXY FACTORY
    const DecentralistProxyFactory = await hre.ethers.getContractFactory(
      "DecentralistProxyFactory"
    );
    proxyFactory = await DecentralistProxyFactory.deploy(
      decentralist.address,
      FINDER_ADDRESS,
      MINIMUM_LIVENESS
    );
    await proxyFactory.deployed();

    // console.log(`Proxy Factory deployed to ${proxyFactory.address}`);

    // eslint-disable-next-line no-unused-expressions
    expect(decentralist.address).to.be.a.properAddress;
    // eslint-disable-next-line no-unused-expressions
    expect(proxyFactory.address).to.be.a.properAddress;

    wethContract = new ethers.Contract(WETH, WETH_ABI, signer1);
    // DEPOSIT TEST ETH FOR WETH
    await wethContract.deposit({ value: ethers.utils.parseEther("9000") });
  });

  it("Create 1 new list", async function() {
    let tx1 = await proxyFactory.createNewDecentralist(
      LIST_CRITERIA,
      TITLE,
      WETH,
      BOND_AMOUNT,
      ADD_REWARD,
      REMOVE_REWARD,
      LIVENESS,
      signer1.address
    );
    tx1 = await tx1.wait();
    listAddress = tx1.logs[0].address;

    list = Decentralist.attach(listAddress).connect(signer1);
    expect(await list.minimumLiveness()).to.equal(MINIMUM_LIVENESS);

    // eslint-disable-next-line no-unused-expressions
    expect(listAddress).to.be.a.properAddress;
  });

  it("Add Addresses", async function() {
    // APPROVE TOKEN SPEND FOR BOND
    await wethContract.approve(listAddress, ethers.utils.parseEther("10"));

    // TRANSFER TOKENS FOR REWARDS
    await wethContract.transfer(listAddress, 10000);

    //create list contract
    list = Decentralist.attach(listAddress).connect(signer1);

    //propose revision to add addresses
    let tx1 = await list.proposeRevision(YES, ADDRESSES);
    await expect(tx1).to.emit(list, "RevisionProposed");

    //get OO request data
    const receipt1 = await tx1.wait();
    // console.log(receipt1);
    let log = OOV2Interface.parseLog(receipt1.logs[0]);
    ({ requester, identifier, timestamp, ancillaryData } = log.args);

    // console.log(
    //   `PROPOSE ${ADDRESSES.length} ADDRESSES GAS USED:`,
    //   receipt1.gasUsed.toNumber()
    // );

    // make sure revision can not be executed before approval
    await expect(list.executeRevision(1, ADDRESSES)).to.be.reverted;

    await provider.send("evm_increaseTime", [LIVENESS * 2]);

    // call settle on OOV2
    OOV2 = new ethers.Contract(OOV2_ADDRESS, OOV2Interface, signer1);
    const tx2 = await OOV2.settle(
      requester,
      identifier,
      timestamp,
      ancillaryData
    );

    // should emit revision approved event
    await expect(tx2).to.emit(list, "RevisionApproved");

    // call executeRevision
    const tx3 = await list.executeRevision(1, ADDRESSES);
    await expect(tx3).to.emit(list, "RevisionExecuted");
    await expect(tx3).to.changeTokenBalances(
      wethContract,
      [listAddress, signer1.address],
      [-ADDRESSES.length * ADD_REWARD, ADDRESSES.length * ADD_REWARD]
    );

    const receipt3 = await tx3.wait();
    // console.log(
    //   `EXECUTE ${ADDRESSES.length} ADDRESSES GAS USED:`,
    //   receipt3.gasUsed.toNumber()
    // );

    // check that addresses are mapped to true onList
    const addressBools = ADDRESSES.map((address) => {
      return list.onList(address);
    });

    await Promise.all(addressBools);
    let success = true;
    for (const bool of addressBools) {
      if (!bool) {
        success = false;
        return;
      }
    }
    // all addresses should be mapped to true
    expect(success).to.equal(true);

    //check that revision can not be executed again
    await expect(list.executeRevision(1, ADDRESSES)).to.be.reverted;
  });

  it("Remove Addresses", async function() {
    const REMOVALS = ADDRESSES.slice(0, 5);
    const tx1 = await list.proposeRevision(0, REMOVALS);
    await expect(tx1).to.emit(list, "RevisionProposed");

    //get OO request data
    const receipt1 = await tx1.wait();
    let log = OOV2Interface.parseLog(receipt1.logs[0]);
    ({ requester, identifier, timestamp, ancillaryData } = log.args);

    // make sure revision can not be executed before approval
    await expect(list.executeRevision(2, REMOVALS)).to.be.reverted;

    // push forward timestamp
    await provider.send("evm_increaseTime", [LIVENESS * 2]);

    // call settle on OOV2
    OOV2 = new ethers.Contract(OOV2_ADDRESS, OOV2Interface, signer1);
    const tx2 = await OOV2.settle(
      requester,
      identifier,
      timestamp,
      ancillaryData
    );

    // should emit revision approved event
    await expect(tx2).to.emit(list, "RevisionApproved");

    // call executeRevision
    const tx3 = list.executeRevision(2, REMOVALS);
    await expect(tx3).to.emit(list, "RevisionExecuted");
    await expect(tx3).to.changeTokenBalances(
      wethContract,
      [listAddress, signer1.address],
      [-REMOVALS.length * REMOVE_REWARD, REMOVALS.length * REMOVE_REWARD]
    );

    // check that addresses are mapped to true onList
    const addressBools = REMOVALS.map((address) => {
      return list.onList(address);
    });

    await Promise.all(addressBools);

    let success = true;
    // success if all addressBools are false
    for (const bool of addressBools) {
      if (bool) {
        success = false;
        return;
      }
    }

    expect(success).to.equal(true);
  });

  it("Remove Addresses with overlapping address array", async function() {
    const REMOVALS = ADDRESSES.slice(3, 8);

    const tx1 = await list.proposeRevision(0, REMOVALS);

    await expect(tx1).to.emit(list, "RevisionProposed");

    //get OO request data
    const receipt1 = await tx1.wait();
    let log = OOV2Interface.parseLog(receipt1.logs[0]);
    ({ requester, identifier, timestamp, ancillaryData } = log.args);

    // make sure revision can not be executed before approval
    await expect(list.executeRevision(3, REMOVALS)).to.be.reverted;

    // push forward timestamp
    await provider.send("evm_increaseTime", [LIVENESS * 2]);

    // call settle on OOV2
    OOV2 = new ethers.Contract(OOV2_ADDRESS, OOV2Interface, signer1);
    const tx2 = await OOV2.settle(
      requester,
      identifier,
      timestamp,
      ancillaryData
    );

    // should emit revision approved event
    await expect(tx2).to.emit(list, "RevisionApproved");

    // call executeRevision
    const tx3 = list.executeRevision(3, REMOVALS);
    await expect(tx3).to.emit(list, "RevisionExecuted");
    await expect(tx3).to.changeTokenBalances(
      wethContract,
      [listAddress, signer1.address],
      //7 addresses proposed for removal, but only 3 are on list to remove
      [-3 * REMOVE_REWARD, 3 * REMOVE_REWARD]
    );

    // check that addresses are mapped to true onList
    const addressBools = REMOVALS.map((address) => {
      return list.onList(address);
    });

    await Promise.all(addressBools);

    let success = true;
    // success if all addressBools are false
    for (const bool of addressBools) {
      if (bool) {
        success = false;
        return;
      }
    }

    expect(success).to.equal(true);
  });

  it("Construct Address List", async function() {
    const addressList = [];
    const removedAddresses = [];
    const eventInterface = new ethers.utils.Interface(DECENTRALIST_ABI);

    let queries = await list.queryFilter("RevisionExecuted");

    // loop over all events found
    queries.forEach((query, i) => {
      //decode event data
      const data = eventInterface.decodeEventLog(
        "RevisionExecuted",
        query.data
      );
      //handle adds
      if (data.proposedValue.eq(ethers.utils.parseEther("1"))) {
        data.revisedAddresses.forEach((address) => {
          if (address !== "0x0000000000000000000000000000000000000000") {
            const index = addressList.indexOf(address);
            if (index === -1) {
              addressList.push(address);
            }
          }
        });
        // handle removals
      } else if (data.proposedValue.eq(0)) {
        data.revisedAddresses.forEach((address) => {
          removedAddresses.push(address);
          if (address !== "0x0000000000000000000000000000000000000000") {
            const index = addressList.indexOf(address);
            if (index !== -1) {
              addressList.splice(index, 1);
            }
          }
        });
      }
    });

    // check onList bool value of addresses added and removed
    const addressesOnList = addressList.map((address) => {
      return list.onList(address);
    });
    const addressesOffList = removedAddresses.map((address) => {
      return list.onList(address);
    });
    await Promise.all(addressesOnList);
    addressesOnList.forEach((bool) => {
      expect(bool);
    });
    await Promise.all(addressesOffList);
    addressesOffList.forEach((bool) => {
      expect(!bool);
    });
  });

   // SMART CONTRACT GATING OF PRICE SETTLED FUNCTION HAS TO BE COMMENTED OUT FOR THIS TEST
    it("Disputed Revision", async function () {
    const tx1 = await list.proposeRevision(YES, ADDRESSES);

    await expect(tx1).to.emit(list, "RevisionProposed");

    //get OO request data
    const receipt1 = await tx1.wait();
    let log = OOV2Interface.parseLog(receipt1.logs[0]);
    ({ requester, identifier, timestamp, ancillaryData } = log.args);
    
    //call ungated fallback function as if the request was successfully disputed
    const tx2 = await list.priceSettled(identifier, timestamp, ancillaryData, 0);
    await expect(tx2).to.emit(list, "RevisionRejected");

    // make sure revision can not be executed after rejection
    await expect(list.executeRevision(3, ADDRESSES)).to.be.reverted;
  });

  it("Only owner can adjust parameters", async function() {
    list = Decentralist.attach(listAddress);
    await list.setRewards(ADD_REWARD + 100, REMOVE_REWARD + 100);
    await list.setBond(BOND_AMOUNT + 100);
    await list.setLiveness(LIVENESS + 100);

    expect(await list.additionReward()).to.equal(ADD_REWARD + 100);
    expect(await list.removalReward()).to.equal(REMOVE_REWARD + 100);
    expect(await list.bondAmount()).to.equal(BOND_AMOUNT + 100);
    expect(await list.liveness()).to.equal(LIVENESS + 100);

    list = Decentralist.attach(listAddress).connect(signer2);

    // eslint-disable-next-line no-unused-expressions
    await expect(list.setBond(BOND_AMOUNT + 100)).to.be.reverted;
  });

  it("Bond and liveness can not be set below minimums", async function() {
    list = Decentralist.attach(listAddress);
    await expect(list.setBond(ethers.utils.parseEther("0.1"))).to.be.revertedWith('bond must be >= final fee')
    await expect(list.setLiveness(MINIMUM_LIVENESS - 1000)).to.be.revertedWith('liveness must be >= minimumLiveness')
  });


    describe(`Test bond and rewards for ${MAINNET_TOKENS.length} mainnet whitelisted tokens`, async function() {
    let swapFailCounter = 0;
    
    MAINNET_TOKENS.forEach(async (tokenAddress, i) => {
      it(`${tokenAddress}`, async function() {
        const addressToAdd = ["0xac21e8867f4EC67fd1c03f0cfFB6c2961fD45a4b"];

        const tokenContract = new ethers.Contract(
          tokenAddress,
          WETH_ABI,
          signer1
        );
        let symbol;
        try{
          symbol = await tokenContract.symbol();
        } catch (error) {
          console.log("error getting token symbol")
        }

        const storeContract = new ethers.Contract(
          "0x54f44eA3D2e7aA0ac089c4d8F7C93C27844057BF",
          UMA_STORE_ABI,
          signer1
        );
        const finalFee = await storeContract.finalFees(tokenAddress);

        const tx1 = await proxyFactory.createNewDecentralist(
          "0x74657374",
          "TEST",
          tokenAddress,
          finalFee,
          ADD_REWARD,
          REMOVE_REWARD,
          LIVENESS,
          signer1.address
        );

        const receipt = await tx1.wait();
        listAddress = receipt.logs[0].address;

        if (tokenAddress !== WETH_ADDRESS) {
          try {
            //swap WETH for token. amount = bond(2x finalFee) + reward
            await wethContract.approve(
              UNI_SWAP_ROUTER_ADDRESS,
              ethers.utils.parseEther("10000")
            );
            const uniContract = new ethers.Contract(
              UNI_SWAP_ROUTER_ADDRESS,
              UNI_SWAP_ROUTER_ABI,
              signer1
            );
            await uniContract.exactOutputSingle({
              tokenIn: WETH_ADDRESS,
              tokenOut: tokenAddress,
              fee: 3000,
              recipient: signer1.address,
              deadline: Date.now() * 2,
              amountOut: finalFee.mul(3),
              amountInMaximum: ethers.utils.parseEther("10000"),
              sqrtPriceLimitX96: 0,
            });
          } catch (error) {
            swapFailCounter ++;
            // if token swap cannot be found, console log token & return without error
            console.log(`${symbol} swap not found - #${swapFailCounter} - test cancelled`);
            return;
          }
        }
        //transfer reward to list
        await tokenContract.transfer(listAddress, ADD_REWARD * 1.5);
        //approve bond amount to list
        await tokenContract.approve(
          listAddress,
          ethers.utils.parseEther("10000")
        );

        //create list contract
        const listContract = Decentralist.attach(listAddress).connect(signer1);

        //propose revision to add addresses
        const tx6 = await listContract.proposeRevision(YES, addressToAdd);
        //check that event is emitted
        await expect(tx6).to.emit(listContract, "RevisionProposed");
        //check that allowance from list to OOV2 is 0
        const allowance = await tokenContract.allowance(listAddress, OOV2_ADDRESS);
        expect(allowance).to.equal(0);

        //get OO request data
        const receipt1 = await tx6.wait();
        let log = OOV2Interface.parseLog(receipt1.logs[0]);
        ({ requester, identifier, timestamp, ancillaryData } = log.args);
        await provider.send("evm_increaseTime", [LIVENESS * 2]);
        // call settle on OOV2
        OOV2 = new ethers.Contract(OOV2_ADDRESS, OOV2Interface, signer1);
        await OOV2.settle(
          requester,
          identifier,
          timestamp,
          ancillaryData
        );
        // call executeRevision
        const tx8 = await listContract.executeRevision(1, addressToAdd);
        await expect(tx8).to.emit(listContract, "RevisionExecuted");
        await expect(tx8).to.changeTokenBalances(
          tokenContract,
          [listAddress, signer1.address],
          [-ADD_REWARD, ADD_REWARD]
        );
      });
    }); 
  })
});

function generateAddressArray(length) {
  const array = [];
  for (let i = 0; i < length; i++) {
    let address = Math.round(Math.random() * 1000000);
    address = address.toString(16);
    address = address.padStart(40, address);
    address = "0x" + address;
    array[i] = address;
  }
  return array;
}
