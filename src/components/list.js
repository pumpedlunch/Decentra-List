import React, { useState, createRef, useEffect, useRef } from "react";
import { ethers } from "ethers";
import MetaMaskButton from "./metamaskButton";
import AddressModal from "./addressModal";
import ListModal from "./listModal";

import LOGO from "./decentralist.png";
const PROXY_ABI =
require("../artifacts/contracts/Decentralist.sol/Decentralist.json").abi;
const FACTORY_ABI =
  require("../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json").abi;
const WETH_ABI = require("../public/WETH_ABI.json");
const FACTORY_ADDRESS = "0xF44b59Ff544ce831A8B49331047Fc0a4dfa3B3B3";
const WETH_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; // Goerli

//require("dotenv").config();

export default function List() {
  const [proxyAddresses, setProxyAddresses] = useState([]);
  const [currentProxy, setCurrentProxy] = useState();
  const [addresses, setAddresses] = useState([]);
  const [addressInput, setAddressInput] = useState("");
  const [addressArrayInput, setAddressArrayInput] = useState([]);
  const [title, setTitle] = useState("");
  const [bondAmount, setBondAmount] = useState("");
  const [addReward, setAddReward] = useState("");
  const [removeReward, setRemoveReward] = useState("");
  const [fixedAncillaryData, setFixedAncillaryData] = useState("");
  const [livenessPeriod, setLivenessPeriod] = useState("");
  //create list args
  const [ancillaryArg, setAncillaryArg] = useState([]);
  const [titleArg, setTitleArg] = useState([]);
  const [livenessPeriodArg, setLivenessPeriodArg] = useState([]);
  const [bondAmountArg, setBondAmountArg] = useState([]);
  const [addRewardArg, setAddRewardArg] = useState([]);
  const [removeRewardArg, setRemoveRewardArg] = useState([]);
  const [proxyTitles, setProxyTitles] = useState([]);

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

  const handleSubmitAddressInput = (event) => {
    event.preventDefault();
    if (isAdd) {
      addAddress();
    } else {
      removeAddress();
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

  // List modal functions

  const handleAncillaryArgChange = (event) => {
    setAncillaryArg(event.target.value);
  };

  const handleTitleArgChange = (event) => {
    setTitleArg(event.target.value);
  };

  const handleLivenessPeriodArgChange = (event) => {
    setLivenessPeriodArg(event.target.value);
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

  const handleSubmitList = (event) => {
    event.preventDefault();
    createList();
    closeListModal();
  };

  const openListModal = () => {
    setListModalIsOpen(true);
  };

  const closeListModal = () => {
    setListModalIsOpen(false);
  };

  useEffect(() => {
    async function getProxies() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        provider
      );
      const _proxyAddresses = await contract.getAllClones();
      const _proxyTitles = _proxyAddresses.map((address) => {
        const proxyContract = new ethers.Contract(address, PROXY_ABI, provider);
        return proxyContract.title();
      });

      await Promise.all(_proxyTitles).then((_proxyTitles) => {
        setProxyTitles(_proxyTitles);
      });
      setProxyAddresses(_proxyAddresses);
    }
    getProxies();
  }, []);

  const changeList = async (e) => {
    console.log("changeList");
    const index = proxyTitles.indexOf(e.target.value);
    setCurrentProxy(proxyAddresses[index]);
    const contract = new ethers.Contract(
      proxyAddresses[index],
      PROXY_ABI,
      provider
    );
    const promises = [];

    promises.push(
      contract.getListArray(),
      contract.title(),
      contract.bondAmount(),
      contract.fixedAncillaryData(),
      contract.livenessPeriod(),
      contract.addReward(),
      contract.removeReward()
    );

    await Promise.all(promises).then((values) => {
      setAddresses(values[0]);
      setTitle(values[1]);
      setBondAmount(values[2].toNumber());
      setFixedAncillaryData(ethers.utils.toUtf8String(values[3]));
      setLivenessPeriod(values[4].toNumber());
      setAddReward(values[5].toNumber());
      setRemoveReward(values[6].toNumber());
    });
  };

  const addAddress = async () => {
    if (addressInput.includes(",")) {
      const arrayArg = addressInput.split(",");
      console.log(`adding addresses: ${arrayArg}`);
      const contract = await prepareContract(currentProxy, PROXY_ABI);
      await contract.addMultipleAddresses(arrayArg);
    } else {
      console.log(`adding 1 address: ${addressInput}`);
      const contract = await prepareContract(currentProxy, PROXY_ABI);
      await contract.addSingleAddress(addressInput);
    }
  };

  const removeAddress = async () => {
    if (addressInput.includes(",")) {
      const arrayArg = addressInput.split(",");
      console.log(`removing addresses: ${arrayArg}`);
      const contract = await prepareContract(currentProxy, PROXY_ABI);
      await contract.removeMultipleAddresses(arrayArg);
    } else {
      console.log(`removing 1 address: ${addressInput}`);
      const contract = await prepareContract(currentProxy, PROXY_ABI);
      await contract.removeSingleAddress(addressInput);
    }
  };

  const approveTransfer = async () => {
    const contract = await prepareContract(WETH_ADDRESS, WETH_ABI);
    const approveTx = await contract.approve(currentProxy, bondAmount);
  };

  const createList = async () => {
    const contract = await prepareContract(FACTORY_ADDRESS, FACTORY_ABI);
    const createListTx = await contract.createNewDecentralist(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(ancillaryArg)),
      titleArg,
      livenessPeriodArg,
      bondAmountArg,
      addRewardArg,
      removeRewardArg
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
        handleSubmitAddressInput={handleSubmitAddressInput}
        handleSubmitApproval={handleSubmitApproval}
      />
      <ListModal
        isOpen={listModalIsOpen}
        closeModal={closeListModal}
        handleAncillaryArgChange={handleAncillaryArgChange}
        handleTitleArgChange={handleTitleArgChange}
        handleLivenessPeriodArgChange={handleLivenessPeriodArgChange}
        handleBondAmountArgChange={handleBondAmountArgChange}
        handleAddRewardArgChange={handleAddRewardArgChange}
        handleRemoveRewardArgChange={handleRemoveRewardArgChange}
        handleSubmitList={handleSubmitList}
        closeAddressModal={closeAddressModal}
      />
      <div className="relative px-20">
        <div className="flex justify-between py-3 border-b-2 border-black z-30">
          <div className="flex flex-w">
            <img src={LOGO} alt="logo" width="60" height="25" />
            <div className="ml-2">
              <p className="font-bold font-sans text-3xl text-indigo-900 mt-2">
                decentraList
              </p>
              <p className="text-xs font-bold">
                customizable, decentralized, onchain, address lists
              </p>
            </div>
          </div>
          <MetaMaskButton />
        </div>
        <div className="flex flew-w justify-between items-center">
          <form className="my-3">
            <label>
              <select
                className="bg-slate-100 shadow px-2 py-2 rounded-md"
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
                {proxyTitles.map((title) => (
                  <option value={title}>{title}</option>
                ))}
              </select>
            </label>
          </form>
          <div className="my-3">
            <button
              type="button"
              className="text-sm font-bold px-3 py-3 items-center rounded-md bg-[#abdbe3]  text-xs font-bold shadow-md hover:bg-sky-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={openListModal}
            >
              Create List
            </button>
          </div>
        </div>

        <div className="flex rounded-lg bg-white px-4 py-2 shadow sm:p-2">
          <div className="flex flex-col ">
            <p className="font-medium text-gray-500">Contract Address:</p>
          </div>
          <a
            className="cursor-pointer pl-1 font-semibold"
            href={`https://goerli.etherscan.io/address/${currentProxy}`}
          >
            {currentProxy}
          </a>
        </div>
        <div>
          <dl className="mt-5 grid grid-cols-1 gap-10 sm:grid-cols-5 text-center">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                List Length
              </dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                {addresses.length}
              </dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Oracle Bond
              </dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                {bondAmount} WETH wei
              </dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Oracle Liveness{" "}
              </dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                {livenessPeriod / 60} min
              </dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Reward / Add
              </dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                {addReward} WETH wei
              </dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-2 shadow sm:p-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Reward / Removal
              </dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                {removeReward} WETH wei
              </dd>
            </div>
          </dl>
          <dl className="mt-5 flex items-center justify-left">
            <div className="overflow-hidden rounded-lg bg-white px-4 shadow sm:p-4 text-left">
              <dt className="truncate text-sm font-medium text-gray-500">
                Ancillary Data:
              </dt>
              <dd className="mt-1 text tracking-tight text-black">
                {fixedAncillaryData}
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-w justify-between my-2">
          <div>
            <dt className="truncate text-xl font-medium mt-8">Addresses:</dt>
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
              {addresses
                .slice(0, Math.ceil(addresses.length / 2))
                .map((address) => (
                  <li key={address} className="font-mono text-white">
                    {address},
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <ul className="py-2">
              {addresses
                .slice(Math.ceil(addresses.length / 2))
                .map((address) => (
                  <li key={address} className="font-mono text-white">
                    {address},
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
