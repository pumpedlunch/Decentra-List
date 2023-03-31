import { ethers } from "ethers";
const FACTORY_ABI =
  require("../../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json").abi;
const DECENTRALIST_ABI =
  require("../../artifacts/contracts/Decentralist.sol/Decentralist.json").abi;
const WETH_ABI = require("../../../public/ERC20_ABI");
const UMA_STORE_ABI = require("../../../public/UMAStore.json");
const EVENT_INTERFACE = new ethers.utils.Interface(DECENTRALIST_ABI);
import { CHAINS } from "../../utils/constants";

export default async function getLists(req, res) {
  const network = req.body.network;
  const address = req.body.address;
  const provider = new ethers.providers.JsonRpcProvider(CHAINS[network].API_URL);

  let fixedAncillaryData,
    totalBond,
    addReward,
    removeReward,
    liveness,
    livenessUnits,
    owner,
    balance,
    tokenSymbol,
    tokenDecimals,
    tokenAddress,
    addressList = [],
    proposedRevisions = [],
    approvedRevisions = [];

  const listContract = new ethers.Contract(
    address,
    DECENTRALIST_ABI,
    provider
  );

  tokenAddress = await listContract.token();

  const tokenContract = new ethers.Contract(
    tokenAddress,
    WETH_ABI,
    provider
  );
  const storeContract = new ethers.Contract(
    CHAINS[network].storeAddress,
    UMA_STORE_ABI,
    provider
  );

  const promises = [];
  promises.push(
    listContract.fixedAncillaryData(),
    listContract.bondAmount(),
    listContract.additionReward(),
    listContract.removalReward(),
    listContract.liveness(),
    listContract.owner(),
    tokenContract.balanceOf(address),
    tokenContract.symbol(),
    tokenContract.decimals(),
    storeContract.finalFees(tokenAddress)
  );

  await Promise.all(promises).then((values) => {
    fixedAncillaryData = 
    ethers.utils
      .toUtf8String(values[0])
      .replace(
        "meet the List Criteria at the time of the price request? List Criteria: ",
        ""
      )
      .replace(" Decentra-List Revision ID = ", "");
    totalBond = values[1].add(values[9]).toString();
    addReward = values[2].toString();
    removeReward = values[3].toString();
    if (values[4] > 60 * 60) {
      liveness = values[4].div(60 * 60).toString();
      livenessUnits = "hours";
    } else {
      liveness = values[4].toString();
      livenessUnits = "seconds";
    }
    owner = values[5];
    balance = values[6].toString();
    tokenSymbol = values[7];
    tokenDecimals = values[8];
    tokenAddress = tokenAddress;
  });

  // build list of addresses
  // get revision executed events
  let queries = await listContract.queryFilter("RevisionExecuted");
  // loop over all events found
  queries.forEach((query, i) => {
    //decode event data
    const data = EVENT_INTERFACE.decodeEventLog("RevisionExecuted", query.data);
    //handle adds
    if (data.revisionType === 1) {
      data.revisedAddresses.forEach((address) => {
        if (address !== "0x0000000000000000000000000000000000000000") {
          const index = addressList.indexOf(address);
          if (index === -1) {
            addressList.push(address);
          }
        }
      });
      // handle removals
    } else if (data.revisionType === 0) {
      data.revisedAddresses.forEach((address) => {
        if (address !== "0x0000000000000000000000000000000000000000") {
          const index = addressList.indexOf(address);
          if (index !== -1) {
            addressList.splice(index, 1);
          }
        }
      });
    }
  });

  //get revision statuses & store proposed (status = 1) and approved revisions (status = 2)
  let status;
  let revisionId = 1;

  do {
    let proposer, revisionType;
    [proposer, , revisionType, status] = await listContract.revisions(
      revisionId
    );

    if (status === 1 || status === 2) {
      // get proposedAddresses
      const filter = listContract.filters.RevisionProposed(revisionId);
      const event = await listContract.queryFilter(filter);

      //decode event data
      const data = EVENT_INTERFACE.decodeEventLog(
        "RevisionProposed",
        event[0].data
      );
      if (status === 1) {
        proposedRevisions.push({
          revisionId: revisionId,
          revisionType: revisionType,
          proposedAddresses: data.proposedAddresses
            .toString()
            .replaceAll(",", ", "),
          oracleURL:
            `https://${
              network !== "0x1" ? "testnet." : ""
            }oracle.umaproject.org/request?transactionHash=` +
            event[0].transactionHash +
            "&chainId=" +
            parseInt(network) +
            "&oracleType=OptimisticV2&eventIndex=0",
        });
      } else if (status === 2) {
        approvedRevisions.push({
          revisionId: revisionId,
          proposer: proposer,
          proposedAddresses: data.proposedAddresses,
        });
      }
    }
    revisionId++;
  } while (status !== 0);

  res.status(200).json({
    fixedAncillaryData: fixedAncillaryData,
    totalBond: totalBond,
    addReward: addReward,
    removeReward: removeReward,
    liveness: liveness,
    livenessUnits: livenessUnits,
    owner: owner,
    balance: balance,
    tokenSymbol: tokenSymbol,
    tokenDecimals: tokenDecimals,
    tokenAddress: tokenAddress,
    addressList: addressList,
    proposedRevisions: proposedRevisions,
    approvedRevisions: approvedRevisions,
  });
}
