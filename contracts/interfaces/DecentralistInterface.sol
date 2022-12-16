// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@uma/core/contracts/oracle/interfaces/StoreInterface.sol";
import "@uma/core/contracts/oracle/interfaces/OptimisticOracleV2Interface.sol";

abstract contract DecentralistInterface is Initializable, Ownable {
    using SafeERC20 for IERC20;

    event RevisionProposed(
        uint256 indexed revisionId,
        int256 proposedValue,
        address[] pendingAddresses
    );
    event RevisionApproved(uint256 indexed revisionId, int256 proposedValue);
    event RevisionRejected(uint256 indexed revisionId, int256 proposedValue);
    event RevisionExecuted(
        uint256 indexed revisionId,
        int256 proposedValue,
        address[] revisedAddresses
    );

    event RewardsSet(uint256 additionReward, uint256 removalReward);
    event LivenessSet(uint64 liveness);
    event BondSet(uint256 bondAmount);

    function oracle()
        external
        view
        virtual
        returns (OptimisticOracleV2Interface);

    function store() external view virtual returns (StoreInterface);

    function finder() external view virtual returns (FinderInterface);

    function fixedAncillaryData() external view virtual returns (bytes memory);

    function title() external view virtual returns (string memory);

    function bondAmount() external view virtual returns (uint256);

    function token() external view virtual returns (IERC20);

    function additionReward() external view virtual returns (uint256);

    function removalReward() external view virtual returns (uint256);

    function liveness() external view virtual returns (uint64);

    function minimumLiveness() external view virtual returns (uint64);

    enum Status {
        Invalid,
        Pending,
        Approved,
        Rejected,
        Executed
    }

    struct Revision {
        address proposer;
        bytes32 addressesHash;
        int256 proposedValue;
        Status status;
    }

    // maps revisionId to Revision struct
    function revisions(uint256 RevisionId)
        external
        view
        virtual
        returns (Revision memory);

    // returns boolean whether address is on list
    function onList(address) external view virtual returns (bool);

    /**
     * @notice Initializes the contract.
     * @param _finder The address of UMA Finder contract. This is set in the DecentralistProxyFactory constructor.
     * @param _listCriteria Criteria for what addresses should be included on the list. Can be on-chain text or a link to IPFS.
     * @param _title Short title for the list.
     * @param _token The address of the token currency used for this contract. Must be on UMA's collateral whitelist.
     * @param _bondAmount Additional bond required, beyond the final fee.
     * @param _additionReward Reward per address successfully added to the list, paid by the contract to the proposer.
     * @param _removalReward Reward per address successfully removed from the list, paid by the contract to the proposer.
     * @param _liveness The period, in seconds, in which a proposal can be disputed.
     * @param _minimumLiveness The minimum allowable liveness period, in seconds.
     * @param _owner Owner of the contract can remove funds from the contract and adjust reward rates. Set to the 0 address to make the contract 'public'.
     */
    function initialize(
        address _finder,
        bytes memory _listCriteria,
        string memory _title,
        address _token,
        uint256 _bondAmount,
        uint256 _additionReward,
        uint256 _removalReward,
        uint64 _liveness,
        uint64 _minimumLiveness,
        address _owner
    ) external virtual;

    /**
     * @notice Proposes addresses to add or remove from the list.
     * @param _value Indicates if the proposed revision is adding or removing addresses. 0 = remove, 1e18 = add.
     * @param _addresses Array of addresses for the proposed revision.
     * @dev Caller must have approved this contract to spend the total bond amount of the contract's token before calling.
     */
    function proposeRevision(int256 _value, address[] calldata _addresses)
        external
        virtual;

    /**
     * @notice Callback function called upon oracle data settlement to update the Revision status to Approved or Rejected.
     * @param timestamp Timestamp to identify the existing request.
     * @param ancillaryData Ancillary data of the data being requested.
     * @param value Value returned from the oracle.
     */
    function priceSettled(
        bytes32, /* identifier */
        uint256 timestamp,
        bytes memory ancillaryData,
        int256 value
    ) external virtual;

    /**
     * @notice Executes approved revisions by revising the list and paying out rewards to the proposer.
     * @param _revisionId ID of revision to be executed. If Revision submitted does not have status Approved, tx will revert.
     * @param _addresses Address array that matches the array logged in the RevisionProposed event for the provided _revisionId.
     */
    function executeRevision(uint256 _revisionId, address[] calldata _addresses)
        external virtual;

    /**
     * @notice Allows owner to withdraw the default tokens from the contract.
     * @param recipient The recipient of the tokens.
     * @param amount The amount of tokens to to send.
     */
    function withdraw(address recipient, uint256 amount) external virtual;

    /**
     * @notice Allows owner to rescue tokens sent accidentally to the contract.
     * @param recipient The recipient of the tokens.
     * @param amount The amount of tokens to to send.
     * @param _token The contract address of the token to send.
     */
    function rescue(
        address recipient,
        uint256 amount,
        address _token
    ) external virtual;

    /**
     * @notice Sets the rewards for successful revisions.
     * @param _additionReward Reward to proposer per address successfully added to the list.
     * @param _removalReward Reward to proposer per address successfully removed from the list.
     */
    function setRewards(uint256 _additionReward, uint256 _removalReward)
        external virtual;

    /**
     * @notice Sets the bond amount for revisions.
     * @param _bondAmount Amount of the bond token that will need to be paid for future proposals.
     */
    function setBond(uint256 _bondAmount) external virtual;

    /**
     * @notice Sets the liveness for future revisions. This is the amount of delay before a proposal is approved by
     * default.
     * @param _liveness Liveness to set in seconds.
     */
    function setLiveness(uint64 _liveness) external virtual;

    /**
     * @notice This pulls in the most up-to-date Optimistic Oracle contract.
     * @dev If a new OptimisticOracle is added and this is run between a revision's introduction and execution, the
     * proposal will become unexecutable.
     */
    function syncContracts() public virtual;
}
