const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const provider = ethers.provider;
const VOTING_ABI = require("../public/ABIs/Voting.json");
const VOTING_ADDRESS = "0x8B1631ab830d11531aE83725fDa4D86012eCCd77";

const SECONDS_PER_BLOCK = 13.1;
const TARGET_VOTE_RATE = 0.8;
const TIME_PERIOD = 180 * 24 * 60 * 60;

const REQUEST_BLOCK = 16486818; // update to time of request

const votingContract = new ethers.Contract(
  VOTING_ADDRESS,
  VOTING_ABI,
  provider
);

const PREVIOUS_LIST = [
  /* "0x384D91E6b8D032AB9D844EB58B85dF6543e616F0",
  "0x5CEA80211fcC9aFD401C4D9A7042dBf8c08a82cc",
  "0xFCc544DE1dF80Ee89E1d6a236fa9F8E89EE5804F",
  "0x4fCC940e1e890AE00DbFa66FdE55329533427810",
  "0xFc204FCfd2A579157898A212ea25Ac98de2b1E1C",
  "0x5963D72760d2703C35B4b3cc7EdA0b425D10788D",
  "0xea7c2df8AB95Bf0AF91F8E4034B493733ACa21dF",
  "0x0bF515D18d0Ee365CaFEc3da0A1af1E606C04936",
  "0x9b34321f89361a8d6489C5DdDD70e0556239922b",
  "0xD067baeAb52Dc02A384570542525d5035b9dc85A",
  "0xdB19c47E87Ed3Ff37425a99B9Dee1f4920F755b9",
  "0xF7078C14A4C1D91ada1047539E6F9E9EB2b9E1a9",
  "0xD2A78Bb82389D30075144d17E782964918999F7f",
  "0xddb751f0a4a9f33d277667aB81560BfeEfB466bc",
  "0x330a3c103620214a6236C1ACBE6E1452F3f1aAE9",
  "0xDF67cbA8261c6D8C15c735009F61e2CC9F852DE3",
  "0xD02EeB3e32108131d1516774a8B108430302f4BA",
  "0xe63757E3cD485C9b35b3a972fFFA2d91B8649483",
  "0x8B64673c9a482913a6e2c1298637532947cD96eE",
  "0xf361F2d82D091800Ccf7A7aa09e3CAC1B6d87882",
  "0xeE160154b02A2e404c6c13ff0B28Ed76010cf07d",
  "0xfebAc9943387484723f18A5Ff91279C04d26c2e0",
  "0xD9F9F15e1DCdA849a48EE048892C9B31287C7598",
  "0xF95C72Caa240C856c57b3C12D78AD33d68E62E22",
  "0x110f0b1FAa1cB6EEd49883f960808C95F609f6fd",
  "0xac21e8867f4EC67fd1c03f0cfFB6c2961fD45a4b", */
];

async function main() {
  //get current block number
  const targetTime =
    (await provider.getBlock(REQUEST_BLOCK)).timestamp - TIME_PERIOD;

  // initial guess at block number
  let blockNo =
    REQUEST_BLOCK - Math.round((365 * 24 * 60 * 60) / SECONDS_PER_BLOCK);
  let blockTime = (await provider.getBlock(blockNo)).timestamp;
  let timeGap = targetTime - blockTime;

  // get accurate block number
  while (Math.abs(timeGap) > 20) {
    blockNo += Math.round(timeGap / SECONDS_PER_BLOCK);

    blockTime = (await provider.getBlock(blockNo)).timestamp;
    timeGap = targetTime - blockTime;
  }
  console.log(`Searching from block #${blockNo} to #${REQUEST_BLOCK}`);

  // get total number of voting opportunities
  let votingOpps = await votingContract.queryFilter("PriceResolved", blockNo);

  const roundIds = votingOpps.map((opps) => {
    return opps.args.roundId.toNumber();
  });

  // create filter with valid roundIds 
  const filter = votingContract.filters.VoteRevealed(null, roundIds, null);
    // get revealed votes
  const revealedVotes = await votingContract.queryFilter(filter);

  //tally votes by address
  const votesByAddress = {};
  revealedVotes.forEach((vote) => {
    if (!votesByAddress[vote.args[0]]) {
      votesByAddress[vote.args[0]] = 1;
    } else {
      votesByAddress[vote.args[0]] += 1;
    }
  });



  // get addresses over TARGET_VOTE_RATE
  const addressesOverVoteRate = [];
  for (let address in votesByAddress) {
    const voteRate = votesByAddress[address] / votingOpps.length;
    if (voteRate > TARGET_VOTE_RATE) {
      addressesOverVoteRate.push(address);
    }
  }

  // get addresses for removing from list
  const addressesToRemove = [];
  for (let address of PREVIOUS_LIST) {
    const index = addressesOverVoteRate.findIndex((el) => el === address);
    if (index === -1) addressesToRemove.push(address);
  }

  // get addresses for adding to list 
  const addressesToAdd = [];
  for (let address of addressesOverVoteRate) {
    const index = PREVIOUS_LIST.findIndex((el) => el === address);
    if (index === -1) addressesToAdd.push(address);
  }

  console.log(`Time period = ${TIME_PERIOD} sec`);
  console.log("Round IDs in Period:")
  console.log(roundIds);
  console.log(`${votingOpps.length} voting opportunities`);
  console.log(`Target vote rate = ${TARGET_VOTE_RATE * 100}%`);
  console.log(
    `${addressesOverVoteRate.length} Voters with > ${TARGET_VOTE_RATE *
      100}% Vote Rate (${Math.ceil(
      votingOpps.length * TARGET_VOTE_RATE
    )} votes min) \n`
  );
  //   console.log(addressesOverVoteRate);
  console.log(`Previous list length = ${PREVIOUS_LIST.length}`);
  console.log(`${addressesToAdd.length} Addresses to Add:`);
  console.log(addressesToAdd);
  console.log(`${addressesToRemove.length} Addresses to Remove:`);
  console.log(addressesToRemove);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
