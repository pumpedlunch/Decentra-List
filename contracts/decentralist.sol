// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uma/core/contracts/common/implementation/AncillaryData.sol";
import "@uma/core/contracts/oracle/interfaces/OptimisticOracleV2Interface.sol";

contract Decentralist is Initializable, Ownable {

    // DONE: REMOVE pendingAddressesIndex, include ADDRESS ARRAY, HASH OF ARRAY AND PROPOSER -----------------------

    event ProposedAddition(uint indexed requestId, bytes32 indexed addressesHash, address[] pendingAddresses);
    event ProposedRemoval(uint indexed requestId, bytes32 indexed addressesHash, address[] pendingAddresses);

    // DONE: REMOVE pendingAddressesIndex, include HASH OF ARRAY AND PROPOSER -----------------------

    event ApprovedAddition(uint indexed requestId);
    event ApprovedRemoval(uint indexed requestId);

    // DONE: REMOVE pendingAddressesIndex, include HASH OF ARRAY AND PROPOSER -----------------------

    event RejectedAddition(uint indexed requestId);
    event RejectedRemoval(uint indexed requestId);

    OptimisticOracleV2Interface internal constant oracle =
        OptimisticOracleV2Interface(0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884); //Goerli OOv2
    IERC20 internal constant USDC =
        IERC20(0x07865c6E87B9F70255377e024ace6630C1Eaa37F); //Goerli
 
    // Extra bond in addition to the final fee for the collateral type.
    uint256 public bondAmount;
    uint256 public liveness;
    uint256 public addReward;
    uint256 public removeReward;
    // DONE: delete pendingAddressesCounter -----------------------
    uint requestCounter;
    string public title;
    bytes public fixedAncillaryData;

    int256 internal constant PROPOSAL_YES_RESPONSE= int256(1e18);
    bytes32 internal constant PRICE_ID = "YES_OR_NO_QUERY";

    enum Status {
        Pending,
        Approved,
        Rejected
    }

    // DONE: REPLACE pending AdressesIndex with hash of addresses -----------------------
    struct Request {
        address proposer;
        bytes32 addressHash;
        int256 proposedPrice;
        uint256 addressesCount;      
        Status status;
    }

    // maps oracleRequestId to requestId
    mapping(bytes => uint) private requestIds;
    // maps requestId to Request 
    mapping(uint => Request) public requests;

    // DONE: delete pendingAddresses -----------------------

    // mapping stores which addresses are on the list  
    mapping(address => bool) public onList;

    /* 
    * @notice Initialize contract
    * @param _fixedAncillaryData Rules for what addresses should be included on list. Can be text or link to IPFS.
    * @param _title Short title for the list
    * @param _liveness The period, in seconds, in which a proposal can be disputed.
    * @param _bondAmount Additional bond required, beyond the final fee.
    * @param _addReward Reward per address successfully added to the list, paid by contract to proposer
    * @param _removeReward Reward per address successfully removed from the list, paid by contract to proposer
    * @param _owner Owner of contract can remove funds from contract and adjust reward rates
    */
    function initialize(
        bytes memory _fixedAncillaryData,
        string memory _title,
        uint256 _liveness,
        uint256 _bondAmount,
        uint256 _addReward,
        uint256 _removeReward,
        address _owner
    ) public initializer {
        require(_liveness > 8 hours, "liveness must be 8 hours or greater");
        require(_bondAmount > 1500 * 10e6, "bond must be 1500 USDC or greater");

        fixedAncillaryData = _fixedAncillaryData;
        title = _title;
        liveness = _liveness;
        bondAmount = _bondAmount;
        addReward = _addReward;
        removeReward = _removeReward;
        requestCounter = 1;
        transferOwnership(_owner);        
    }

    /* 
    * @notice Proposes addresses to be added to the list
    * @param _addresses addresses proposed to be added
    */
    function addAddresses(address[] calldata _addresses) public {
        // revert if any addresses are already on the list or list contains duplicates
        for (uint256 i = 0; i <= _addresses.length - 1; i++) {
            require(
                !onList[_addresses[i]],
                "at least 1 address is already on list"
            );
            for (uint256 j = i + 1; j <= _addresses.length - 1; j++) {
                require(
                    _addresses[i] != _addresses[j],
                    "addresses contain duplicate"
                );
            }
        }
        
        // prepare price request data
        // DONE: adjust ancillary data creation for event. Here AND in removeAddresses -----------------------
        // TO DO, combine ancillary data in the initializer, just append requestID to ancillary data here so that the oracle request ID is differentiated by more than timestamp. Do for all instances
        bytes memory ancillaryDataFull = bytes.concat(
            fixedAncillaryData,
            // TO DO: is there a better way to describe the below?
            ". Addresses to query can be found in the pendingAddresses parameter of the ProposedAddition event emitted by the requester's address in the same transaction as the proposed price."
        );
        uint256 currentRequestTime = block.timestamp;

        uint256 totalBond = requestPriceFlow(currentRequestTime, ancillaryDataFull);

        bytes memory oracleRequestId = bytes.concat(
            ancillaryDataFull,
            abi.encodePacked(currentRequestTime)
        );

        bytes32 addressHash = keccak256(abi.encodePacked(_addresses));

        // map oracleRequestId to the current requestCounter
        requestIds[oracleRequestId] = requestCounter;

        // store request data under the addressHash
        requests[requestCounter].proposer = msg.sender;
        requests[requestCounter].addressHash = addressHash;
        requests[requestCounter].proposedPrice = PROPOSAL_YES_RESPONSE;
        requests[requestCounter].addressesCount = _addresses.length;
        

        // transfer totalBond from proposer to contract for forwarding to Oracle
        //TO DO: adjust front end approval to be for totalBond
        if (totalBond > 0) {
            bool success = USDC.transferFrom(
                msg.sender,
                address(this),
                totalBond
            );
            require(success, "transfer of bond amount to List contract failed");
        }

        // approve oracle to transfer total bond amount from list contract
        if (totalBond > 0) {
            bool success = USDC.approve(address(oracle), totalBond);
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
            currentRequestTime,
            ancillaryDataFull,
            PROPOSAL_YES_RESPONSE
        );

        emit ProposedAddition(requestCounter, addressHash, _addresses);
        requestCounter++;
    }

    /* 
    * @notice Proposes addresses to be removed from the list
    * @param _addresses addresses proposed to be added
    */
    function removeAddresses(address[] calldata _addresses) public {
        // revert if any addresses are not on the list or list contains duplicates
        for (uint256 i = 0; i <= _addresses.length - 1; i++) {
            require(
                onList[_addresses[i]],
                "at least 1 address is not on list"
            );
            for (uint256 j = i + 1; j <= _addresses.length - 1; j++) {
                require(
                    _addresses[i] != _addresses[j],
                    "addresses contain duplicate"
                );
            }
        }

        //prepare price request data
        bytes memory ancillaryDataFull = bytes.concat(
            fixedAncillaryData,
            // TO DO: is there a better way to describe the below?
            ". Addresses to query can be found in the pendingAddresses parameter of the ProposedAddition event emitted by the requester's address in the same transaction as the proposed price."
        );
        uint256 currentRequestTime = block.timestamp;

        uint256 totalBond = requestPriceFlow(currentRequestTime, ancillaryDataFull);

        // TO DO: change this to keccak hash, not concat in all instances
        bytes memory oracleRequestId = bytes.concat(
            ancillaryDataFull,
            abi.encodePacked(currentRequestTime)
        );

        bytes32 addressHash = keccak256(abi.encodePacked(_addresses));

        // map oracleRequestId to the current requestCounter
        requestIds[oracleRequestId] = requestCounter;

        // store request data under the addressHash
        requests[requestCounter].proposer = msg.sender;
        requests[requestCounter].addressHash = addressHash;
        requests[requestCounter].proposedPrice = 0;
        requests[requestCounter].addressesCount = _addresses.length;
        
        // transfer bondAmount from proposer to contract for forwarding to Oracle
        if (totalBond > 0) {
            bool success = USDC.transferFrom(
                msg.sender,
                address(this),
                totalBond
            );
            require(success, "transfer of bond amount to List contract failed");
        }

        // approve oracle to transfer total bond amount from list contract
        if (totalBond > 0) {
            bool success = USDC.approve(address(oracle), totalBond);
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
            currentRequestTime,
            ancillaryDataFull,
            0
        );

        emit ProposedRemoval(requestCounter, addressHash, _addresses);
        requestCounter++;
    }

    /* 
    * @notice Callback function called upon oracle price settlement
    * @param identifer price identifier to identify the existing request.
    * @param timestamp timestamp to identify the existing request.
    * @param ancillaryData ancillary data of the price being requested.
    * @param settled price returned from the oracle
    */
    //externally called settle function will call this when price is settled
    function priceSettled(
        bytes32 identifier,
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
        bytes memory oracleRequestId = bytes.concat(
            ancillaryData,
            abi.encodePacked(timestamp)
        );

        // make memory copy of current request for reference
        uint _requestId = requestIds[oracleRequestId];
        Request memory currentRequest = requests[_requestId];

        // handle proposed address removals
        if (currentRequest.proposedPrice == 0) {
            // handle rejections
            if (price != 0) {
                currentRequest.status = Status.Rejected;
                emit RejectedRemoval(
                    _requestId
                );
                return;
            }
            // handle successful removals
            if(price == 0) {
                // DONE: CHANGE TO MARK ADDRESS ARRAY HASH AS VALID FOR INCLUSION ------------
                currentRequest.status = Status.Approved;
                // pay removal rewards to proposer
                if (removeReward > 0) {
                    uint256 reward = removeReward *
                        currentRequest.addressesCount;
                    if (USDC.balanceOf(address(this)) < reward) {
                        USDC.transfer(
                            currentRequest.proposer,
                            USDC.balanceOf(address(this))
                        );
                    } else {
                        USDC.transfer(
                            currentRequest.proposer,
                            reward
                        );
                    }
                }
                emit ApprovedRemoval(
                    _requestId
                );
                return;
            }
        }
        // handle proposed address addtions
        if (currentRequest.proposedPrice == PROPOSAL_YES_RESPONSE) {
            // handle rejections
            if (price != PROPOSAL_YES_RESPONSE) {
                currentRequest.status = Status.Rejected;
                emit RejectedAddition(
                    _requestId
                );
                return;
            }
            //handle successful additions
            if(price == PROPOSAL_YES_RESPONSE) {
                // DONE: CHANGE TO MARK ADDRESS ARRAY HASH AS VALID FOR INCLUSION ------------
                currentRequest.status = Status.Approved;
                // pay add rewards to proposer
                if (addReward > 0) {
                    uint256 reward = addReward *
                        currentRequest.addressesCount;
                    if (USDC.balanceOf(address(this)) < reward) {
                        USDC.transfer(
                            currentRequest.proposer,
                            USDC.balanceOf(address(this))
                        );
                    } else {
                        USDC.transfer(
                            currentRequest.proposer,
                            reward
                        );
                    }
                }
                emit ApprovedAddition(
                    _requestId
                );
            }
        }
    }

    // TO DO: ADD FUNCTION FOR ACTING OUT APPROVED ADDRESS ARRAY HASHES ------------
    function executeApprovedRequests(bytes32 addressesHash, address[] calldata _addresses) external {

    }
                /* example code for removing address from mapping
                    for (
                    uint256 i = 0;
                    i <=
                    pendingAddresses[currentRequest.pendingAddressesIndex].length - 1;
                    i++
                ) {
                    onList[pendingAddresses[
                        currentRequest.pendingAddressesIndex
                    ][i]] = false;
                } */


    // DONE: DELETE getPendingAddressesArray ------------

    /*
    * @notice Allows owner to withdraw funds from the contract. 
    * @param recipient of funds
    * @param amount to send
    */
    function withdraw(address recipient, uint256 amount) external onlyOwner {
        USDC.transfer(recipient, amount);
    }

    /*
    * @notice Allows owner to adjust reward amounts 
    * @param _addReward New reward per address successfully added to the list, paid by contract to proposer
    * @param _removeReward New reward per address successfully removed from the list, paid by contract to proposer
    */
    function adjustRewards(uint256 _addReward, uint256 _removeReward) external onlyOwner {
        addReward = _addReward;
        removeReward = _removeReward;
    }

    /*
    * @notice Internal function that calls oracle to request price and configure settings  
    * @param _currentRequestTime Timestamp for the price request
    * @param _ancillaryDataFull Full ancillary data for the price request
    */
    function requestPriceFlow(
        uint256 _currentRequestTime,
        bytes memory _ancillaryDataFull
    ) internal returns(uint256 totalBond) {
        oracle.requestPrice(
            PRICE_ID,
            _currentRequestTime,
            _ancillaryDataFull,
            USDC,
            0
        );
        oracle.setCallbacks(
            PRICE_ID,
            _currentRequestTime,
            _ancillaryDataFull,
            false,
            false,
            true
        );
        oracle.setCustomLiveness(
            PRICE_ID,
            _currentRequestTime,
            _ancillaryDataFull,
            liveness
        );
        totalBond = oracle.setBond(
            PRICE_ID,
            _currentRequestTime,
            _ancillaryDataFull,
            bondAmount
        );
    }
}