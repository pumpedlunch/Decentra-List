import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import {ethers} from "ethers";
import MetaMaskButton from "./metamaskButton";
import AddressModal from "./addressModal";
import CreateListModal from "./createListModal";
import Image from "next/image";
import {CHAINS} from "../utils/constants"

const FACTORY_ABI =
  require("../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json").abi;
const WETH_ABI = require("../../public/ERC20_ABI");
const UMA_STORE_ABI = require("../../public/UMAStore.json");

const DECENTRALIST_ABI =
  require("../artifacts/contracts/Decentralist.sol/Decentralist.json").abi;

const EVENT_INTERFACE = new ethers.utils.Interface(DECENTRALIST_ABI);

export default function List() {
  const [proxyAddresses, setProxyAddresses] = useState([]);
  const [currentList, setCurrentList] = useState();
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
  const [hasProvider, setHasProvider] = useState(true);
  const provider = useRef();
  //chainId connected to metamask
  const [connectedChainId, setConnectedChainId] = useState(null);
  //current Chain dropdown value
  const [selectedChainId, setSelectedChainId] = useState("1");
  //controller used to cancel unnecessary fetches
  const controller = useRef();

  // State variables for modals
  const [addressModalIsOpen, setAddressModalIsOpen] = useState(false);
  const [createListModalIsOpen, setCreateListModalIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  /* TODO: move to connect button
  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  } catch (error) {
    alert("Please install metamask");
  } */

  // -----Page load function-----
  useEffect(() => {
    async function startup() {
      const urlNetwork = searchParams.get("chainId");
      if (CHAINS[urlNetwork]) {
        setSelectedChainId(urlNetwork);
        getLists(urlNetwork);
        const urlList = searchParams.get("list");
        setCurrentList(urlList);
        getListData(urlList, urlNetwork);
        return;
      }
      getLists(selectedChainId);

      //if wallet connected, set provider
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          provider.current = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
          );
        }
      }
    }

    startup();
  }, [router.isReady]);

  const getLists = async (network) => {
    try {
      const res = await fetch(`/api/getLists`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          network: network,
        }),
      });
      const data = await res.json();
      setProxyTitles(data.proxyTitles);
      setProxyAddresses(data.proxyAddresses);
    } catch (error) {
      setProxyTitles([]);
      setProxyAddresses([]);
    }
  };

  const getListData = async (address, network) => {
    controller.current = new AbortController();
    const res = await fetch(`/api/getListData`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network: network,
        address: address,
      }),
      signal: controller.current.signal,
    });
    const data = await res.json();

    setFixedAncillaryData(data.fixedAncillaryData);
    setTotalBond(data.totalBond);
    setAddReward(data.addReward);
    setRemoveReward(data.removeReward);
    setLiveness(data.liveness);
    setLivenessUnits(data.livenessUnits);
    setOwner(data.owner);
    setBalance(data.balance);
    setTokenSymbol(data.tokenSymbol);
    setTokenDecimals(data.tokenDecimals);
    setTokenAddress(data.tokenAddress);
    setAddressList(data.addressList);

    setProposedRevisions(data.proposedRevisions);
    setApprovedRevisions(data.approvedRevisions);
  };

  // -----Wallet Functions-----

  const connectMetamask = async () => {
    if (!window.ethereum) {
      alert("Please download Metamask to connect");
      return;
    }
    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    let _connectedChainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    _connectedChainId = _connectedChainId.slice(2);

    provider.current = new ethers.providers.Web3Provider(
      window.ethereum,
      "any"
    );
    setUserAddress(account);
    setConnectedChainId(_connectedChainId);
  };

  const changeMetamaskChainId = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: `0x${Number(selectedChainId).toString(16)}`,
          },
        ],
      });
    } catch (error) {
      if (error.code === 4902) {
        alert("add selected network to metamask");
      }
      console.log(error);
    }

    setConnectedChainId(selectedChainId);
  };

  // ----- Handle changed selection functions-----

  const changeSelectedNetwork = async (e) => {
    //cancel any current getListData fetches
    controller.current? controller.current.abort() : '';
    
    setSelectedChainId(e.target.value);
    router.push({
      pathname: router.pathname,
    });

    resetState();

    getLists(e.target.value);
    //how to cancel server requests?
  };

  const selectList = async (e) => {
    setCurrentList(e.target.value);
    getListData(e.target.value, selectedChainId);
    router.push({
      pathname: router.pathname,
      query: { chainId: selectedChainId, list: e.target.value },
    });
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
      const contract = await prepareContract(currentList, DECENTRALIST_ABI);
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
        CHAINS[connectedChainId].storeAddress,
        UMA_STORE_ABI,
        provider.current
      );
      let finalFee = await storeContract.finalFees(tokenAddress);

      //get token decimals and symbols
      const tokenContract = new ethers.Contract(
        tokenAddress,
        WETH_ABI,
        provider.current
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
      CHAINS[connectedChainId].factoryAddress,
      FACTORY_ABI,
      provider.current
    );
    const minLiveness = await factoryContract.minimumLiveness();
    setMinLivenessArg(minLiveness.toString());

    setCreateListModalIsOpen(true);
  };

  const closeListModal = () => {
    setFinalFeeArg("");
    setCreateListModalIsOpen(false);
  };

  // -----Contract call functions-----

  const approveTransfer = async () => {
    const contract = await prepareContract(tokenAddress, WETH_ABI);
    await contract.approve(currentList, totalBond);
  };

  const createList = async () => {
    const contract = await prepareContract(
      CHAINS[connectedChainId].factoryAddress,
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
    const contract = await prepareContract(currentList, DECENTRALIST_ABI);
    await contract.executeRevision(
      approvedRevisions[i].revisionId,
      approvedRevisions[i].proposedAddresses
    );
  };

  const prepareContract = async (address, ABI) => {
    await provider.current.send("eth_requestAccounts", []);
    const signer = provider.current.getSigner();
    return new ethers.Contract(address, ABI, signer);
  };

  // -----helper functions-----
  const resetState = () => {
    setCurrentList("");
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
        totalBond={totalBond}
        tokenSymbol={tokenSymbol}
      />
      <CreateListModal
        isOpen={createListModalIsOpen}
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
            <div className="flex">
              <Image
                src="/decentra-list.png"
                alt="logo"
                width="100"
                height="100"
                className="flex-none"
              />
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
                    className="cursor-pointer font-bold font-sans text-xs text-blue-500 ml-2 text-underline"
                    href="https://decentra-list.gitbook.io/docs/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Docs🡕
                  </a>
                  <a
                    className="cursor-pointer font-bold font-sans text-xs text-blue-500 ml-2 text-underline"
                    href="https://twitter.com/decentralistxyz"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Contact🡕
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row">
            <select
              className="shadow px-2 rounded-md mr-2 mt-2 h-14 text-sm font-semibold"
              onChange={changeSelectedNetwork}
              value={selectedChainId}
            >
              {Object.keys(CHAINS).map((id, i) => (
                <option value={id} key={i}>
                  {CHAINS[id].name}
                </option>
              ))}
            </select>
            <MetaMaskButton
              connectMetamask={connectMetamask}
              connectedChainId={connectedChainId}
              selectedChainId={selectedChainId}
              userAddress={userAddress}
              changeMetamaskChainId={changeMetamaskChainId}
            />
          </div>
        </div>
        <>
          <div className="flex flew-w justify-between items-center">
            <form className="my-3">
              <label className="ml-2 font-semibold">
                Select Existing List:
                <select
                  value={currentList}
                  className="bg-blue-300 shadow ml-2 px-2 py-2 rounded-md"
                  onChange={selectList}
                >
                  {proxyAddresses[0] ? (
                    <>
                      <option value="" key="default" hidden></option>
                      {proxyAddresses.map((address, i) => (
                        <option value={address} key={i} className="font-semibold">
                          {`${address.slice(0, 6)}... ${proxyTitles[i]}`}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option className="p-5 font-bold">No lists created</option>
                  )}
                </select>
              </label>
            </form>
            <div className="my-3">
              {selectedChainId === connectedChainId ? (
                <button
                  type="button"
                  className="text-sm font-bold px-3 py-3 items-center rounded-md bg-[#ace4aa] text-sm font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={openListModal}
                >
                  Create New List
                </button>
              ) : (
                <button
                  disabled={true}
                  type="button"
                  className="items-center rounded-md bg-slate-300 p-3 text-sm font-bold shadow-md"
                >
                  Create New List
                </button>
              )}
            </div>
          </div>

          <div className="flex rounded-lg bg-white px-4 py-2 mb-4 shadow sm:p-2">
            <div className="flex flex-col ">
              <p className="font-semibold text-gray-500">Contract Address:</p>
            </div>
            <a
              className="cursor-pointer pl-1 font-semibold"
              href={CHAINS[selectedChainId].explorerUrl + currentList}
              target="_blank"
              rel="noreferrer"
            >
              {currentList ? currentList + "🡕" : ""}
            </a>
          </div>
          <div className="flex rounded-lg bg-white px-4 py-2 mb-2 shadow sm:p-2">
            <div className="flex flex-col">
              <p className="font-semibold text-gray-500">Owner Address:</p>
            </div>
            <a
              className="cursor-pointer pl-1 font-semibold"
              href={CHAINS[selectedChainId].explorerUrl + owner}
              target="_blank"
              rel="noreferrer"
            >
              {owner ? owner + "🡕" : ""}
            </a>
          </div>
          <div>
            <dl className="mt-5 grid grid-cols-3 gap-10 lg:grid-cols-5 text-center">
              <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
                <dt className="truncate text-sm font-semibold text-gray-500">
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
                <dt className="truncate text-sm font-semibold text-gray-500">
                  Liveness Period{" "}
                </dt>
                <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                  {liveness ? liveness + " " + livenessUnits : ""}
                </dd>
              </div>
              <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
                <dt className="truncate text-sm font-semibold text-gray-500">
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
                <dt className="truncate text-sm font-semibold text-gray-500">
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
                <dt className="truncate text-sm font-semibold text-gray-500">
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
                <dt className="truncate text-sm font-semibold text-gray-500">
                  List Criteria:
                </dt>
                <dd className="mt-1 text tracking-tight text-black font-medium">
                  {fixedAncillaryData}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-white shadow sm:p-2 mt-4 w-fit">
            <dt className="truncate font-semibold mx-2">
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
                    <Image
                      src="/dropdown_arrow.png"
                      alt="arrow"
                      width="25"
                      height="25"
                      className="rotate-180"
                    />
                  ) : (
                    <Image
                      src="/dropdown_arrow.png"
                      alt="arrow"
                      width="25"
                      height="25"
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
                    <th className="border border-slate-300 text-sm font-semibold text-gray-500 w-[100px] p-2">
                      Revision ID
                    </th>
                    <th className="border border-slate-300 text-sm font-semibold text-gray-500 w-[100px] p-2">
                      Revision Type
                    </th>
                    <th className="border border-slate-300 text-sm font-semibold text-gray-500 p-2">
                      Proposed Addresses
                    </th>
                    <th className="border border-slate-300 text-sm font-semibold text-gray-500 w-[100px] p-2">
                      Oracle
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proposedRevisions ? (
                    <>
                      {proposedRevisions.map((revision, i) => (
                        <tr key={i}>
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
            <dt className="truncate font-semibold mx-2">
              <button
                className="w-full"
                onClick={() => {
                  setApprovedRevisionsIsOpen((prev) => !prev);
                }}
              >
                <div className="justify-between flex flex-row font-semibold">
                  <div className="w-[350px] text-left">
                    Approved Revisions for Execution (
                    {approvedRevisions ? approvedRevisions.length : ""})
                  </div>
                  {approvedRevisionsIsOpen ? (
                    <Image
                      src="/dropdown_arrow.png"
                      alt="arrow"
                      width="25"
                      height="25"
                      className="rotate-180"
                    />
                  ) : (
                    <Image
                      src="/dropdown_arrow.png"
                      alt="arrow"
                      width="25"
                      height="25"
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
                    <th className="border border-slate-300 text-sm font-semibold text-gray-500 w-[100px] p-2">
                      Revision ID
                    </th>
                    <th className="border border-slate-300 text-sm font-semibold text-gray-500 p-2">
                      Proposer
                    </th>
                    <th className="border border-slate-300 text-sm font-semibold text-gray-500 w-[100px] p-2" />
                  </tr>
                </thead>
                <tbody>
                  {approvedRevisions ? (
                    <>
                      {approvedRevisions.map((revision, i) => (
                        <tr key={i}>
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
                              onClick={(e) => executeRevision(e.target.value)}
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
              <dt className="truncate text-xl font-semibold mt-6">
                Addresses on List ({addressList ? addressList.length : ""}):
              </dt>
            </div>
            <div className="mt-2">
              {currentList && selectedChainId === connectedChainId ? (
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
                    disabled={true}
                    type="button"
                    className="items-center rounded-md bg-slate-300 p-3 text-sm font-bold shadow-md"
                  >
                    Add Addresses
                  </button>
                  <button
                    disabled={true}
                    type="button"
                    className="ml-2 items-center rounded-md bg-slate-300 p-3 text-sm font-bold shadow-md"
                  >
                    Remove Addresses
                  </button>
                </>
              )}
            </div>
          </div>
          <div className=" p-2 overflow-hidden rounded-lg bg-black px-4 shadow text-center grid grid-cols-1 lg:grid-cols-2">
            <div className="w-fit">
              <ul>
                {addressList
                  ? addressList
                      .slice(0, Math.ceil(addressList.length / 2))
                      .map((address) => (
                        <li key={address} className="font-mono text-white">
                          <a
                            href={CHAINS[selectedChainId].explorerUrl + address}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {address},
                          </a>
                        </li>
                      ))
                  : ""}
              </ul>
            </div>
            <div className="w-fit">
              <ul>
                {addressList
                  ? addressList
                      .slice(Math.ceil(addressList.length / 2))
                      .map((address) => (
                        <li key={address} className="font-mono text-white">
                          <a
                            href={CHAINS[selectedChainId].explorerUrl + address}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {address},
                          </a>
                        </li>
                      ))
                  : ""}
              </ul>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
