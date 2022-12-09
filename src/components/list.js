import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import MetaMaskButton from "./metamaskButton";
import AddressModal from "./addressModal";
import ListModal from "./listModal";
import LOGO from "./decentralist.png";

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
  Goerli: "0x07417cA264170Fc5bD3568f93cFb956729752B61",
  Mainnet: "0x54f44eA3D2e7aA0ac089c4d8F7C93C27844057BF", //<-- LOCALHOST
};
const FACTORY_ADDRESS = {
  Goerli: "0x264A5AF8438806A2d7e61f23fc2B385dB1C2dCba",
  Mainnet: "0x0898f96352a2ddeb86De0F357E86D8Ddc1D8b4c6",
};

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
  const [finalFee, setFinalFee] = useState("");

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

  //Network variables
  const [userAddress, setUserAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [network, setNetwork] = useState(null);

  // State variables for modals
  const [addressModalIsOpen, setAddressModalIsOpen] = useState(false);
  const [listModalIsOpen, setListModalIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);

  const provider = new ethers.providers.Web3Provider(window.ethereum);

  // Address modal functions

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
    if (isAdd) price = (1e18).toString();
    const arrayArg = addressInput.replaceAll(" ", "").split(",");

    const contract = await prepareContract(currentProxy, PROXY_ABI);
    await contract.proposeRevision(price, arrayArg);

    closeAddressModal();
  };

  const openAddressModal = (add) => {
    setIsAdd(add);
    setAddressModalIsOpen(true);
  };

  const closeAddressModal = () => {
    setAddressModalIsOpen(false);
  };

  // List modal functions

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
      console.log("calc final fee");

      const storeContract = new ethers.Contract(
        STORE_ADDRESS[network],
        UMA_STORE_ABI,
        provider
      );
      let finalFee = await storeContract.finalFees(tokenAddress);

      const tokenContract = new ethers.Contract(
        tokenAddress,
        WETH_ABI,
        provider
      );
      const decimals = await tokenContract.decimals();

      finalFee = ethers.utils.formatUnits(finalFee.toString(), decimals);
      console.log("final fee = ", finalFee);

      setFinalFeeArg(finalFee.toString());
    } else setFinalFeeArg("");
  };

  const handleSubmitList = (event) => {
    event.preventDefault();
    createList();
    closeListModal();
  };

  const openListModal = () => {
    setListModalIsOpen(true);
  };

  const closeListModal = () => {
    setFinalFeeArg([]);
    setListModalIsOpen(false);
  };

  useEffect(() => {
    async function startup() {
      await checkIfWalletIsConnected();
      const _network = await checkNetwork();
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS[_network],
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
    }
    startup();
  }, []);

  // Metamask Functions

  async function checkIfWalletIsConnected() {
    console.log("check if Wallet is Connected");
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        setUserAddress(account);
        setConnected(true);
      } else {
        setConnected(false);
      }
    }
  }

  const checkNetwork = async () => {
    console.log("checking network");
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    let _network;
    if (chainId === "0x1") {
      _network = "Mainnet";
    } else if (chainId === "0x5") {
      _network = "Goerli";
    } else {
      _network = null;
    }
    setNetwork(_network);
    return _network;
  };

  const connect = async () => {
    console.log("connecting");
    if (!window.ethereum) {
      alert("Please download Metamask to connect");
      return;
    }
    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setUserAddress(account);
    setConnected(true);
  };

  // Get list information functions

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
      STORE_ADDRESS[network],
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
          .replace(
            ". Addresses to query can be found in the pendingAddresses parameter of the RevisionProposed event emitted by the requester's address in the same transaction as the proposed value with Revision ID = ",
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
      if (data.proposedValue.eq(ethers.utils.parseEther("1"))) {
        data.revisedAddresses.forEach((address) => {
          if (address !== "0x0000000000000000000000000000000000000000") {
            const index = _addressList.indexOf(address);
            if (index === -1) {
              _addressList.push(address);
            }
          }
        });
        // handle removals
      } else if (data.proposedValue.eq(0)) {
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
  };

  // Contract calls

  const approveTransfer = async () => {
    const contract = await prepareContract(tokenAddress, WETH_ABI);
    await contract.approve(currentProxy, totalBond);
  };

  const createList = async () => {
    const contract = await prepareContract(
      FACTORY_ADDRESS[network],
      FACTORY_ABI
    );
    await contract.createNewDecentralist(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(listCriteria)),
      titleArg,
      tokenArg,
      ethers.utils.parseUnits(bondAmountArg, tokenDecimals),
      ethers.utils.parseUnits(addRewardArg, tokenDecimals),
      ethers.utils.parseUnits(removeRewardArg, tokenDecimals),
      livenessArg * 60 * 60,
      ownerArg
    );
  };

  const prepareContract = async (address, ABI) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return new ethers.Contract(address, ABI, signer);
  };

  return (
    <div className="bg-gradient-to-t from-gray-200 h-full min-h-[750px]">
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
      />
      <div className="relative px-20">
        <div className="flex justify-between py-3 items-center border-b-2 border-black z-30">
          <div className="">
            <div className="flex flex-w">
              <img src={LOGO} alt="logo" width="90" height="25" />
              <div>
                <div className="ml-2">
                  <p className="font-bold font-sans text-3xl text-indigo-900 mt-2">
                    decentraList
                  </p>
                  <p className="text-xs font-bold">
                    customizable, decentralized, onchain, address lists
                  </p>
                </div>
                <p className="font-bold font-sans text-xs text-red-500 ml-2 mt-2">
                  *alpha unaudited version deployed to Mainnet & Goerli
                </p>
              </div>
            </div>
          </div>
          <MetaMaskButton
            connect={connect}
            network={network}
            userAddress={userAddress}
          />
        </div>

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
                    Select a List
                  </option>
                  {proxyTitles.map((title, i) => (
                    <option value={i} key={i}>
                      {title}
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

          <div className="flex rounded-lg bg-white px-4 py-2 mb-2 shadow sm:p-2">
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
            <dl className="mt-5 flex items-center justify-left">
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
          <div className="flex flex-w justify-between my-2">
            <div>
              <dt className="truncate text-xl font-medium mt-8">
                Addresses ({addressList ? addressList.length : ""}):
              </dt>
            </div>
            <div className="my-2">
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
      </div>
    </div>
  );
}
