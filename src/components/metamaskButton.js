import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function MetaMaskButton({
  network, userAddress, connect
}) {
 

  return (
    <>
      {network === null? (
        <div>
        <button
          className="bg-red-300 p-1 mt-2 rounded-md w-40 h-12 border border-4 border-red-500"
          >
          <p className="text-sm font-bold">Change to Mainnet or Goerli</p>
        </button>
      </div>
      ) : (
        <>{userAddress ? (
          <div className="flex items-right text-xl mt-2 justify-end content-center">
            <button className="bg-slate-300 rounded-md w-40 h-12 align-middle h-14 text-sm font-bold text-center float-right">
              <p className="text-sm font-bold truncate max-w-[155px] ">
                Connected
              </p>
              <p className="text-sm font-bold truncate max-w-[155px] pl-2">
                {network} - {userAddress}
              </p>
            </button>
          </div>
        ) : (
          <div>
            <button
              className="bg-blue-300 p-2 mt-2 rounded-md w-40 h-12 align-middle text-sm font-bold text-center float-right"
              onClick={() => connect()}
              >
              Connect
            </button>
          </div>
        )}
      </>
      )}
    </>
  );
}
