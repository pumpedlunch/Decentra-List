// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@uma/core/contracts/oracle/interfaces/FinderInterface.sol";
import "@uma/core/contracts/common/interfaces/AddressWhitelistInterface.sol";

abstract contract DecentralistProxyFactoryInterface {
    function minimumLiveness() external view virtual returns (uint64);

    function implementationContract() external view virtual returns (address);

    function allClones() external view virtual returns (address[] memory);

    function finder() external view virtual returns (FinderInterface);

    function collateralWhitelist()
        external
        view virtual
        returns (AddressWhitelistInterface);

    event NewClone(address _clone);

    /**
     * @notice Creates a new decentraList smart contract.
     * @param _listCriteria Criteria for what addresses should be included on the list. Can be on-chain text or a link to IPFS.
     * @param _title Short title for the list.
     * @param _token The address of the token currency used for this contract. Must be on UMA's collateral whitelist.
     * @param _bondAmount Additional bond required, beyond the final fee.
     * @param _additionReward Reward per address successfully added to the list, paid by the contract to the proposer.
     * @param _removalReward Reward per address successfully removed from the list, paid by the contract to the proposer.
     * @param _liveness The period, in seconds, in which a proposal can be disputed. Must be greater than 8 hours.
     * @param _owner Owner of the contract can remove funds from the contract and adjust bondAmount, rewards and liveness.
     * Set to the 0 address to make the contract a non-managed public good.
     */
    function createNewDecentralist(
        bytes memory _listCriteria,
        string memory _title,
        address _token,
        uint256 _bondAmount,
        uint256 _additionReward,
        uint256 _removalReward,
        uint64 _liveness,
        address _owner
    ) external virtual returns(address instance);

    /**
     * @notice Returns all instances created.
     */
    function getAllClones() external view virtual returns (address[] memory);

    /**
     * @notice This pulls in the most up-to-date collateral whitelist.
     * @dev If a new OptimisticOracle is added and this function is run between a list revision's proposal and execution,
     * the proposal will become unexecutable.
     */
    function syncWhitelist() public virtual;
}
