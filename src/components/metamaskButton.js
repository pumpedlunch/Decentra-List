import React from "react";

const NETWORKS = {
  "0x1": "Ethereum",
  "0x5": "Goerli",
};

export default function MetaMaskButton({
  chainId,
  selectedNetwork,
  userAddress,
  connectMetamask,
  changeMetamaskChainId,
}) {
  return (
    <>
      {userAddress ? (
        <>
          {chainId === selectedNetwork ? (
            <div className="bg-slate-300 p-2 mt-2 rounded-md w-40 h-14 align-middle text-sm font-bold text-center float-right">
              <p className="">Connected</p>
              <p className="truncate px-2">{userAddress}</p>
            </div>
          ) : (
            <button
              className="bg-red-500 p-2 mt-2 rounded-md w-40 h-14 align-middle text-sm font-bold text-center float-right"
              onClick={() => changeMetamaskChainId()}
            >
              Change to {NETWORKS[selectedNetwork]}
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
