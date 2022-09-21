import React, { useState, createRef, useEffect, useRef } from "react";
import { ethers } from "ethers";
import MetaMaskButton from "./metamaskButton";
const LIST_ABI =
  require("../artifacts/contracts/decentralist.sol/Decentralist.json").abi;
const WETH_ABI = require("../public/WETH_ABI.json");
//require("dotenv").config();

export default function List() {
  const [currentList, setCurrentList] = useState();
  const [addresses, setAddresses] = useState([]);
  const [addressInput, setAddressInput] = useState("");
  const [title, setTitle] = useState("");
  const [bondAmount, setBondAmount] = useState("");
  const [fixedAncillaryData, setFixedAncillaryData] = useState("");
  const [livenessPeriod, setLivenessPeriod] = useState("");
  const [approvalAmount, setApprovalAmount] = useState([]);
  const [titles, setTitles] = useState([]);

  const lists = [
    "0x3449A2B8F51F7f35d036C96adCa38F67164C9f08",
    "0xb3d0D588DcC2C24DCf30e3fb2Cf2dA87047D482b",
  ];

  const WETH_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6" // Goerli

  const provider = new ethers.providers.Web3Provider(window.ethereum);

  let contract;

  const changeList = async (e) => {
    console.log("changeList");
    setCurrentList(e.target.value);
    contract = new ethers.Contract(e.target.value, LIST_ABI, provider);
    const promises = [];

    promises.push(
      contract.getListArray(),
      contract.title(),
      contract.bondAmount(),
      contract.fixedAncillaryData(),
      contract.livenessPeriod()
    );

    await Promise.all(promises).then((values) => {
      setAddresses(values[0]);
      setTitle(values[1]);
      setBondAmount(values[2].toNumber());
      setFixedAncillaryData(ethers.utils.toUtf8String(values[3]));
      setLivenessPeriod(values[4].toNumber());
    });
  };

  const addAddress = async () => {
    console.log(`adding address: ${addressInput}`);
    const contract = await prepareContract(currentList, LIST_ABI);
    console.log(contract);
    //TODO check bond approval first
    const addTx = await contract.addAddress(addressInput);
    //TODO handle finished tx
  };

  const removeAddress = async () => {
    console.log(`removing address: ${addressInput}`);
    const contract = await prepareContract(currentList, LIST_ABI);
    //TODO check bond approval first
    const removeTx = await contract.removeAddress(addressInput);
    //TODO handle finished tx
  };

  const approveTransfer = async () => {
    const contract = await prepareContract(WETH_ADDRESS, WETH_ABI);
    const approveTx = await contract.approve(currentList, approvalAmount);
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
          <select value={currentList} onChange={changeList}>
            <option value="none" selected disabled hidden>
              Select an Option
            </option>
            {lists.map((address) => (
              <option value={address}>{address}</option>
            ))}
          </select>
        </label>
      </form>
      <div className="border border-black">
        <h3 className="font-bold">Title: {title}</h3>
        <p>Contract Address:</p>
        <a
          className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
          href={`https://goerli.etherscan.io/address/${currentList}`}
        >
          {currentList}
        </a>
        <p>Bond Amount: {bondAmount / 10e18} WETH</p>
        <p>Ancillary Data: {fixedAncillaryData}</p>
        <p>Liveness Period: {livenessPeriod / 60} minutes</p>
      </div>
      <list>
        {addresses.map((address) => (
          <ul>{address}</ul>
        ))}
      </list>
      <div>
        <input
          placeholder="Amount"
          className="border border-black w-[360px]"
          onChange={(e) => {
            setApprovalAmount(e.target.value);
          }}
        ></input>
        <button className="bg-green-500" onClick={approveTransfer}>
          Approve Transfer
        </button>
      </div>
      <div>
        <input
          placeholder="Address"
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
  );
}
