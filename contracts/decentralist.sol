// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "hardhat/console.sol";

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uma/core/contracts/oracle/implementation/Constants.sol";
import "@uma/core/contracts/oracle/interfaces/FinderInterface.sol";
import "@uma/core/contracts/common/implementation/AncillaryData.sol";
import "@uma/core/contracts/oracle/interfaces/OptimisticOracleV2Interface.sol";

contract Decentralist is Initializable, Ownable {
    event RevisionProposed(
        uint256 indexed revisionId,
        int256 proposedPrice,
        address[] pendingAddresses
    );
    event RevisionApproved(uint256 indexed revisionId);
    event RevisionRejected(uint256 indexed revisionId);
    event RevisionExecuted(uint256 indexed revisionId);

    event RewardsSet(uint256 addReward, uint256 removeReward);
    event LivenessSet(uint64 liveness);
    event BondSet(uint256 bondAmount);
    
    OptimisticOracleV2Interface public oracle;

    FinderInterface public finder;
    bytes public fixedAncillaryData;
    string public title;
    uint256 public bondAmount;
    IERC20 public token;
    uint256 public addReward;
    uint256 public removeReward;
    uint64 public liveness;
    uint256 private revisionCounter;

    int256 internal constant PROPOSAL_YES_RESPONSE = int256(1e18);
    bytes32 internal constant PRICE_ID = "YES_OR_NO_QUERY";

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
        int256 proposedPrice;
        Status status;
    }

    // maps hash of oracle revision data to revisionId
    mapping(bytes32 => uint256) private revisionIds;
    // maps revisionId to Revision
    mapping(uint256 => Revision) public revisions;
    // maps addresses to bool for inclusion on list
    mapping(address => bool) public onList;

    /**
     * @notice Initialize contract
     * @param _finder is the address of UMA address finder. This is set in the DecentralistProxyFactory constructor.
     * @param _listCriteria Criteria for what addresses should be included on list. Can be text or link to IPFS.
     * @param _title Short title for the list
     * @param _token is the address of the token currency used for this contract. Must be on UMA's collateral whitelist
     * @param _bondAmount Additional bond required, beyond the final fee
     * @param _addReward Reward per address successfully added to the list, paid by contract to proposer
     * @param _removeReward Reward per address successfully removed from the list, paid by contract to proposer
     * @param _liveness The period, in seconds, in which a proposal can be disputed. Must be greater than 8 hours
     * @param _owner Owner of contract can remove funds from contract and adjust reward rates. Set to 0 address to make contract 'public'.
     */
    function initialize(
        address _finder,
        bytes memory _listCriteria,
        string memory _title,
        address _token,
        uint256 _bondAmount,
        uint256 _addReward,
        uint256 _removeReward,
        uint64 _liveness,
        address _owner
    ) public initializer {
        finder = FinderInterface(_finder);
        // add boilerplate directions for verification to _listCriteria
        fixedAncillaryData = bytes.concat(
            _listCriteria,
            ". Addresses to query can be found in the pendingAddresses parameter of the RevisionProposed event emitted by the requester's address in the same transaction as the proposed price with Revision ID = "
        );
        title = _title;
        token = IERC20(_token);
        bondAmount = _bondAmount;
        addReward = _addReward;
        removeReward = _removeReward;
        liveness = _liveness;

        _transferOwnership(_owner);
        syncOracle();

        revisionCounter = 1;
    }

    /**
     * @notice Proposes addresses to add or remove from the list
     * @param _price for the proposed revision. 0 = remove, 1e18 = add
     * @param _addresses array of addresses for the proposed revision
     * @dev Caller must have approved this contract to spend the total bond amount of the contract's token before calling
     */
    function proposeRevision(int256 _price, address[] calldata _addresses)
        public
    {
        require(
            _price == 0 || _price == PROPOSAL_YES_RESPONSE,
            "invalid price"
        );

        // prepare oracle price request data
        bytes memory ancillaryData = bytes.concat(
            fixedAncillaryData,
            AncillaryData.toUtf8BytesUint(revisionCounter)
        );
        uint256 currentTime = block.timestamp;

        // prepare data for storage in Revision
        bytes32 oracleRequestHash = keccak256(
            abi.encodePacked(ancillaryData, currentTime)
        );
        bytes32 addressesHash = keccak256(abi.encodePacked(_addresses));

        // map oracleRequestHash to the current revisionCounter
        revisionIds[oracleRequestHash] = revisionCounter;

        // store Revision data in revisions mapping under the revisionCounter
        revisions[revisionCounter].proposer = msg.sender;
        revisions[revisionCounter].addressesHash = addressesHash;
        revisions[revisionCounter].proposedPrice = _price;
        revisions[revisionCounter].status = Status.Pending;

        // request price from oracle and configure request settings
        oracle.requestPrice(PRICE_ID, currentTime, ancillaryData, token, 0);
        oracle.setCallbacks(
            PRICE_ID,
            currentTime,
            ancillaryData,
            false,
            false,
            true
        );
        oracle.setCustomLiveness(
            PRICE_ID,
            currentTime,
            ancillaryData,
            liveness
        );
        uint256 totalBond = oracle.setBond(
            PRICE_ID,
            currentTime,
            ancillaryData,
            bondAmount
        );

        // transfer totalBond from proposer to contract for forwarding to Oracle
        if (totalBond > 0) {
            bool success = token.transferFrom(
                msg.sender,
                address(this),
                totalBond
            );
            require(success, "transfer of bond amount to List contract failed");
        }

        // approve oracle to transfer total bond amount from list contract
        if (totalBond > 0) {
            bool success = token.approve(address(oracle), totalBond);
            require(
                success,
                "approval of bond amount from List contract to Oracle failed"
            );
        }

        // propose price to oracle
        oracle.proposePriceFor(
            msg.sender,
            address(this),
            PRICE_ID,
            currentTime,
            ancillaryData,
            _price
        );

        emit RevisionProposed(revisionCounter, _price, _addresses);
        revisionCounter++;
    }

    /**
     * @notice Callback function called upon oracle price settlement to update the Revision status to Approved or Rejected
     * @param timestamp timestamp to identify the existing request.
     * @param ancillaryData ancillary data of the price being requested.
     * @param price price returned from the oracle
     */
    function priceSettled(
        bytes32, /* identifier */
        uint256 timestamp,
        bytes memory ancillaryData,
        int256 price
    ) external {
        //TO DO: REMOVE COMMENTED OUT PORTION BELOW AFTER TESTING
        // restrict function access to oracle
        /*  require(
            msg.sender == address(oracle),
            "only oracle can call this function"
        ); */

        // get revisionId from oracleRequestHash
        bytes32 oracleRequestHash = keccak256(
            abi.encodePacked(ancillaryData, timestamp)
        );
        uint256 revisionId = revisionIds[oracleRequestHash];

        // set status to Approved or Rejected
        if (revisions[revisionId].proposedPrice == price) {
            revisions[revisionId].status = Status.Approved;
            emit RevisionApproved(revisionId);
        } else {
            revisions[revisionId].status = Status.Rejected;
            emit RevisionRejected(revisionId);
        }
    }

    /**
     * @notice executes approved revisions by revising list and paying out rewards to proposer
     * @param _revisionId to be executed. If Revision submitted does not have status Approved, tx will revert.
     * @param _addresses address array that matches the array logged in the RevisionProposed event for the provided _revisionId
     */
    function executeRevision(uint256 _revisionId, address[] calldata _addresses)
        external
    {
        require(
            revisions[_revisionId].status == Status.Approved,
            "_revisionId is not approved"
        );
        require(
            revisions[_revisionId].addressesHash ==
                keccak256(abi.encodePacked(_addresses)),
            "addresses provided do not match the provided _revisionId's addressesHash"
        );

        //update Revision status
        revisions[_revisionId].status = Status.Executed;

        // default newListValue and rewardRate to remove addresses
        bool newListValue = false;
        uint256 rewardRate = removeReward;
        // if Revision proposedPrice is to add addresses, set newListValue and rewardRate to add addresses
        if (revisions[_revisionId].proposedPrice == PROPOSAL_YES_RESPONSE) {
            newListValue = true;
            rewardRate = addReward;
        }

        // add or remove address from the list and increment rewardCounter for calculating rewards
        uint256 rewardCounter;
        for (uint256 i = 0; i <= _addresses.length - 1; i++) {
            if (onList[_addresses[i]] != newListValue) {
                onList[_addresses[i]] = newListValue;
                rewardCounter++;
            }
        }

        // calculate & pay out rewards to proposer
        uint256 reward = rewardRate * rewardCounter;
        if (reward > 0) {
            if (token.balanceOf(address(this)) < reward) {
                token.transfer(
                    revisions[_revisionId].proposer,
                    token.balanceOf(address(this))
                );
            } else {
                token.transfer(revisions[_revisionId].proposer, reward);
            }
        }
        emit RevisionExecuted(_revisionId);
    }

    /**
     * @notice Allows owner to withdraw funds from the contract.
     * @param recipient of funds
     * @param amount to send
     */
    function withdraw(address recipient, uint256 amount) external onlyOwner {
        token.transfer(recipient, amount);
    }

    /**
     * @notice Sets the add and remove rewards for successful revisions
     * @param _addReward reward to proposer per address successfully added to the list
     * @param _removeReward reward to proposer per address successfully removed from the list
     */
    function setRewards(uint256 _addReward, uint256 _removeReward) public onlyOwner {
        addReward = _addReward;
        removeReward = _removeReward;
        emit RewardsSet(_addReward, _removeReward);
    }

    /**
     * @notice Sets the bond amount for revisions.
     * @param _bondAmount amount of the bond token that will need to be paid for future proposals.
     */
    function setBond(uint256 _bondAmount) public onlyOwner {
        // Value of the bond required for proposing revisions, in addition to the final fee. A bond of zero is
        // acceptable, in which case the Optimistic Oracle will require the final fee as the bond.

        //TO DO: enforce minimum bond as a multiplier of the final fee?
        
        bondAmount = _bondAmount;
        emit BondSet(_bondAmount);
    }

    /**
     * @notice Sets the liveness for future revisions. This is the amount of delay before a proposal is approved by
     * default.
     * @param _liveness liveness to set in seconds.
     */
    function setLiveness(uint64 _liveness) public onlyOwner {
        // TO DO: remove comments after testing
        /* require(_liveness >= 8 hours, "liveness must be >= 8 hours");
        require(_liveness < 5200 weeks, "liveness must be less than 5200 weeks"); */
        liveness = _liveness;
        emit LivenessSet(_liveness);
    }

    /**
     * @notice This pulls in the most up-to-date Optimistic Oracle.
     * @dev If a new OptimisticOracle is added and this is run between a revision's introduction and execution, the
     * proposal will become unexecutable.
     */
    function syncOracle() public {
        oracle = OptimisticOracleV2Interface(
            finder.getImplementationAddress(OracleInterfaces.OptimisticOracleV2)
        );
    }
}
