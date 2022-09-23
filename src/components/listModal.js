
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useRef } from 'react'

export default function List({ isOpen, closeModal, handleAncillaryArgChange, handleTitleArgChange, handleLivenessPeriodArgChange, handleBondAmountArgChange, handleAddRewardArgChange, handleRemoveRewardArgChange, handleSubmitList }) {
    
    const ancillaryDataInputRef = useRef(null)

    return (

        <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" initialFocus={ancillaryDataInputRef} className="z-40" onClose={closeModal}>
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
            <Dialog.Panel className="w-10/12 max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
            
            <div className="text-lg font-semibold tracking-tight text-gray-800">
                <h1 className="pt-8 pb-2 mb-4 px-8 text-3xl border-b-2 bg-[#F7F0E8]">Create List</h1>
                <div className="px-8">
                    <p>Ancillary Data</p>
                    <input
                        ref={ancillaryDataInputRef}
                        placeholder="Text"
                        className="border border-gray-400 w-[360px] h-10 rounded-lg mb-3 p-2"
                        onChange={handleAncillaryArgChange}
                    ></input>
                    <p>Title</p>
                    <input
                        placeholder="Text"
                        className="border border-gray-400 w-[360px] h-10 rounded-lg mb-3 p-2"
                        onChange={handleTitleArgChange}
                    ></input>
                    <p>Liveness Period</p>
                    <input
                        placeholder="Seconds"
                        className="border border-gray-400 w-[360px] h-10 rounded-lg mb-3 p-2"
                        onChange={handleLivenessPeriodArgChange}
                    ></input>
                    <p>Bond Amount</p>
                    <input
                        placeholder="WETH wei"
                        className="border border-gray-400 w-[360px] h-10 rounded-lg mb-3 p-2"
                        onChange={handleBondAmountArgChange}
                    ></input>
                    <p>Add Reward</p>
                    <input
                        placeholder="WETH wei"
                        className="border border-gray-400 w-[360px] h-10 rounded-lg mb-3 p-2"
                        onChange={handleAddRewardArgChange}
                    ></input>
                    <p>Remove Reward</p>
                    <input
                        placeholder="WETH wei"
                        className="border border-gray-400 w-[360px] h-10 rounded-lg mb-6 p-2"
                        onChange={handleRemoveRewardArgChange}
                    ></input>
                    <button className="mb-10 rounded-md border border-transparent bg-[#ace4aa] px-6 py-3 text-base font-medium text-gray-800 shadow-md hover:bg-[#9AD398] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#9AD398] focus:ring-offset-2" type="button"  onClick={handleSubmitList}>
                        Create List
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