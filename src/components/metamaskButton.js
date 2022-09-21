import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function MetaMaskButton() {
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    connect();
    /* checkIfWalletIsConnected(); */
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
  };

  /* async function checkIfWalletIsConnected() {
    console.log("checking");
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        setUserAddress(account);
        return;
      }
    }
  } */

  return (
    <>
      {userAddress ? (
        <div className="bg-green-500">Connected: {userAddress}</div>
      ) : (
        <button className="bg-red-500" onClick={() => connect()}>
          Connect to MetaMask
        </button>
      )}
    </>
  );
}
