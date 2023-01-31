import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import MetaMaskButton from "./metamaskButton";
import AddressModal from "./addressModal";
import ListModal from "./listModal";
import LOGO from "./decentra-list.png";
import ARROW from "./dropdown_arrow.png";

const FACTORY_ABI = require("../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json")
  .abi;
const WETH_ABI = require("../public/WETH_ABI.json");
const UMA_STORE_ABI = require("../public/UMAStore.json");

const DECENTRALIST_ABI = require("../artifacts/contracts/decentralist.sol/Decentralist.json")
  .abi;
const EVENT_INTERFACE = new ethers.utils.Interface(DECENTRALIST_ABI);
const STORE_ADDRESS = {
  "0x5": "0x07417cA264170Fc5bD3568f93cFb956729752B61",
  "0x1": "0x54f44eA3D2e7aA0ac089c4d8F7C93C27844057BF",
};
const FACTORY_ADDRESS = {
  "0x5": "0x44a68aaBDE79B9404b3e9F65a72BA657cd52F146",
  "0x1": "0xb1E6D19DeafC045336DD766Bf345c78e771Ef7eA",
};
const SUPPORTED_CHAIN_IDS = {"0x1": "Mainnet", "0x5": "Goerli"};

export default function List() {
  const [proxyAddresses, setProxyAddresses] = useState([]);
  const [currentProxy, setCurrentProxy] = useState();
  const [addressList, setAddressList] = useState();
  const [addressInput, setAddressInput] = useState("");
  const [totalBond, setTotalBond] = useState("");
  const [addReward, setAddReward] = useState("");
  const [removeReward, setRemoveReward] = useState("");
  const [fixedAncillaryData, setFixedAncillaryData] = useState("");
  const [liveness, setLiveness] = useState("");
  const [livenessUnits, setLivenessUnits] = useState("");
  const [owner, setOwner] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState("");
  const [balance, setBalance] = useState("");
  const [proposedRevisions, setProposedRevisions] = useState([]);
  const [approvedRevisions, setApprovedRevisions] = useState([]);
  const [proposedRevisionsIsOpen, setProposedRevisionsIsOpen] = useState(false);
  const [approvedRevisionsIsOpen, setApprovedRevisionsIsOpen] = useState(false);

  //create list args
  const [listCriteria, setListCriteriaArg] = useState([]);
  const [titleArg, setTitleArg] = useState([]);
  const [livenessArg, setLivenessArg] = useState([]);
  const [bondAmountArg, setBondAmountArg] = useState([]);
  const [addRewardArg, setAddRewardArg] = useState([]);
  const [removeRewardArg, setRemoveRewardArg] = useState([]);
  const [ownerArg, setOwnerArg] = useState([]);
  const [tokenArg, setTokenArg] = useState([]);
  const [proxyTitles, setProxyTitles] = useState([]);
  const [finalFeeArg, setFinalFeeArg] = useState("");
  const [symbolArg, setSymbolArg] = useState([]);
  const [minLivenessArg, setMinLivenessArg] = useState([]);
  const [decimalsArg, setDecimalsArg] = useState();

  //Wallet & Network variables
  const [userAddress, setUserAddress] = useState("");
  //chainId connected to metamask. Set to null if it does not match selectedNetwork
  const [chainId, setChainId] = useState(null);
  //current network dropdown value
  const [selectedNetwork, setSelectedNetwork] = useState("0x5");

  // State variables for modals
  const [addressModalIsOpen, setAddressModalIsOpen] = useState(false);
  const [listModalIsOpen, setListModalIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);

  let [searchParams, setSearchParams] = useSearchParams("chainId", "list");

  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  // -----Page load function-----

  useEffect(() => {
    async function startup() {
      console.log("starting up!");

      updateNetworkAndChainId();
    }

    startup();
  }, []);

  // -----Helper Function-----

  const updateNetworkAndChainId = async () => {
    console.log("updateNetworkAndChainId");
    const isConnected = await checkIfWalletIsConnected();
    let connectedChainId;
    if (isConnected) {
      connectedChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      console.log("connectedChainId:", connectedChainId);
      setChainId(connectedChainId);
    }
    //set selected network based on URL or else connectedChainId
    const UrlChainId = searchParams.get("chainId");
    console.log("UrlChainId:", UrlChainId);
    if (SUPPORTED_CHAIN_IDS[UrlChainId]) {
      setSelectedNetwork(UrlChainId);
      if (connectedChainId === UrlChainId) {
        getLists(connectedChainId);
        const listAddress = searchParams.get("list");
        if (listAddress) {
          updateProxy(listAddress, connectedChainId);
        }
      }
    } else if (SUPPORTED_CHAIN_IDS[connectedChainId]) {
      setSelectedNetwork(connectedChainId);
      getLists(connectedChainId);
    }
  };

  const getLists = async (_chainId) => {
    const factoryContract = new ethers.Contract(
      FACTORY_ADDRESS[_chainId],
      FACTORY_ABI,
      provider
    );
    const _proxyAddresses = await factoryContract.getAllClones();
    const _proxyTitles = _proxyAddresses.map((address) => {
      const proxyContract = new ethers.Contract(address, DECENTRALIST_ABI, provider);
      return proxyContract.title();
    });
    await Promise.all(_proxyTitles).then((_proxyTitles) => {
      setProxyTitles(_proxyTitles);
    });
    setProxyAddresses(_proxyAddresses);
  };

  const updateProxy = async (address, _chainId) => {
    console.log("UPDATING PROXY ", address, _chainId, chainId);
    setCurrentProxy(address);
    setSearchParams({ chainId: _chainId, list: address });
    const listContract = new ethers.Contract(address, DECENTRALIST_ABI, provider);

    const _tokenAddress = await listContract.token();

    const tokenContract = new ethers.Contract(
      _tokenAddress,
      WETH_ABI,
      provider
    );
    console.log("chainId: ", chainId);
    const storeContract = new ethers.Contract(
      STORE_ADDRESS[_chainId],
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
      storeContract.finalFees(_tokenAddress)
    );

    await Promise.all(promises).then((values) => {
      setFixedAncillaryData(
        ethers.utils
          .toUtf8String(values[0])
          .replace(
            "meet the List Criteria at the time of the price request? List Criteria: ",
            ""
          )
          .replace(" Decentra-List Revision ID = ", "")
      );
      setTotalBond(values[1].add(values[9]).toString());
      setAddReward(values[2].toString());
      setRemoveReward(values[3].toString());
      console.log(values[4]);
      console.log(values[4].div(60 * 60).toString());
      if (values[4] > 60 * 60) {
        setLiveness(values[4].div(60 * 60).toString());
        setLivenessUnits("hours");
      } else {
        setLiveness(values[4].toString());
        setLivenessUnits("seconds");
      }
      setOwner(values[5]);
      setBalance(values[6].toString());
      setTokenSymbol(values[7]);
      setTokenDecimals(values[8]);
      setTokenAddress(_tokenAddress);
    });

    // build list of addresses

    const _addressList = [];
    // get revision executed events
    let queries = await listContract.queryFilter("RevisionExecuted");

    // loop over all events found
    queries.forEach((query, i) => {
      //decode event data
      const data = EVENT_INTERFACE.decodeEventLog(
        "RevisionExecuted",
        query.data
      );
      //handle adds
      if (data.revisionType === 1) {
        data.revisedAddresses.forEach((address) => {
          if (address !== "0x0000000000000000000000000000000000000000") {
            const index = _addressList.indexOf(address);
            if (index === -1) {
              _addressList.push(address);
            }
          }
        });
        // handle removals
      } else if (data.revisionType === 0) {
        data.revisedAddresses.forEach((address) => {
          if (address !== "0x0000000000000000000000000000000000000000") {
            const index = _addressList.indexOf(address);
            if (index !== -1) {
              _addressList.splice(index, 1);
            }
          }
        });
      }
    });
    setAddressList(_addressList);

    //get revision statuses & store proposed (status = 1) and approved revisions (status = 2)
    const _proposedRevisions = [];
    const _approvedRevisions = [];
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
          console.log("chainId:", chainId)
          _proposedRevisions.push({
            revisionId: revisionId,
            revisionType: revisionType,
            proposedAddresses: data.proposedAddresses
              .toString()
              .replaceAll(",", ", "),
            oracleURL:
              `https://${_chainId !== "0x1" ? "testnet." : "" }oracle.umaproject.org/request?transactionHash=` +
              event[0].transactionHash +
              "&chainId=" +
              _chainId.replace("0x", "") +
              "&oracleType=OptimisticV2&eventIndex=0",
          });
        } else if (status === 2) {
          _approvedRevisions.push({
            revisionId: revisionId,
            proposer: proposer,
            proposedAddresses: data.proposedAddresses,
          });
        }
      }
      revisionId++;
    } while (status !== 0);

    setProposedRevisions(_proposedRevisions);
    setApprovedRevisions(_approvedRevisions);
  };

  // -----Wallet Functions-----

  async function checkIfWalletIsConnected() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        setUserAddress(account);
        return true;
      } else {
        setUserAddress("");
        return false;
      }
    }
  }

  const connectMetamask = async () => {
    if (!window.ethereum) {
      alert("Please download Metamask to connect");
      return;
    }
    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setUserAddress(account);

    updateNetworkAndChainId();
  };

  const changeMetamaskChainId = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: selectedNetwork,
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }

    //reset list state
    setCurrentProxy("");
    setOwner("");
    setTotalBond("");
    setLiveness("");
    setAddReward("");
    setRemoveReward("");
    setBalance("");
    setTokenSymbol("");
    setFixedAncillaryData("");
    setAddressList();
    setProposedRevisions();
    setApprovedRevisions();

    updateNetworkAndChainId();
  };

  // ----- Handle changed selection functions-----

  const changeSelectedNetwork = async (e) => {
    setSelectedNetwork(e.target.value);

    if (e.target.value === chainId) {
      setSearchParams({ chainId: chainId, list: currentProxy });
    } else {
      setSearchParams();
    }
  };

  const selectProxy = async (e) => {
    updateProxy(e.target.value, chainId);
  };

  // -----Add/Remove Addresses modal functions-----

  const handleAddressInputChange = (event) => {
    setAddressInput(event.target.value);
  };

  const handleSubmitApproval = (event) => {
    event.preventDefault();
    approveTransfer();
  };

  const handleRevisionInput = async (event) => {
    event.preventDefault();
    let price = 0;
    if (isAdd) price = 1;
    const arrayArg = addressInput.replaceAll(" ", "").split(",");

    try {
      const contract = await prepareContract(currentProxy, DECENTRALIST_ABI);
      await contract.proposeRevision(price, arrayArg);
    } catch (error) {
      alert(error);
    }

    closeAddressModal();
  };

  const openAddressModal = (add) => {
    setIsAdd(add);
    setAddressModalIsOpen(true);
  };

  const closeAddressModal = () => {
    setAddressModalIsOpen(false);
  };

  // -----Create List Modal functions-----

  const handleListCriteriaArgChange = (event) => {
    setListCriteriaArg(event.target.value);
  };

  const handleTitleArgChange = (event) => {
    setTitleArg(event.target.value);
  };

  const handleLivenessArgChange = (event) => {
    setLivenessArg(event.target.value);
  };

  const handleBondAmountArgChange = (event) => {
    setBondAmountArg(event.target.value);
  };

  const handleAddRewardArgChange = (event) => {
    setAddRewardArg(event.target.value);
  };

  const handleRemoveRewardArgChange = (event) => {
    setRemoveRewardArg(event.target.value);
  };
  const handleOwnerArgChange = (event) => {
    setOwnerArg(event.target.value);
  };
  const handleTokenArgChange = async (event) => {
    const tokenAddress = event.target.value;
    setTokenArg(tokenAddress);
    if (ethers.utils.isAddress(tokenAddress)) {
      //calc final fee
      const storeContract = new ethers.Contract(
        STORE_ADDRESS[chainId],
        UMA_STORE_ABI,
        provider
      );
      let finalFee = await storeContract.finalFees(tokenAddress);

      //get token decimals and symbols
      const tokenContract = new ethers.Contract(
        tokenAddress,
        WETH_ABI,
        provider
      );
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();

      finalFee = ethers.utils.formatUnits(finalFee.toString(), decimals);

      setSymbolArg(symbol);
      setFinalFeeArg(finalFee.toString());
      setDecimalsArg(decimals);
    } else {
      setFinalFeeArg("");
      setSymbolArg([]);
      setDecimalsArg("");
    }
  };

  const handleSubmitList = (event) => {
    event.preventDefault();
    createList();
    closeListModal();
  };

  const openListModal = async () => {
    const factoryContract = new ethers.Contract(
      FACTORY_ADDRESS[chainId],
      FACTORY_ABI,
      provider
    );
    const minLiveness = await factoryContract.minimumLiveness();
    setMinLivenessArg(minLiveness.toString());

    setListModalIsOpen(true);
  };

  const closeListModal = () => {
    setFinalFeeArg("");
    setListModalIsOpen(false);
  };

  // -----Contract call functions-----

  const approveTransfer = async () => {
    const contract = await prepareContract(tokenAddress, WETH_ABI);
    await contract.approve(currentProxy, totalBond);
  };

  const createList = async () => {
    const contract = await prepareContract(
      FACTORY_ADDRESS[chainId],
      FACTORY_ABI
    );

    try {
      await contract.createNewDecentralist(
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(listCriteria)),
        titleArg,
        tokenArg,
        ethers.utils.parseUnits(bondAmountArg, decimalsArg),
        ethers.utils.parseUnits(addRewardArg, decimalsArg),
        ethers.utils.parseUnits(removeRewardArg, decimalsArg),
        livenessArg,
        ownerArg
      );
    } catch (error) {
      alert(error);
    }
  };

  const executeRevision = async (i) => {
    const contract = await prepareContract(currentProxy, DECENTRALIST_ABI);
    await contract.executeRevision(
      approvedRevisions[i].revisionId,
      approvedRevisions[i].proposedAddresses
    );
  };

  const prepareContract = async (address, ABI) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return new ethers.Contract(address, ABI, signer);
  };

  return (
    <div className="bg-gray-200">
      <AddressModal
        isOpen={addressModalIsOpen}
        closeModal={closeAddressModal}
        isAdd={isAdd}
        handleAddressInputChange={handleAddressInputChange}
        handleRevisionInput={handleRevisionInput}
        handleSubmitApproval={handleSubmitApproval}
      />
      <ListModal
        isOpen={listModalIsOpen}
        closeModal={closeListModal}
        handleListCriteriaArgChange={handleListCriteriaArgChange}
        handleTitleArgChange={handleTitleArgChange}
        handleTokenArgChange={handleTokenArgChange}
        handleLivenessArgChange={handleLivenessArgChange}
        handleBondAmountArgChange={handleBondAmountArgChange}
        handleAddRewardArgChange={handleAddRewardArgChange}
        handleRemoveRewardArgChange={handleRemoveRewardArgChange}
        handleOwnerArgChange={handleOwnerArgChange}
        handleSubmitList={handleSubmitList}
        closeAddressModal={closeAddressModal}
        finalFeeArg={finalFeeArg}
        symbolArg={symbolArg}
        minLivenessArg={minLivenessArg}
      />
      <div className="relative px-20 min-h-screen w-screen">
        <div className="flex justify-between py-3 items-center border-b-2 border-black z-30">
          <div className="">
            <div className="flex flex-w">
              <img src={LOGO} alt="logo" width="90" />
              <div>
                <div className="ml-2">
                  <p className="font-bold font-sans text-3xl text-indigo-900 mt-2">
                    Decentra-List
                  </p>
                  <p className="text-xs font-bold">
                    customizable, decentralized, onchain, address lists
                  </p>
                </div>
                <div className="flex flex-w">
                  <a
                    className="cursor-pointer font-bold font-sans text-xs text-blue-500 ml-2 mt-2 text-underline"
                    href="https://decentra-list.gitbook.io/docs/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Docs🡕
                  </a>
                  <a
                    className="cursor-pointer font-bold font-sans text-xs text-blue-500 ml-2 mt-2 text-underline"
                    href="https://twitter.com/decentralistxyz"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Contact🡕
                  </a>
                  <p className="font-bold font-sans text-xs text-red-500 ml-4 mt-2">
                    *un-audited alpha version deployed on Mainnet and Goerli
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row">
            <select
              className="shadow px-2 rounded-md mr-2 mt-2 h-14 text-sm"
              onChange={changeSelectedNetwork}
              value={selectedNetwork}
            >
              <option value="0x1">Ethereum</option>
              <option value="0x5">Goerli</option>
            </select>
            <MetaMaskButton
              connectMetamask={connectMetamask}
              chainId={chainId}
              selectedNetwork={selectedNetwork}
              userAddress={userAddress}
              changeMetamaskChainId={changeMetamaskChainId}
            />
          </div>
        </div>
        <>
          {chainId === selectedNetwork && userAddress ? (
            <>
              <div className="flex flew-w justify-between items-center">
                <form className="my-3">
                  <label className="ml-2">
                    Select Existing List:
                    <select
                      value={currentProxy}
                      className="bg-blue-300 shadow ml-2 px-2 py-2 rounded-md"
                      onChange={selectProxy}
                    >
                      {proxyAddresses[0] ? (
                        <>
                          <option value="" key="default" hidden></option>
                          {proxyAddresses.map((address, i) => (
                            <option value={address} key={i}>
                              {`${address.slice(0, 6)}... ${proxyTitles[i]}`}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option className="p-5 font-bold">
                          No lists created
                        </option>
                      )}
                    </select>
                  </label>
                </form>
                <div className="my-3">
                  <button
                    type="button"
                    className="text-sm font-bold px-3 py-3 items-center rounded-md bg-[#ace4aa]  text-xs font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={openListModal}
                  >
                    Create New List
                  </button>
                </div>
              </div>

              <div className="flex rounded-lg bg-white px-4 py-2 mb-4 shadow sm:p-2">
                <div className="flex flex-col ">
                  <p className="font-medium text-gray-500">Contract Address:</p>
                </div>
                <a
                  className="cursor-pointer pl-1 font-semibold"
                  href={`https://${chainId !== "0x1" ? `${SUPPORTED_CHAIN_IDS[chainId]}.` : "" }etherscan.io/address/${currentProxy}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {currentProxy ? currentProxy + "🡕" : ""}
                </a>
              </div>
              <div className="flex rounded-lg bg-white px-4 py-2 mb-2 shadow sm:p-2">
                <div className="flex flex-col">
                  <p className="font-medium text-gray-500">Owner Address:</p>
                </div>
                <a
                  className="cursor-pointer pl-1 font-semibold"
                  href={`https://${chainId !== "0x1" ? `${SUPPORTED_CHAIN_IDS[chainId]}.` : "" }etherscan.io/address/${owner}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {owner ? owner + "🡕" : ""}
                </a>
              </div>
              <div>
                <dl className="mt-5 grid grid-cols-1 gap-10 sm:grid-cols-5 text-center">
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Total Bond
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                      {totalBond
                        ? ethers.utils.formatUnits(totalBond, tokenDecimals)
                        : ""}{" "}
                      {tokenSymbol}
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Liveness Period{" "}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                      {liveness ? liveness + " " + livenessUnits : ""}
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Reward / Add
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                      {addReward
                        ? ethers.utils.formatUnits(addReward, tokenDecimals)
                        : ""}{" "}
                      {tokenSymbol}
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Reward / Removal
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                      {removeReward
                        ? ethers.utils.formatUnits(removeReward, tokenDecimals)
                        : ""}{" "}
                      {tokenSymbol}
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Contract Balance
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                      {balance
                        ? ethers.utils.formatUnits(balance, tokenDecimals)
                        : ""}{" "}
                      {tokenSymbol}
                    </dd>
                  </div>
                </dl>
                <dl className="mt-4 flex items-center justify-left">
                  <div className="overflow-hidden rounded-lg bg-white px-4 shadow sm:p-4 text-left w-full">
                    <dt className="truncate text-sm font-medium text-gray-500">
                      List Criteria:
                    </dt>
                    <dd className="mt-1 text tracking-tight text-black">
                      {fixedAncillaryData}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg bg-white shadow sm:p-2 mt-4 w-fit">
                <dt className="truncate font-medium mx-2">
                  <button
                    className="w-full"
                    onClick={() => {
                      setProposedRevisionsIsOpen((prev) => !prev);
                    }}
                  >
                    <div className="justify-between flex flex-row">
                      <div className="w-[350px] text-left">
                        Proposed Revisions with Oracle (
                        {proposedRevisions ? proposedRevisions.length : ""})
                      </div>
                      {proposedRevisionsIsOpen ? (
                        <img
                          src={ARROW}
                          alt="logo"
                          width="25"
                          className="rotate-180"
                        />
                      ) : (
                        <img
                          src={ARROW}
                          alt="logo"
                          width="25"
                          className="ml-2"
                        />
                      )}
                    </div>
                  </button>
                </dt>
                {proposedRevisionsIsOpen ? (
                  <table className="table-fixed w-[750px] mt-2 content-center mx-2">
                    <thead>
                      <tr>
                        <th className="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Revision ID
                        </th>
                        <th className="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Revision Type
                        </th>
                        <th className="border border-slate-300 text-sm font-medium text-gray-500 p-2">
                          Proposed Addresses
                        </th>
                        <th className="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Oracle
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposedRevisions ? (
                        <>
                          {proposedRevisions.map((revision) => (
                            <tr>
                              <td className="border border-slate-300 text-center align-top py-2">
                                {revision.revisionId}
                              </td>
                              <td className="border border-slate-300 text-center align-top py-2">
                                {revision.revisionType === 0 ? "Remove" : "Add"}
                              </td>
                              <td className="border border-slate-300 align-top pl-2 py-2">
                                {revision.proposedAddresses}
                              </td>
                              <td className="border border-slate-300 text-center align-top py-2">
                                <a
                                  className="cursor-pointer font-bold font-sans
                             text-underline bg-blue-300 rounded-lg px-3 py-1 my-2"
                                  href={revision.oracleURL}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  🡕
                                </a>
                              </td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        <></>
                      )}
                    </tbody>
                  </table>
                ) : (
                  ""
                )}
              </div>
              <div className="rounded-lg bg-white shadow sm:p-2 mt-4 w-fit ">
                <dt className="truncate font-medium mx-2">
                  <button
                    className="w-full"
                    onClick={() => {
                      setApprovedRevisionsIsOpen((prev) => !prev);
                    }}
                  >
                    <div className="justify-between flex flex-row">
                      <div className="w-[350px] text-left">
                        Approved Revisions for Execution (
                        {approvedRevisions ? approvedRevisions.length : ""})
                      </div>
                      {approvedRevisionsIsOpen ? (
                        <img
                          src={ARROW}
                          alt="logo"
                          width="25"
                          className="rotate-180"
                        />
                      ) : (
                        <img
                          src={ARROW}
                          alt="logo"
                          width="25"
                          className="ml-2"
                        />
                      )}
                    </div>
                  </button>
                </dt>
                {approvedRevisionsIsOpen ? (
                  <table className="table-fixed w-[750px] rounded-lg bg-white shadow sm:p-2 mt-2 mx-2">
                    <thead>
                      <tr>
                        <th className="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Revision ID
                        </th>
                        <th className="border border-slate-300 text-sm font-medium text-gray-500 p-2">
                          Proposer
                        </th>
                        <th className="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {approvedRevisions ? (
                        <>
                          {approvedRevisions.map((revision, i) => (
                            <tr>
                              <td className="border border-slate-300 text-center align-top align-middle">
                                {revision.revisionId}
                              </td>
                              <td className="border border-slate-300 text-center align-top px-2 align-middle">
                                {revision.proposer}
                              </td>
                              <td className="border border-slate-300 text-center align-top">
                                <button
                                  type="button"
                                  className="items-center rounded-md bg-[#ace4aa] px-3 py-2 my-2 text-sm font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                  value={i}
                                  onClick={(e) =>
                                    executeRevision(e.target.value)
                                  }
                                >
                                  Execute
                                </button>
                              </td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        <></>
                      )}
                    </tbody>
                  </table>
                ) : (
                  ""
                )}
              </div>

              <div className="flex flex-w justify-between my-2">
                <div>
                  <dt className="truncate text-xl font-medium mt-6">
                    Addresses on List ({addressList ? addressList.length : ""}):
                  </dt>
                </div>
                <div className="mt-2">
                  {currentProxy ? (
                    <>
                      <button
                        type="button"
                        className="items-center rounded-md bg-[#ace4aa] p-3 text-sm font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => openAddressModal(true)}
                      >
                        Add Addresses
                      </button>
                      <button
                        type="button"
                        className="ml-2 items-center rounded-md bg-[#e4aeaa] p-3 text-sm font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => openAddressModal(false)}
                      >
                        Remove Addresses
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="items-center rounded-md bg-slate-300 p-3 text-sm font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => openAddressModal(true)}
                      >
                        Add Addresses
                      </button>
                      <button
                        type="button"
                        className="ml-2 items-center rounded-md bg-slate-300 p-3 text-sm font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => openAddressModal(false)}
                      >
                        Remove Addresses
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-hidden rounded-lg bg-black px-4 shadow text-left grid grid-cols-2">
                <div>
                  <ul className="py-2">
                    {addressList
                      ? addressList
                          .slice(0, Math.ceil(addressList.length / 2))
                          .map((address) => (
                            <li key={address} className="font-mono text-white">
                              {address},
                            </li>
                          ))
                      : ""}
                  </ul>
                </div>
                <div>
                  <ul className="py-2">
                    {addressList
                      ? addressList
                          .slice(Math.ceil(addressList.length / 2))
                          .map((address) => (
                            <li key={address} className="font-mono text-white">
                              {address},
                            </li>
                          ))
                      : ""}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
        </>
      </div>
    </div>
  );
}
