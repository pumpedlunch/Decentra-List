import React, { useState, createRef, useEffect, useRef } from "react";
import { ethers } from "ethers";
import MetaMaskButton from "./metamaskButton";
import AddressModal from './addressModal'
import ListModal from './listModal'

const PROXY_ABI =
  require("../artifacts/contracts/decentralist.sol/Decentralist.json").abi;
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

  // State variables for modals
  const [addressModalIsOpen, setAddressModalIsOpen] = useState(false);
  const [listModalIsOpen, setListModalIsOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);

  const provider = new ethers.providers.Web3Provider(window.ethereum);

  // Address modal functions

  const handleAddressInputChange = (event) => {
    setAddressInput(event.target.value);
  }

  const handleSubmitApproval = (event) => {
    event.preventDefault();
    approveTransfer();
  }

  const handleSubmitAddressInput = (event) => {
    event.preventDefault();
    if(isAdd) {
      addAddress();
    } else {
      removeAddress();
    }
    closeAddressModal();
  }

  const openAddressModal = (add) => {
    setIsAdd(add);
    setAddressModalIsOpen(true);
  }

  const closeAddressModal = () => {
    setAddressModalIsOpen(false);
  }

  // List modal functions

  const handleAncillaryArgChange = (event) => {
    setAncillaryArg(event.target.value);
  }
  
  const handleTitleArgChange = (event) => {
    setTitleArg(event.target.value);
  }
  
  const handleLivenessPeriodArgChange = (event) => {
    setLivenessPeriodArg(event.target.value);
  }

  const handleBondAmountArgChange = (event) => {
    setBondAmountArg(event.target.value);
  }
  
  const handleAddRewardArgChange = (event) => {
    setAddRewardArg(event.target.value);
  }
  
  const handleRemoveRewardArgChange = (event) => {
    setRemoveRewardArg(event.target.value);
  }

  const handleSubmitList = (event) => {
    event.preventDefault();
    createList()
    console.log('ancillaryArg', ancillaryArg)
    console.log('titleArg', titleArg)
    console.log('livenessPeriodArg', livenessPeriodArg)
    console.log('bondAmountArg', bondAmountArg)
    console.log('addRewardArg', addRewardArg)
    console.log('removeRewardArg', removeRewardArg)
    closeListModal()
  }

  const openListModal = () => {
    setListModalIsOpen(true);
  }

  const closeListModal = () => {
    setListModalIsOpen(false);
  }

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
      <div className="flex border border-black justify-between">
        <div className="flex flex-col ">
          {/* <h3 className="font-bold">Title: {title}</h3> */}
          <p>Contract Address:</p>
        </div>
        <a
          className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
          href={`https://goerli.etherscan.io/address/${currentProxy}`}
        >
          {currentProxy}
        </a>
        <div className="flex flex-col items-center justify-center space-y-2 p-3">
        <p className="bg-gray-500">Number of Addresses on List: {addresses.length}</p>
        <p className="bg-gray-300">{addresses.length} addresses </p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 p-3">
        <p className="bg-gray-500">Bond Amount:  </p>
        <p className="bg-gray-300">{bondAmount} bondAmount WETH wei</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 p-3">
        <p className="bg-gray-500">Reward / Address Added: </p>
        <p className="bg-gray-300">{addReward} WETH wei</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 p-3">
        <p className="bg-gray-500">Reward / Address Removed: </p>
        <p className="bg-gray-300">{removeReward} WETH wei </p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 p-3">
        <p className="bg-gray-500">Oracle Liveness Period: {livenessPeriod} </p>
        <p className="bg-gray-300">{livenessPeriod} seconds</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 p-3">
        <p className="bg-gray-500">Ancillary Data: </p>
        <p className="bg-gray-300">{fixedAncillaryData} seconds</p>
        </div>
      </div>
      <div>
        <button className="bg-green-500" onClick={() => openAddressModal(true)}>Add Addresses (opens modal)</button>
        <button className="bg-red-500" onClick={() => openAddressModal(false)}>Remove Addresses (opens modal)</button>
      </div>
      <list>
        {addresses.map((address) => (
          <ul>{address}, LIST</ul>
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
        {/*<p>Ancillary Data:</p>
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
        ></input> */}
        <button className="bg-green-500" onClick={openListModal}>
          Open Create List Modal
        </button>
      </div>
    </div>
  );
}
