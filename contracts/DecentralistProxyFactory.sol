// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract DecentralistProxyFactory {
    address public implementationContract;

    address[] public allClones;

    event NewClone(address _clone);

    constructor(address _implementation) {
        implementationContract = _implementation;
    }

    function createNewDecentralist(
        bytes memory _fixedAncillaryData,
        string memory _title,
        uint256 _livenessPeriod,
        uint256 _bondAmount,
        uint256 _addReward,
        uint256 _removeReward
    ) external returns (address instance) {
        instance = Clones.clone(implementationContract);
        (bool success, ) = instance.call(
            abi.encodeWithSignature(
                "initialize(bytes,string,uint256,uint256,uint256,uint256)",
                _fixedAncillaryData,
				_title,
				_livenessPeriod,
				_bondAmount,
				_addReward,
				_removeReward
            )
        );
        allClones.push(instance);
        emit NewClone(instance);
        return instance;
    }

	function getAllClones() public view returns(address[] memory) {
		return allClones;
	}
}
