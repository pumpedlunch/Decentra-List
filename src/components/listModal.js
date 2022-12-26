import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";

export default function List({
  isOpen,
  closeModal,
  handleListCriteriaArgChange,
  handleTitleArgChange,
  handleTokenArgChange,
  handleLivenessArgChange,
  handleBondAmountArgChange,
  handleAddRewardArgChange,
  handleRemoveRewardArgChange,
  handleOwnerArgChange,
  handleSubmitList,
  finalFeeArg,
  symbolArg,
  minLivenessArg,
}) {
  const ancillaryDataInputRef = useRef(null);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        initialFocus={ancillaryDataInputRef}
        className="z-40"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-10/12 max-w-lg transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                <div className="tracking-tight text-gray-800">
                  <h1 className="pt-8 pb-2 mb-4 px-8 text-3xl border-b-2 bg-[#F7F0E8]">
                    Create List
                  </h1>
                  <div className="px-8">
                    <p className="text-lg font-semibold">Title</p>
                    <p className="text-sm">Short descriptive title</p>
                    <input
                      placeholder="X Blackhat Hackers"
                      className="border border-gray-400 w-full h-10 rounded-lg mb-3 p-2"
                      onChange={handleTitleArgChange}
                    ></input>
                    <p className="text-lg font-semibold">List Criteria</p>
                    <p className="text-sm">
                      Publicly verifiable criteria for address inclusion on list
                    </p>
                    <input
                      ref={ancillaryDataInputRef}
                      placeholder="The following addresses stole tokens from..."
                      className="border border-gray-400 w-full h-10 rounded-lg mb-3 p-2"
                      onChange={handleListCriteriaArgChange}
                    ></input>
                    <p className="text-lg font-semibold">Token Address</p>
                    <p className="text-sm">Token used for bonds and rewards</p>
                    <div className="flex flex-row">
                      <p className="text-sm">
                        May be any UMA approved collateral:
                      </p>
                      <a
                        className="text-sm text-blue-500 ml-1"
                        href="https://docs.umaproject.org/resources/approved-collateral-types"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mainnet
                      </a>
                      <p className="text-sm ml-1"> | </p>
                      <a
                        className="text-sm text-blue-500 ml-1"
                        href="https://goerli.etherscan.io/address/0x63fDfF29EBBcf1a958032d1E64F7627c3C98A059#readContract#F1"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Goerli
                      </a>
                    </div>
                    <input
                      placeholder="0x..."
                      className="border border-gray-400 w-full h-10 rounded-lg mb-3 p-2"
                      onChange={handleTokenArgChange}
                    ></input>
                    <p className="text-lg font-semibold">Owner Address</p>
                    <p className="text-sm">
                      Owner can adjust bond/liveness/rewards and withdraw funds
                    </p>
                    <input
                      placeholder="0x..."
                      className="border border-gray-400 w-full h-10 rounded-lg mb-3 p-2"
                      onChange={handleOwnerArgChange}
                    ></input>
                    <p className="text-lg font-semibold">Bond</p>
                    <p className="text-sm">
                      Amount added to UMA's final fee to calculate total bond
                    </p>
                    {finalFeeArg? (
                      <p className="text-sm">
                      Must be >= final fee. Final fee = {finalFeeArg}{" "}
                      {symbolArg}
                    </p>
                    ) : (
                      <p className="text-sm">
                      Must be >= final fee.
                    </p>
                    )}
                    <input
                      placeholder="7.5"
                      className="border border-gray-400 w-full h-10 rounded-lg mb-3 p-2"
                      onChange={handleBondAmountArgChange}
                    ></input>
                    <p className="text-lg font-semibold">Addition Reward</p>
                    <p className="text-sm">
                      Reward paid to proposer for successfully adding 1 address
                      to the list
                    </p>
                    <input
                      placeholder="5.0"
                      className="border border-gray-400 w-full h-10 rounded-lg mb-3 p-2"
                      onChange={handleAddRewardArgChange}
                    ></input>
                    <p className="text-lg font-semibold">Removal Reward</p>
                    <p className="text-sm">
                      Reward paid to proposer for successfully removing 1
                      address from the list
                    </p>
                    <input
                      placeholder="2.5"
                      className="border border-gray-400 w-full h-10 rounded-lg mb-6 p-2"
                      onChange={handleRemoveRewardArgChange}
                    ></input>
                    <p className="text-lg font-semibold">Liveness Period</p>
                    <p className="text-sm">
                      Oracle dispute window for revisions to the list in
                      seconds. Minimum = {minLivenessArg} second(s)
                    </p>
                    <input
                      placeholder="3600"
                      className="border border-gray-400 w-full h-10 rounded-lg mb-3 p-2"
                      onChange={handleLivenessArgChange}
                    ></input>
                    <button
                      className="mb-10 rounded-md border border-transparent bg-[#ace4aa] px-6 py-3 text-base font-medium text-gray-800 shadow-md hover:bg-[#9AD398] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#9AD398] focus:ring-offset-2"
                      type="button"
                      onClick={handleSubmitList}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
