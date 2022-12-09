import React from "react";

export default function MetaMaskButton({
  network, userAddress, connect
}) {
 

  return (
    <>
      {network === null? (
        <div
          className="bg-red-300 p-1 mt-2 rounded-md w-40 h-14 border border-4 border-red-500 text-center"
          >
          <p className="text-sm font-bold">Change to Mainnet or Goerli</p>
      </div>
      ) : (
        <>{userAddress ? (
            <div className="bg-slate-300 rounded-md w-40 h-12 h-14 mt-2 text-sm text-center">
              <p className="mt-2 text-sm font-bold truncate max-w-[155px] ">
                Connected
              </p>
              <p className="text-sm font-bold truncate max-w-[155px] pl-2">
                {network} - {userAddress}
              </p>
            </div>
        ) : (
          <div>
            <button
              className="bg-blue-300 p-2 mt-2 rounded-md w-40 h-14 align-middle text-sm font-bold text-center float-right"
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
