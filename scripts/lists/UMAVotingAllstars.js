const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const provider = ethers.provider;
const VOTING_ABI = require("../../public/ABIs/Voting.json");
const VOTING_ADDRESS = "0x8B1631ab830d11531aE83725fDa4D86012eCCd77";

const SECONDS_PER_BLOCK = 13.1;
const TARGET_VOTE_RATE = 0.8; // 80%
const TIME_PERIOD = 180 * 24 * 60 * 60; // 180 days

const REQUEST_BLOCK = 16529263; // update to time of request

const votingContract = new ethers.Contract(
  VOTING_ADDRESS,
  VOTING_ABI,
  provider
);

const PREVIOUS_LIST = [
  
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

  console.log(votesByAddress);

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
    const index = addressesOverVoteRate.findIndex((el) => el.toLowerCase() === address.toLowerCase());
    if (index === -1) addressesToRemove.push(address);
  }

  // get addresses for adding to list
  const addressesToAdd = [];
  for (let address of addressesOverVoteRate) {
    const index = PREVIOUS_LIST.findIndex((el) => el.toLowerCase() === address.toLowerCase());
    if (index === -1) addressesToAdd.push(address);
  }

  console.log(`Time period = ${TIME_PERIOD} sec`);
  console.log("Round IDs in Period:");
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
