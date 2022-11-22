// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@uma/core/contracts/oracle/interfaces/FinderInterface.sol";
import "@uma/core/contracts/common/interfaces/AddressWhitelistInterface.sol";
import "@uma/core/contracts/oracle/implementation/Constants.sol";

contract DecentraListProxyFactory {
    address public implementationContract;

    address[] public allClones;

    FinderInterface public finder;
    AddressWhitelistInterface public collateralWhitelist;

    event NewClone(address _clone);

    /**
    * @param _implementation is the address decentraList address that clones will be based on.
    * @param _finder is the address of UMA address finder. This is set in the DecentralistProxyFactory constructor.
    */
    constructor(address _implementation, address _finder) {
        require(_finder != address(0), "implementation address can not be empty");
        require(_finder != address(0), "finder address can not be empty");
        implementationContract = _implementation;
        finder = FinderInterface(_finder);
        syncWhitelist();
    }

    /**
    * @notice creates new decentraList smart contract
    * @param _listCriteria Criteria for what addresses should be included on list. Can be text or link to IPFS.
    * @param _title Short title for the list
    * @param _token is the address of the token currency used for this contract. Must be on UMA's collateral whitelist
    * @param _bondAmount Additional bond required, beyond the final fee
    * @param _addReward Reward per address successfully added to the list, paid by contract to proposer
    * @param _removeReward Reward per address successfully removed from the list, paid by contract to proposer
    * @param _liveness The period, in seconds, in which a proposal can be disputed. Must be greater than 8 hours
    * @param _owner Owner of contract can remove funds from contract and adjust reward rates. Set to 0 address to make contract 'public'.
    */
    function createNewDecentralist(
        bytes memory _listCriteria,
        string memory _title,
        address _token,
        uint256 _bondAmount,
        uint256 _addReward,
        uint256 _removeReward,
        uint64 _liveness,
        address _owner
    ) external returns (address instance) {
        // check _token is on UMA's whitelist
        require(collateralWhitelist.isOnWhitelist(_token), "token is not on UMA's collateral whitelist");
        
        // clone implementation
        instance = Clones.clone(implementationContract);
        // initialize new contract
        (bool success, ) = instance.call(
            abi.encodeWithSignature(
                "initialize(address,bytes,string,address,uint256,uint256,uint256,uint64,address)",
                address(finder),
                _listCriteria,
				_title,
				_token,
				_bondAmount,
				_addReward,
				_removeReward,
                _liveness,
                _owner
            )
        );
        require(success, "instance.call failed");

        // store new address
        allClones.push(instance);
        emit NewClone(instance);
        return instance;
    }

    /**
    * @notice returns all addresses created
    */
	function getAllClones() public view returns(address[] memory) {
		return allClones;
	}

    /**
     * @notice This pulls in the most up-to-date Collateral Whitelist.
     * @dev If a new OptimisticOracle is added and this is run between a revision's introduction and execution, the
     * proposal will become unexecutable.
     */
    function syncWhitelist() public {
        collateralWhitelist = AddressWhitelistInterface(finder.getImplementationAddress(OracleInterfaces.CollateralWhitelist));
    }
}
