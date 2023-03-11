import React from "react";

const CHAINS = {
  1: {
    name: "Ethereum",
  },
  137: {
    name: "Polygon",
  },
  10: {
    name: "Optimism",
  },
  5: {
    name: "Goerli",
  },
  80001: {
    name: "Mumbai",
  },
};

export default function MetaMaskButton({
  connectedChainId,
  selectedChainId,
  userAddress,
  connectMetamask,
  changeMetamaskChainId,
}) {
  return (
    <>
      {userAddress ? (
        <>
          {connectedChainId === selectedChainId ? (
            <div className="bg-slate-300 p-2 mt-2 rounded-md w-40 h-14 align-middle text-sm font-bold text-center float-right">
              <p className="">Connected</p>
              <p className="truncate px-2">{userAddress}</p>
            </div>
          ) : (
            <button
              className="bg-red-500 p-2 mt-2 rounded-md w-40 h-14 align-middle text-sm font-bold text-center float-right"
              onClick={() => changeMetamaskChainId()}
            >
              Change to {CHAINS[selectedChainId].name}
            </button>
          )}
        </>
      ) : (
        <button
          className="bg-blue-300 p-2 mt-2 rounded-md w-40 h-14 align-middle text-sm font-bold text-center float-right"
          onClick={() => connectMetamask()}
        >
          Connect
        </button>
      )}
    </>
  );
}
