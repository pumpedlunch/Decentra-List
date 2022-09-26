import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function MetaMaskButton() {
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    // connect();
  }, [userAddress]);

  const connect = async () => {
    console.log("connecting");
    if (!window.ethereum) {
      alert("Get MetaMask!");
      return;
    }

    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setUserAddress(account);

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    console.log(chainId);
    if (chainId !== '0x5'){
      alert("Please switch network to Goerli");
    }
  };

  async function checkIfWalletIsConnected() {
    console.log("checking");
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== '0x5'){
        alert("Please switch network to Goerli");
      }

      if (accounts.length > 0) {
        const account = accounts[0];
        setUserAddress(account);
        return;
      }
    }
  }

  return (
    <>
      {userAddress ? (
        <div className="flex flex-col items-center text-xl justify-center">
          <button className="bg-[#ace4aa] p-2 mt-2 rounded-md w-32 text-sm font-bold text-center float-right">
            Connected
            <p className="text-sm font-bold truncate max-w-[150px] ">
              {userAddress}
            </p>
          </button>
        </div>
      ) : (
        <button
          className="bg-[#abdbe3] p-2 mt-2 rounded-md w-32 text-sm font-bold text-center float-right"
          onClick={() => connect()}
        >
          Connect
        </button>
      )}
    </>
  );
}
