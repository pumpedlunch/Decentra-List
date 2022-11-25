const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect, assert, anyValue } = require("chai");

const ERC20_ABI = require("../public/abis/WETH.json");
const WETH_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; //goerli
const FINDER_ADDRESS = "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e"; //goerli
const OOV2_ABI = require("../public/abis/OptimisticOracleV2.json");
const { providers } = require("ethers");
const OOV2_ADDRESS = "0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884"; //goerli
const OOV2Interface = new ethers.utils.Interface(OOV2_ABI);

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
  token,
  requester,
  identifier,
  timestamp,
  ancillaryData;

// list args
const LIST_CRITERA =
  "0x4469642074686520616464726573732062656C6F7720706172746963697061746520696E2058206861636B206261736564206F6E20592063726974657269613F";
const TITLE = "X Hackers";
const TOKEN = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; //Goerli WETH
const BOND_AMOUNT = 200;
const ADD_REWARD = 100;
const REMOVE_REWARD = 50;
const LIVENESS = 1;
const ADDRESSES = generateAddressArray(134); //set address array length here

describe("DecentraList Test", function () {
  it("deploys DecentraList and ProxyFactory", async function () {
    // GET SIGNERS
    [signer1, signer2] = await hre.ethers.getSigners();
    console.log("signer1: ", signer1.address);
    console.log("signer2: ", signer2.address);

    // DEPLOY DECENTRALIST
    Decentralist = await hre.ethers.getContractFactory("Decentralist");
    decentralist = await Decentralist.deploy();
    await decentralist.deployed();

    console.log(`Decentralist deployed to ${decentralist.address}`);

    // DEPLOY PROXY FACTORY
    const DecentralistProxyFactory = await hre.ethers.getContractFactory(
      "DecentralistProxyFactory"
    );
    proxyFactory = await DecentralistProxyFactory.deploy(
      decentralist.address,
      FINDER_ADDRESS
    );
    await proxyFactory.deployed();

    console.log(`Proxy Factory deployed to ${proxyFactory.address}`);

    expect(decentralist.address).to.be.a.properAddress;
    expect(proxyFactory.address).to.be.a.properAddress;
  });

  it("create new list", async function () {
    let tx1 = await proxyFactory.createNewDecentralist(
      LIST_CRITERA,
      TITLE,
      TOKEN,
      BOND_AMOUNT,
      ADD_REWARD,
      REMOVE_REWARD,
      LIVENESS,
      signer1.address
    );
    tx1 = await tx1.wait();
    listAddress = tx1.logs[0].address;
    console.log(`New List deployed to: ${listAddress}`);

    expect(listAddress).to.be.a.properAddress;
  });

   /* it("owner can adjust parameters", async function () {
    list = Decentralist.attach(listAddress);
    const tx2 = await list.setRewards(ADD_REWARD + 100, REMOVE_REWARD + 100);
    const tx3 = await list.setBond(BOND_AMOUNT + 100);
    const tx4 = await list.setLiveness(LIVENESS + 1);

    expect(await list.addReward()).to.equal(ADD_REWARD + 100);
    expect(await list.removeReward()).to.equal(REMOVE_REWARD + 100);
    expect(await list.bondAmount()).to.equal(BOND_AMOUNT + 100);
    expect(await list.liveness()).to.equal(LIVENESS + 1);
  });

  it("non-owner cant adjust parameters", async function () {
    list = Decentralist.attach(listAddress).connect(signer2);

    expect(list.setBond(BOND_AMOUNT + 100)).to.be.reverted;
  }); */

  it("Add Addresses", async function () {
    // APPROVE TOKEN SPEND FOR BOND
    token = new ethers.Contract(TOKEN, ERC20_ABI, signer1);
    const approveTx = await token.approve(
      listAddress,
      ethers.utils.parseEther("1")
    );

    // TRANSFER TOKENS FOR REWARDS
    const transferTx = await token.transfer(listAddress, 100000);

    //create list contract
    list = Decentralist.attach(listAddress).connect(signer1);

    //propose revision to add addresses
    let tx1 = await list.proposeRevision(YES, ADDRESSES);
    await expect(tx1).to.emit(list, "RevisionProposed");


    //get OO request data
    const receipt1 = await tx1.wait()  
    console.log(receipt1)
    let log = OOV2Interface.parseLog(receipt1.logs[0]);
    ({ requester, identifier, timestamp, ancillaryData } = log.args);

    console.log(
      `PROPOSE ${ADDRESSES.length} ADDRESSES GAS USED:`,
      receipt1.gasUsed.toNumber()
    );

    // make sure revision can not be executed before approval
    await expect(list.executeRevision(1, ADDRESSES)).to.be.reverted;

    // push forward timestamp
    await provider.send("evm_increaseTime", [3600]);

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
    // await expect(tx3).to.changeTokenBalances(
    //   token,
    //   [listAddress, signer1.address],
    //   [-ADDRESSES.length * ADD_REWARD, ADDRESSES.length * ADD_REWARD]
    // );

    const receipt3 = await tx3.wait();
    console.log(
      `EXECUTE ${ADDRESSES.length} ADDRESSES GAS USED:`,
      receipt3.gasUsed.toNumber()
    );

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

 /*  it("Remove Addresses", async function () {
    const REMOVALS = ADDRESSES.splice(0,5);

    const tx1 = await list.proposeRevision(0, REMOVALS);

    await expect(tx1).to.emit(list, "RevisionProposed");

    //get OO request data
    const receipt1 = await tx1.wait();
    let log = OOV2Interface.parseLog(receipt1.logs[0]);
    ({ requester, identifier, timestamp, ancillaryData } = log.args);
    
    // make sure revision can not be executed before approval
    await expect(list.executeRevision(2, REMOVALS)).to.be.reverted;

    // push forward timestamp
    await provider.send("evm_increaseTime", [3600])

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
        token,
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
  }); */

  /* it("Remove Addresses with overlapping address array", async function () {
    const REMOVALS = ADDRESSES.splice(0,3);

    const tx1 = await list.proposeRevision(0, REMOVALS);

    await expect(tx1).to.emit(list, "RevisionProposed");

    //get OO request data
    const receipt1 = await tx1.wait();
    let log = OOV2Interface.parseLog(receipt1.logs[0]);
    ({ requester, identifier, timestamp, ancillaryData } = log.args);
    
    // make sure revision can not be executed before approval
    await expect(list.executeRevision(3, REMOVALS)).to.be.reverted;

    // push forward timestamp
    await provider.send("evm_increaseTime", [3600])

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
        token,
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
  }); */

/*   it("Disputed Revision", async function () {
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
  }); */

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
