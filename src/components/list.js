import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import MetaMaskButton from "./metamaskButton";
import AddressModal from "./addressModal";
import ListModal from "./listModal";
import LOGO from "./decentralist.png";
import ARROW from "./dropdown_arrow.png";

const PROXY_ABI = require("../artifacts/contracts/Decentralist.sol/Decentralist.json")
  .abi;
const FACTORY_ABI = require("../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json")
  .abi;
const WETH_ABI = require("../public/WETH_ABI.json");
const UMA_STORE_ABI = require("../public/UMAStore.json");

const DECENTRALIST_ABI = require("../artifacts/contracts/Decentralist.sol/Decentralist.json")
  .abi;
const EVENT_INTERFACE = new ethers.utils.Interface(DECENTRALIST_ABI);
const STORE_ADDRESS = {
  "0x5": "0x07417cA264170Fc5bD3568f93cFb956729752B61",
  "0x1": "0x54f44eA3D2e7aA0ac089c4d8F7C93C27844057BF",
};
const FACTORY_ADDRESS = {
  "0x5": "0xb787ea81D6e90c9a06D4480eFfa0ce8B7c6338e1",
  "0x1": "0x0898f96352a2ddeb86De0F357E86D8Ddc1D8b4c6",
};
const SUPPORTED_CHAIN_IDS = ["0x1", "0x5"];

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
  const [chainId, setChainId] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState("");

  // State variables for modals
  const [addressModalIsOpen, setAddressModalIsOpen] = useState(false);
  const [listModalIsOpen, setListModalIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);

  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  // -----Page load function-----

  useEffect(() => {
    async function startup() {
      const isConnected = await checkIfWalletIsConnected();
      if (isConnected) {
        const _chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (SUPPORTED_CHAIN_IDS.includes(_chainId)) {
          setSelectedNetwork(_chainId);
          setChainId(_chainId);
          getLists(_chainId);
          return;
        }
      }
      setSelectedNetwork("0x1");
    }
    startup();
  }, []);

  // -----Helper Function-----

  const getLists = async (_chainId) => {
    const factoryContract = new ethers.Contract(
      FACTORY_ADDRESS[_chainId],
      FACTORY_ABI,
      provider
    );
    const _proxyAddresses = await factoryContract.getAllClones();
    const _proxyTitles = _proxyAddresses.map((address) => {
      const proxyContract = new ethers.Contract(address, PROXY_ABI, provider);
      return proxyContract.title();
    });
    await Promise.all(_proxyTitles).then((_proxyTitles) => {
      setProxyTitles(_proxyTitles);
    });
    setProxyAddresses(_proxyAddresses);
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

  const checkNetwork = async (_selectedNetwork) => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId === _selectedNetwork) {
      setChainId(chainId);
      return chainId;
    } else {
      setChainId(null);
      return null;
    }
  };

  const connectMetamask = async () => {
    if (!window.ethereum) {
      alert("Please download Metamask to connect");
      return;
    }
    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setUserAddress(account);

    const _chainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    if (SUPPORTED_CHAIN_IDS.includes(_chainId)) {
      setSelectedNetwork(_chainId);
      setChainId(_chainId);
      getLists(_chainId);
    }
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
      setChainId(selectedNetwork);
      getLists(selectedNetwork);

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
    } catch (error) {
      console.log(error);
    }
  };

  // ----- Handle changed selection functions-----

  const changeSelectedNetwork = async (e) => {
    setSelectedNetwork(e.target.value);
    checkNetwork(e.target.value);
  };

  const changeList = async (e) => {
    const index = [Number(e.target.value)];
    setCurrentProxy(proxyAddresses[index]);
    const listContract = new ethers.Contract(
      proxyAddresses[index],
      PROXY_ABI,
      provider
    );

    const _tokenAddress = await listContract.token();

    const tokenContract = new ethers.Contract(
      _tokenAddress,
      WETH_ABI,
      provider
    );
    const storeContract = new ethers.Contract(
      STORE_ADDRESS[chainId],
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
      tokenContract.balanceOf(proxyAddresses[index]),
      tokenContract.symbol(),
      tokenContract.decimals(),
      storeContract.finalFees(_tokenAddress)
    );

    await Promise.all(promises).then((values) => {
      setFixedAncillaryData(
        ethers.utils
          .toUtf8String(values[0])
          .replace("meet the List Criteria? List Criteria: ", "")
          .replace(
            " Proposed Addresses can be found in the proposedAddresses parameter of the RevisionProposed event emitted by the requester's address with Revision ID = ",
            ""
          )
      );
      setTotalBond(values[1].add(values[9]).toString());
      setAddReward(values[2].toString());
      setRemoveReward(values[3].toString());
      if (values[4] > 60 * 60) {
        setLiveness(values[4].div(60 * 60).toString());
        setLivenessUnits("hours");
      } else {
        setLiveness(values[4].toString());
        setLivenessUnits("seconds");
      }
      setLiveness(values[4].toString());
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
          _proposedRevisions.push({
            revisionId: revisionId,
            revisionType: revisionType,
            proposedAddresses: data.proposedAddresses
              .toString()
              .replaceAll(",", ", "),
            oracleURL:
              "https://testnet.oracle.umaproject.org/request?transactionHash=" +
              event[0].transactionHash +
              "&chainId=" +
              chainId.replace("0x", "") +
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
      const contract = await prepareContract(currentProxy, PROXY_ABI);
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
    const contract = await prepareContract(currentProxy, PROXY_ABI);
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
              <img src={LOGO} alt="logo" width="90" height="25" />
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
                    href="https://twitter.com/pumpedlunch"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Contact🡕
                  </a>
                  <p className="font-bold font-sans text-xs text-red-500 ml-4 mt-2">
                    *dapp is in currently in pre-launch test mode
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
          {chainId && userAddress ? (
            <>
              <div className="flex flew-w justify-between items-center">
                <form className="my-3">
                  <label>
                    <select
                      className="bg-blue-300 shadow px-2 py-2 rounded-md"
                      onChange={changeList}
                    >
                      <option
                        className="p-5 font-bold"
                        value="none"
                        selected
                        disabled
                        hidden
                      >
                        {proxyTitles[0]
                          ? "Select a List"
                          : "No lists created yet"}
                      </option>
                      {proxyTitles.map((title, i) => (
                        <option value={i} key={i}>
                          {`${proxyAddresses[i].slice(0, 6)}... ${title}`}
                        </option>
                      ))}
                    </select>
                  </label>
                </form>
                <div className="my-3">
                  <button
                    type="button"
                    className="text-sm font-bold px-3 py-3 items-center rounded-md bg-[#ace4aa]  text-xs font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={openListModal}
                  >
                    Create List
                  </button>
                </div>
              </div>

              <div className="flex rounded-lg bg-white px-4 py-2 mb-4 shadow sm:p-2">
                <div className="flex flex-col ">
                  <p className="font-medium text-gray-500">Contract Address:</p>
                </div>
                <a
                  className="cursor-pointer pl-1 font-semibold"
                  href={`https://goerli.etherscan.io/address/${currentProxy}`}
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
                  href={`https://goerli.etherscan.io/address/${owner}`}
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

              <div class="rounded-lg bg-white shadow sm:p-2 mt-4 w-fit">
                <dt className="truncate font-medium mx-2">
                  <button
                    class="w-full"
                    onClick={() => {
                      setProposedRevisionsIsOpen((prev) => !prev);
                    }}
                  >
                    <div class="justify-between flex flex-row">
                      <div class="w-[350px] text-left">
                        Proposed Revisions with Oracle (
                        {proposedRevisions ? proposedRevisions.length : ""})
                      </div>
                      {proposedRevisionsIsOpen ? (
                        <img
                          src={ARROW}
                          alt="logo"
                          width="25"
                          class="rotate-180"
                        />
                      ) : (
                        <img src={ARROW} alt="logo" width="25" class="ml-2" />
                      )}
                    </div>
                  </button>
                </dt>
                {proposedRevisionsIsOpen ? (
                  <table class="table-fixed w-[750px] mt-2 content-center mx-2">
                    <thead>
                      <tr>
                        <th class="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Revision ID
                        </th>
                        <th class="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Revision Type
                        </th>
                        <th class="border border-slate-300 text-sm font-medium text-gray-500 p-2">
                          Proposed Addresses
                        </th>
                        <th class="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Oracle
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposedRevisions.map((revision) => (
                        <tr>
                          <td class="border border-slate-300 text-center align-top py-2">
                            {revision.revisionId}
                          </td>
                          <td class="border border-slate-300 text-center align-top py-2">
                            {revision.revisionType === 0 ? "Remove" : "Add"}
                          </td>
                          <td class="border border-slate-300 align-top pl-2 py-2">
                            {revision.proposedAddresses}
                          </td>
                          <td class="border border-slate-300 text-center align-top py-2">
                            <a
                              class="cursor-pointer font-bold font-sans
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
                    </tbody>
                  </table>
                ) : (
                  ""
                )}
              </div>
              <div class="rounded-lg bg-white shadow sm:p-2 mt-4 w-fit ">
                <dt className="truncate font-medium mx-2">
                  <button
                    class="w-full"
                    onClick={() => {
                      setApprovedRevisionsIsOpen((prev) => !prev);
                    }}
                  >
                    <div class="justify-between flex flex-row">
                      <div class="w-[350px] text-left">
                        Approved Revisions for Execution (
                        {approvedRevisions ? approvedRevisions.length : ""})
                      </div>
                      {approvedRevisionsIsOpen ? (
                        <img
                          src={ARROW}
                          alt="logo"
                          width="25"
                          class="rotate-180"
                        />
                      ) : (
                        <img src={ARROW} alt="logo" width="25" class="ml-2" />
                      )}
                    </div>
                  </button>
                </dt>
                {approvedRevisionsIsOpen ? (
                  <table class="table-fixed w-[750px] rounded-lg bg-white shadow sm:p-2 mt-2 mx-2">
                    <thead>
                      <tr>
                        <th class="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2">
                          Revision ID
                        </th>
                        <th class="border border-slate-300 text-sm font-medium text-gray-500 p-2">
                          Proposer
                        </th>
                        <th class="border border-slate-300 text-sm font-medium text-gray-500 w-[100px] p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {approvedRevisions.map((revision, i) => (
                        <tr>
                          <td class="border border-slate-300 text-center align-top align-middle">
                            {revision.revisionId}
                          </td>
                          <td class="border border-slate-300 text-center align-top px-2 align-middle">
                            {revision.proposer}
                          </td>
                          <td class="border border-slate-300 text-center align-top">
                            <button
                              type="button"
                              className="items-center rounded-md bg-[#ace4aa] px-3 py-2 my-2 text-sm font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              value={i}
                              onClick={(e) => executeRevision(e.target.value)}
                            >
                              Execute
                            </button>
                          </td>
                        </tr>
                      ))}
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
