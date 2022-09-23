import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useRef } from 'react'

export default function AddressModal({ isOpen, closeModal, isAdd, handleAddressInputChange, handleSubmitApproval, handleSubmitAddressInput }) {
    
    const addressInputRef = useRef(null)
    
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" initialFocus={addressInputRef} className="z-40" onClose={closeModal}>
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
                        <h1 className="pt-8 pb-2 mb-4 px-8 text-3xl border-b-2 bg-[#F7F0E8]">{ isAdd ? "Add" : "Remove" } Addresses</h1>
                        <div className="px-8 py-4 flex items-center gap-3">
                            <svg width="30px" height="30px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
                                <path style={{fill:'#3E3A45',fillOpacity:'1'}} d="m 55,25 -4,0 c -2,8 -3,9 -11,10 l 0,5 10,0 0,36 5,0 0,-51"/>
                                <ellipse cx="50" cy="50" rx="45" ry="45" style={{fill:'none',stroke:'#3E3A45',strokeWidth:'8',strokeOpacity:'1'}}/>
                            </svg>
                            <p className="text-2xl font-normal">Approve Bond Amount</p>
                        </div>
                        <div className="text-left px-6">
                        <button className="rounded-md border border-transparent bg-[#ace4aa] mb-4 px-6 py-3 text-base font-medium text-gray-800 shadow-md hover:bg-[#9AD398] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#9AD398] focus:ring-offset-2 ml-3" type="button" onClick={handleSubmitApproval}>Submit Approval Transaction</button>
                        </div>
                        <div className="px-8 py-4 flex items-center gap-3">
                            <svg width="30px" height="30px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
                                <path style={{fill:'#3E3A45',fillOpacity:'1'}}  d="m 43,43 c 0,-9 3,-13 8,-13 5,0 8,4 8,9 0,6 -3,9 -7,12 l -6,4 c -6,5 -9,11 -9,20 l 28,0 0,-6 -22,0 c 1,-3 2,-7 7,-10 l 4,-3 c 6,-4 11,-8 11,-16 0,-9 -5,-16 -13,-16 -5,0 -10,3 -12,7 -2,3 -2,6 -2,12 l 5,0"/>
                                <ellipse cx="50" cy="50" rx="45" ry="45" style={{fill:'none',stroke:'#3E3A45',strokeWidth:'8',strokeOpacity:'1'}}/>
                            </svg>
                            <p className="text-2xl font-normal">Enter Addresses</p>
                        </div>
                        <div className="text-left px-6">
                        <div className="ml-2"><textarea ref={addressInputRef} onChange={handleAddressInputChange} rows={3} placeholder={'0x or 0x,0x,0x…'} className="border-2 border-gray-300 w-96 p-4 mb-4"></textarea></div>
                        <button className="mb-10 rounded-md border border-transparent bg-[#ace4aa] px-6 py-3 text-base font-medium text-gray-800 shadow-md hover:bg-[#9AD398] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#9AD398] focus:ring-offset-2 ml-3" type="button" onClick={handleSubmitAddressInput}>Submit Address Transaction</button>
                        </div>
                    </div>
                    </Dialog.Panel>
                </Transition.Child>
                </div>
            </div>
            </Dialog>
            </Transition>
    )
}

