const { ethers } = require("hardhat");
const provider = ethers.provider;
const VOTING_ABI = require("../../public/ABIs/Voting.json");
const VOTING_ADDRESS = "0x8B1631ab830d11531aE83725fDa4D86012eCCd77";

const SECONDS_PER_BLOCK = 13.3;
const TARGET_VOTE_RATE = 0.8; // 80%
const TIME_PERIOD = 180 * 24 * 60 * 60; // 180 days

const REQUEST_BLOCK = 16549899; // update to time of request

const votingContract = new ethers.Contract(
  VOTING_ADDRESS,
  VOTING_ABI,
  provider
);

const PREVIOUS_LIST = [
  "0xdb19c47e87ed3ff37425a99b9dee1f4920f755b9",
  "0x81447efe30c9c4958774114f46e8689317fac29a",
  "0x5cea80211fcc9afd401c4d9a7042dbf8c08a82cc",
  "0xd1f8f4e8c4ae63964efb761a97503c128b7fa732",
  "0xf445567e961c533e26430005c142dee831a6376e",
  "0x384d91e6b8d032ab9d844eb58b85df6543e616f0",
  "0xa4e3555ab4bb3edd2f50b82279d30d6b49261fcc",
  "0xddb751f0a4a9f33d277667ab81560bfeefb466bc",
  "0xd02eeb3e32108131d1516774a8b108430302f4ba",
  "0xd2a78bb82389d30075144d17e782964918999f7f",
  "0xb5eeddff4641fea71c0b9a344aed1a49e38e55d5",
  "0x80cd5224a98ee004229bb1e6a59c829501f94b72",
  "0xbbb5312ef2a76f29cdf9e907863464c16e24210f",
  "0xf9d0de258931d88e370245ebf8b40119ec91912b",
  "0x8b64673c9a482913a6e2c1298637532947cd96ee",
  "0xe6b5a31d8bb53d2c769864ac137fe25f4989f1fd",
  "0x2367432dc27e2e96b7ab8a0b0e4fcb28dd5a1c1f",
  "0xd9aaeeaa94fad39baf37b713e833105227bf1476",
  "0x78b40fe45f4cd5fc26241dee20fc6b4d131c0197",
  "0xf7078c14a4c1d91ada1047539e6f9e9eb2b9e1a9",
  "0xdf67cba8261c6d8c15c735009f61e2cc9f852de3",
  "0xec6d05b23ad13844f0f37156ef96abb8b5de8296",
  "0x48c7e0db3dad3fe4eb0513b86fe5c38ebb4e0f91",
  "0x69d0341d380a1229f4751a0a721345dbc716586c",
  "0x47e87a4429636a7bbebaff101c9697e3941ce117",
  "0xd9f9f15e1dcda849a48ee048892c9b31287c7598",
  "0xf361f2d82d091800ccf7a7aa09e3cac1b6d87882",
  "0x30b2daeb3757b6c7462cd0d776828f8d7398be50",
  "0x110f0b1faa1cb6eed49883f960808c95f609f6fd",
  "0xee160154b02a2e404c6c13ff0b28ed76010cf07d",
  "0x71dcd1a51d578fb333eef9d850c36d80e276ccc1",
  "0xf95c72caa240c856c57b3c12d78ad33d68e62e22",
  "0x7ca3d1cf91f8cdd2fc31c34674d34ed1c4ff8e0f",
  "0xa3f76c31f57da65b0ce84c64c25e61bf38c86bed",
  "0x0c88e2a51ad8e9b21271c7771f1dde229ce588f5",
  "0xeed339990e56ac554215ae9e1aa8d81a6e40b84b",
  "0x0bf515d18d0ee365cafec3da0a1af1e606c04936",
  "0x9b34321f89361a8d6489c5dddd70e0556239922b",
  "0xfcc544de1df80ee89e1d6a236fa9f8e89ee5804f",
  "0x4fcc940e1e890ae00dbfa66fde55329533427810",
  "0xfc204fcfd2a579157898a212ea25ac98de2b1e1c",
  "0xfebac9943387484723f18a5ff91279c04d26c2e0",
  "0x537860d48d589364c9d86e115e608702fee4375c",
  "0x5963d72760d2703c35b4b3cc7eda0b425d10788d",
  "0x6352f003ca2ee26e2e6fa2077acaaaa29184cd3d",
  "0xe63757e3cd485c9b35b3a972fffa2d91b8649483",
  "0xdb2808ed6cf0b8b9686222689cf4f6e88e42b80a",
  "0xea7c2df8ab95bf0af91f8e4034b493733aca21df",
  "0x330a3c103620214a6236c1acbe6e1452f3f1aae9",
  "0xe6fcb51c7ee5d15a5c8fc2b23d167db6a963c799",
];

async function main() {

  // ----- GET CLOSEST BLOCK TO REQUESTED BLOCKS TIMESTAMP MINUS TIME_PERIOD ------

  //get request block timestamp
  const requestTime = (await provider.getBlock(REQUEST_BLOCK)).timestamp;

  //get current block number
  const targetTime = requestTime - TIME_PERIOD;

  // initial guess at starting block number
  let blockNo = REQUEST_BLOCK - Math.round(TIME_PERIOD / SECONDS_PER_BLOCK);
  let blockTime = (await provider.getBlock(blockNo)).timestamp;
  let timeGap = targetTime - blockTime;

  // get approx starting block number
  let counter = 0;
  while (Math.abs(timeGap) > 60) {
    blockNo += Math.round(timeGap / SECONDS_PER_BLOCK);

    blockTime = (await provider.getBlock(blockNo)).timestamp;
    timeGap = targetTime - blockTime;
    counter++;
    if (counter > 20) {
      console.log(
        "approx starting block number stuck in loop"
      );
      return;
    }
  }

  // get best starting block number
  let nextBlockNo = blockNo,
    nextTimeGap;

  do {
    if (timeGap > 0) {
      nextBlockNo += 1;
    } else {
      nextBlockNo -= 1;
    }
    nextTimeGap = targetTime - (await provider.getBlock(nextBlockNo)).timestamp;
    counter++;
  } while (timeGap * nextTimeGap > 0);

  if (Math.abs(timeGap) > Math.abs(nextTimeGap)) {
    blockNo = nextBlockNo;
  }

  // ----- GET ADDRESSES THAT MEET LIST CRITERIA FOR TIME PERIOD ------

  // get total number of voting opportunities
  let votingOpps = await votingContract.queryFilter("PriceResolved", blockNo);

  const roundIds = votingOpps.map((votingOpp) => {
    return votingOpp.args.roundId.toNumber();
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
    const index = addressesOverVoteRate.findIndex(
      (el) => el.toLowerCase() === address.toLowerCase()
    );
    if (index === -1) addressesToRemove.push(address);
  }

  // get addresses for adding to list
  const addressesToAdd = [];
  for (let address of addressesOverVoteRate) {
    const index = PREVIOUS_LIST.findIndex(
      (el) => el.toLowerCase() === address.toLowerCase()
    );
    if (index === -1) addressesToAdd.push(address);
  }

  // ----- PRINT OUT ------

  console.log("SEARCH CRITERIA:");
  console.log(
    `Searching from block #${blockNo} to request block #${REQUEST_BLOCK} for a time period of ${(requestTime -
      blockTime) /
      (24 * 60 * 60)} days`
  );
  console.log(`Target vote rate = ${TARGET_VOTE_RATE * 100}%`);
  console.log(
    `${PREVIOUS_LIST.length} address were on the previous list that will be checked for valid additions or removals.`
  );

  console.log("\nDATA:");
  console.log(
    `There were ${votingOpps.length} resolved prices within the time period.`
  );
  console.log("Resolved prices occurred in the following round IDs:");
  console.log(roundIds);

  console.log(
    `Minimum number of votes revealed within time period for an address to meet criteria = ceiling(${
      votingOpps.length
    } * ${TARGET_VOTE_RATE * 100}%) = ${Math.ceil(
      votingOpps.length * TARGET_VOTE_RATE
    )}`
  );
  console.log(
    `${addressesOverVoteRate.length} address meet the criteria for this time period.`
  );

  console.log("\nVALID REVISIONS FOR THIS TIME PERIOD:");
  console.log(
    `${addressesToAdd.length} Addresses are valid for addition to the list:`
  );
  console.log(addressesToAdd);
  console.log(
    `${addressesToRemove.length} Addresses are valid for removal from the list:`
  );
  console.log(addressesToRemove);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
