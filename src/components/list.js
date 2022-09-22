import React, { useState, createRef, useEffect, useRef } from "react";
import { ethers } from "ethers";
import MetaMaskButton from "./metamaskButton";
const PROXY_ABI =
  require("../artifacts/contracts/Decentralist.sol/Decentralist.json").abi;
const FACTORY_ABI =
  require("../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json").abi;
const WETH_ABI = require("../public/WETH_ABI.json");
const FACTORY_ADDRESS = "0x4B88f76057f06e03B7337a2E033d952f12e0A3Cf";
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

  const provider = new ethers.providers.Web3Provider(window.ethereum);

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
        console.log(_proxyTitles);
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
      await contract.addMulipleAddresses(arrayArg);
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
      await contract.removeMulipleAddresses(arrayArg);
    } else {
      console.log(`removing 1 address: ${addressInput}`);
      const contract = await prepareContract(currentProxy, PROXY_ABI);
      await contract.removeSingleAddress(addressInput);
    }
  };

  const approveTransfer = async () => {
    console.log(bondAmount);
    console.log(typeof bondAmount);
    const contract = await prepareContract(WETH_ADDRESS, WETH_ABI);
    const approveTx = await contract.approve(currentProxy, bondAmount);
  };

  const createList = async () => {
    const contract = await prepareContract(FACTORY_ADDRESS, FACTORY_ABI);
    const createListTx = await contract.createNewDecentralist(
      ethers.utils.hexlify(ethers.utils.toUtf8Bytes(ancillaryArg)),
      titleArg,
      livenessPeriodArg * 60 * 60,
      ethers.utils.parseEther(bondAmountArg),
      ethers.utils.parseEther(addRewardArg),
      ethers.utils.parseEther(removeRewardArg)
    );
  };

  const prepareContract = async (address, ABI) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return new ethers.Contract(address, ABI, signer);
  };

  return (
    <div>
      <MetaMaskButton></MetaMaskButton>
      <form>
        <label>
          Select a List:
          <select className="border border-black" onChange={changeList}>
            <option value="none" selected disabled hidden>
              Select an Option
            </option>
            {proxyTitles.map((title) => (
              <option value={title}>{title}</option>
            ))}
          </select>
        </label>
      </form>
      <div className="border border-black">
        <h3 className="font-bold">Title: {title}</h3>
        <p>Contract Address:</p>
        <a
          className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
          href={`https://goerli.etherscan.io/address/${currentProxy}`}
        >
          {currentProxy}
        </a>
        <p>Number of Addresses on List: {addresses.length}</p>
        <p>Bond Amount: {bondAmount} WETH wei</p>
        <p>Reward / Address Added: {addReward} WETH wei</p>
        <p>Reward / Address Removed: {removeReward} WETH wei</p>
        <p>Oracle Liveness Period: {livenessPeriod} seconds</p>
        <p>Ancillary Data: {fixedAncillaryData}</p>
      </div>
      <div>
        <button className="bg-green-500">Add Addresses (opens modal)</button>
        <button className="bg-red-500">Remove Addresses (opens modal)</button>
      </div>
      <list>
        {addresses.map((address) => (
          <ul>{address},</ul>
        ))}
      </list>

      {/* -------------- ADD/REMOVE ADDRESS ----------------- */}
      <div className="mt-8 border border-black">
        <div className="flex">
          <p>Bond Amount: {bondAmount / 10e18} WETH</p>
          <button className="bg-yellow-500" onClick={approveTransfer}>
            Approve Transfer of Bond
          </button>
        </div>
        <div>
          <input
            placeholder="0x or 0x,0x,0x..."
            className="border border-black w-[360px]"
            onChange={(e) => {
              setAddressInput(e.target.value);
            }}
          ></input>
          <button className="bg-green-500" onClick={addAddress}>
            Add Address
          </button>
          <button className="bg-red-500" onClick={removeAddress}>
            Remove Address
          </button>
        </div>
      </div>
      {/* -------------- CREATE LIST ----------------- */}
      <div className="mt-8 border border-black">
        <p>Ancillary Data:</p>
        <input
          placeholder="Text..."
          className="border border-black w-[360px]"
          onChange={(e) => {
            setAncillaryArg(e.target.value);
          }}
        ></input>
        <p>Title:</p>
        <input
          placeholder="Text..."
          className="border border-black w-[360px]"
          onChange={(e) => {
            setTitleArg(e.target.value);
          }}
        ></input>
        <p>Liveness Period:</p>
        <input
          placeholder="seconds"
          className="border border-black w-[360px]"
          onChange={(e) => {
            setLivenessPeriodArg(e.target.value);
          }}
        ></input>
        <p>Bond Amount:</p>
        <input
          placeholder="WETH"
          className="border border-black w-[360px]"
          onChange={(e) => {
            setBondAmountArg(e.target.value);
          }}
        ></input>
        <p>Add Reward:</p>
        <input
          placeholder="WETH"
          className="border border-black w-[360px]"
          onChange={(e) => {
            setAddRewardArg(e.target.value);
          }}
        ></input>
        <p>Remove Reward:</p>
        <input
          placeholder="WETH"
          className="border border-black w-[360px]"
          onChange={(e) => {
            setRemoveRewardArg(e.target.value);
          }}
        ></input>
        <button className="bg-green-500" onClick={createList}>
          Create List
        </button>
      </div>
    </div>
  );
}
