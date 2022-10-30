// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uma/core/contracts/common/implementation/AncillaryData.sol";
import "@uma/core/contracts/oracle/interfaces/OptimisticOracleV2Interface.sol";

contract Decentralist is Initializable, Ownable {

    event ProposedAddition(uint256 indexed pendingAddressesIndex, address indexed proposer);
    event ProposedRemoval(uint256 indexed pendingAddressesIndex, address indexed proposer);

    event RejectedAddition(uint256 indexed pendingAddressesIndex, address indexed proposer);
    event RejectedRemoval(uint256 indexed pendingAddressesIndex, address indexed proposer);

    event SuccessfulAddition(uint256 indexed pendingAddressesIndex, address indexed proposer);
    event SuccessfulRemoval(uint256 indexed pendingAddressesIndex, address indexed proposer);

    OptimisticOracleV2Interface internal constant oracle =
        OptimisticOracleV2Interface(0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884); //Goerli OOv2
    IERC20 internal constant USDC =
        IERC20(0x07865c6E87B9F70255377e024ace6630C1Eaa37F); //Goerli
 
    // Extra bond in addition to the final fee for the collateral type.
    uint256 public bondAmount;
    uint256 public liveness;
    uint256 public addReward;
    uint256 public removeReward;
    uint256 private pendingAddressesCounter;
    string public title;
    bytes public fixedAncillaryData;

    int256 internal constant PROPOSAL_YES_RESPONSE= int256(1e18);
    bytes32 internal constant PRICE_ID = "YES_OR_NO_QUERY";

    struct Request {
        uint256 pendingAddressesIndex;
        int256 proposedPrice;
        address proposer;
    }

    // This maps hashed oracle price request data to Request in storage
    mapping(bytes => Request) private requests;
    // This maps the pendingAddressesIndex to an array of addresses proposed for addition or removal
    mapping(uint256 => address[]) private pendingAddresses;
    // This maps stores which addresses are on the list  
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
        require(liveness > 8 hours, "liveness must be 8 hours or greater");
        require(bondAmount > 1500 * 10e6, "bond must be 1500 USDC or greater");

        fixedAncillaryData = _fixedAncillaryData;
        title = _title;
        liveness = _liveness;
        bondAmount = _bondAmount;
        addReward = _addReward;
        removeReward = _removeReward;
        pendingAddressesCounter = 1;
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
        // transfer bondAmount from proposer to contract for forwarding to Oracle
        if (bondAmount > 0) {
            bool success = USDC.transferFrom(
                msg.sender,
                address(this),
                bondAmount
            );
            require(success, "transfer of bond amount to List contract failed");
        }
        // prepare price request data
        bytes memory ancillaryDataFull = bytes.concat(
            fixedAncillaryData,
            ". Addresses to query can be found on requester address by calling getPendingAddressesArray with uint argument of ",
            AncillaryData.toUtf8BytesUint(pendingAddressesCounter)
        );
        uint256 currentRequestTime = block.timestamp;

        uint256 totalBond = requestPriceFlow(currentRequestTime, ancillaryDataFull);

        // store request info and pending addresses for future reference
        bytes memory requestData = bytes.concat(
            ancillaryDataFull,
            abi.encodePacked(currentRequestTime)
        );
        requests[requestData].pendingAddressesIndex = pendingAddressesCounter;
        requests[requestData].proposedPrice = PROPOSAL_YES_RESPONSE;
        requests[requestData].proposer = msg.sender;
        pendingAddresses[pendingAddressesCounter] = _addresses;

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

        emit ProposedAddition(pendingAddressesCounter, msg.sender);
        pendingAddressesCounter++;
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

        // transfer bondAmount from proposer to contract for forwarding to Oracle
        if (bondAmount > 0) {
            bool success = USDC.transferFrom(
                msg.sender,
                address(this),
                bondAmount
            );
            require(success, "transfer of bond amount to List contract failed");
        }
        //prepare price request data
        bytes memory ancillaryDataFull = bytes.concat(
            fixedAncillaryData,
            ". Addresses to query can be found on requester address by calling getPendingAddressesArray with uint argument of ",
            AncillaryData.toUtf8BytesUint(pendingAddressesCounter)
        );
        uint256 currentRequestTime = block.timestamp;

        uint256 totalBond = requestPriceFlow(currentRequestTime, ancillaryDataFull);

        // store request info and pending addresses for future reference
        bytes memory requestData = bytes.concat(
            ancillaryDataFull,
            abi.encodePacked(currentRequestTime)
        );
        requests[requestData].pendingAddressesIndex = pendingAddressesCounter;
        requests[requestData].proposedPrice = 0;
        requests[requestData].proposer = msg.sender;
        pendingAddresses[pendingAddressesCounter] = _addresses;

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

        emit ProposedRemoval(pendingAddressesCounter, msg.sender);
        pendingAddressesCounter++;
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
        // restrict function access to oracle
        /*  require(
            msg.sender == address(oracle),
            "only oracle can call this function"
        ); */
        bytes memory requestData = bytes.concat(
            ancillaryData,
            abi.encodePacked(timestamp)
        );

        // make memory copy of current request for reference
        Request memory currentRequest = requests[requestData];

        // handle proposed address removals
        if (currentRequest.proposedPrice == 0) {
            // handle rejections
            if (price != 0) {
                emit RejectedRemoval(
                    currentRequest.pendingAddressesIndex,
                    currentRequest.proposer
                );
                return;
            }
            // handle successful removals
            if(price = 0) {
                // remove addresses from list
                for (
                    uint256 i = 0;
                    i <=
                    pendingAddresses[currentRequest.pendingAddressesIndex].length - 1;
                    i++
                ) {
                    onList[pendingAddresses[
                        currentRequest.pendingAddressesIndex
                    ][i]] = false;
                }
                // pay removal rewards to proposer
                if (removeReward > 0) {
                    uint256 reward = removeReward *
                        pendingAddresses[currentRequest.pendingAddressesIndex].length;
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
                emit SuccessfulRemoval(
                    currentRequest.pendingAddressesIndex,
                    currentRequest.proposer
                );
                return;
            }
        }
        // handle proposed address addtions
        if (currentRequest.proposedPrice == PROPOSAL_YES_RESPONSE) {
            // handle rejections
            if (price != PROPOSAL_YES_RESPONSE) {
                emit RejectedAddition(
                    currentRequest.pendingAddressesIndex,
                    currentRequest.proposer
                );
                return;
            }
            //handle successful additions
            if(price = PROPOSAL_YES_RESPONSE) {
                // add addresses to list
                for (
                    uint256 i = 0;
                    i <=
                    pendingAddresses[currentRequest.pendingAddressesIndex].length - 1;
                    i++
                ) {
                    onList[pendingAddresses[
                        currentRequest.pendingAddressesIndex
                    ][i]] = true;
                }
                // pay add rewards to proposer
                if (addReward > 0) {
                    uint256 reward = addReward *
                        pendingAddresses[currentRequest.pendingAddressesIndex].length;
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
                emit SuccessfulAddition(
                    currentRequest.pendingAddressesIndex,
                    currentRequest.proposer
                );
            }
        }
    }

    /*
    * @notice Returns array of pending addresses for potential disputer verification
    * @param pendingAddressesIndex Index for lookup. This can be found in the oracle ancillary data.
    */
    function getPendingAddressesArray(uint256 pendingAddressesIndex)
        external
        view
        returns (address[] memory)
    {
        return pendingAddresses[pendingAddressesIndex];
    }

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