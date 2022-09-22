// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface OptimisticOracleV2Interface {
    function requestPrice(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        IERC20 currency,
        uint256 reward
    ) external returns (uint256 totalBond);

    function setCustomLiveness(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        uint256 customLiveness
    ) external;

    function setBond(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        uint256 bond
    ) external returns (uint256 totalBond);

    function proposePriceFor(
        address proposer,
        address requester,
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        int256 proposedPrice
    ) external returns (uint256 totalBond);

    function setCallbacks(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        bool callbackOnPriceProposed,
        bool callbackOnPriceDisputed,
        bool callbackOnPriceSettled
    ) external;
}

contract List {

    bytes public fixedAncillaryData;
    bytes32 public priceId = "YES_OR_NO_QUERY";
    string public title;
    uint public livenessPeriod;
    uint public bondAmount;
    uint public addReward;
    uint public removeReward;
    address[] private listArray;
    mapping(address => bool) public listMapping;

    struct SingleRequest{
        address pendingAddress;
        int proposedPrice;
        address proposer;
    }
    mapping(bytes => SingleRequest) private singleRequests;

    struct MultipleRequest{
        uint pendingAddressesKey;
        int proposedPrice;
        address proposer;
    }
    mapping(bytes => MultipleRequest) private multipleRequests;
    mapping(uint => address[]) private pendingAddresses;
    uint private pendingAddressesCounter = 1;


    OptimisticOracleV2Interface oracle = OptimisticOracleV2Interface(0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884); //Goerli OOv2
    IERC20 constant WETH = IERC20(0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6); //Goerli

    event SinglePriceProposed(address _address, int price);
    event SinglePriceSettled(address _address, int price);
    event MultiplePriceProposed(uint pendingAddressesKey, int price);
    event MultiplePriceSettled(uint pendingAddressesKey, int price);

    constructor(bytes memory _fixedAncillaryData, string memory _title, uint _livenessPeriod, uint _bondAmount, uint _addReward, uint _removeReward) {
        fixedAncillaryData = _fixedAncillaryData;
        title = _title;
        livenessPeriod = _livenessPeriod;
        bondAmount = _bondAmount;
        addReward = _addReward;
        removeReward = _removeReward;
    }

    function addSingleAddress(address _address) public {
        require(!listMapping[_address], "address is already on list");
        if(bondAmount > 0){
            bool success = WETH.transferFrom(msg.sender, address(this), bondAmount);
            require(success, "transfer of bond amount to List contract failed");
        }
        //prepare price request data
        string memory _addressString = toAsciiString(_address);
        bytes memory ancillaryDataFull = bytes.concat(fixedAncillaryData, " Addresses to Query: ", abi.encodePacked(_addressString));
        uint currentRequestTime = block.timestamp;
        
        requestPriceFlow(currentRequestTime, ancillaryDataFull);

        //store request info for future reference
        bytes memory requestData = bytes.concat(ancillaryDataFull, abi.encodePacked(currentRequestTime));
        singleRequests[requestData].pendingAddress = _address;
        singleRequests[requestData].proposedPrice = 1e18;
        singleRequests[requestData].proposer = msg.sender;
        
        if(bondAmount > 0){
            bool success = WETH.approve(address(oracle), bondAmount);
            require(success, "approval of bond amount from List contract to Oracle failed");
        }
        oracle.proposePriceFor(msg.sender, address(this), priceId, currentRequestTime, ancillaryDataFull, 1e18);

        emit SinglePriceProposed(_address, 1e18);
    }

    function addMutlipleAddresses(address[] calldata _addresses) public {
        for(uint i = 0; i <= _addresses.length - 1; i++) {
            require(!listMapping[_addresses[i]], "at least 1 address is already on list");
        }
        if(bondAmount > 0){
            bool success = WETH.transferFrom(msg.sender, address(this), bondAmount);
            require(success, "transfer of bond amount to List contract failed");
        }
        //prepare price request data
        bytes memory ancillaryDataFull = bytes.concat(
            fixedAncillaryData,
            "Addresses to query can be found on requester address by calling getPendingAddressesArray with uint argument:",
            toUtf8BytesUint(pendingAddressesCounter));
        uint currentRequestTime = block.timestamp;
        
        requestPriceFlow(currentRequestTime, ancillaryDataFull);

        //store request info for future reference
        bytes memory requestData = bytes.concat(ancillaryDataFull, abi.encodePacked(currentRequestTime));
        multipleRequests[requestData].pendingAddressesKey = pendingAddressesCounter;
        multipleRequests[requestData].proposedPrice = 1e18;
        multipleRequests[requestData].proposer = msg.sender;
        pendingAddresses[pendingAddressesCounter] = _addresses;
        
        if(bondAmount > 0){
            bool success = WETH.approve(address(oracle), bondAmount);
            require(success, "approval of bond amount from List contract to Oracle failed");
        }
        oracle.proposePriceFor(msg.sender, address(this), priceId, currentRequestTime, ancillaryDataFull, 1e18);

        emit MultiplePriceProposed(pendingAddressesCounter, 1e18);
        pendingAddressesCounter++;
    }

    function removeSingleAddress(address _address) public {
        require(listMapping[_address], "address is not on list");
        if(bondAmount > 0){
            bool success = WETH.transferFrom(msg.sender, address(this), bondAmount);
            require(success, "transfer of bond amount to List contract failed");
        }

        //prepare price request data
        string memory _addressString = toAsciiString(_address);
        bytes memory ancillaryDataFull = bytes.concat(fixedAncillaryData, " Address to Query: ", abi.encodePacked(_addressString));
        uint currentRequestTime = block.timestamp;

        requestPriceFlow(currentRequestTime, ancillaryDataFull);

        //store request info for future reference
        bytes memory requestData = bytes.concat(ancillaryDataFull, abi.encodePacked(currentRequestTime));

        singleRequests[requestData].pendingAddress = _address;
        singleRequests[requestData].proposedPrice = 0;
        singleRequests[requestData].proposer = msg.sender;

        if(bondAmount > 0){
            bool success = WETH.approve(address(oracle), bondAmount);
            require(success, "approval of bond amount from List contract to Oracle failed");
        }

        //propose price to OO
        oracle.proposePriceFor(msg.sender, address(this), priceId, currentRequestTime, ancillaryDataFull, 0);

        emit SinglePriceProposed(_address, 0);  
    }

    function removeMutlipleAddresses(address[] calldata _addresses) public {
        for(uint i = 0; i <= _addresses.length - 1; i++) {
            require(listMapping[_addresses[i]], "at least 1 address is not on list");
        }
        if(bondAmount > 0){
            bool success = WETH.transferFrom(msg.sender, address(this), bondAmount);
            require(success, "transfer of bond amount to List contract failed");
        }
        //prepare price request data
        bytes memory ancillaryDataFull = bytes.concat(
            fixedAncillaryData,
            "For list of addresses to query, view pendingAddresses mapping at requester address for uint:",
            toUtf8BytesUint(pendingAddressesCounter));
        uint currentRequestTime = block.timestamp;
        
        requestPriceFlow(currentRequestTime, ancillaryDataFull);

        //store request info for future reference
        bytes memory requestData = bytes.concat(ancillaryDataFull, abi.encodePacked(currentRequestTime));
        multipleRequests[requestData].pendingAddressesKey = pendingAddressesCounter;
        multipleRequests[requestData].proposedPrice = 0;
        multipleRequests[requestData].proposer = msg.sender;
        pendingAddresses[pendingAddressesCounter] = _addresses;
        
        if(bondAmount > 0){
            bool success = WETH.approve(address(oracle), bondAmount);
            require(success, "approval of bond amount from List contract to Oracle failed");
        }
        oracle.proposePriceFor(msg.sender, address(this), priceId, currentRequestTime, ancillaryDataFull, 0);

        emit MultiplePriceProposed(pendingAddressesCounter, 0);

        pendingAddressesCounter++;
    }

    //externally called settle function will call this when price is settled
    function priceSettled(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        int256 price
    ) external
    {   
        require(msg.sender == address(oracle), "only oracle can call this function");
        bytes memory requestData = bytes.concat(ancillaryData, abi.encodePacked(timestamp));

        //handle single requests
        SingleRequest memory request = singleRequests[requestData];

        if(request.pendingAddress != address(0)) {
            //if proposed price was successfully disputed return
            if(request.proposedPrice != price) {
                emit SinglePriceSettled(request.pendingAddress, price);
                return;
            }
            if(price == 0) {
                listMapping[request.pendingAddress] = false;
                removeIndex(getIndex(request.pendingAddress));
                if(removeReward > 0) {
                    WETH.transfer(request.proposer, removeReward);
                }
            } else {
                if(price == 1e18) {
                    listMapping[request.pendingAddress] = true;
                    listArray.push(request.pendingAddress);
                    if(addReward > 0) {
                        WETH.transfer(request.proposer, addReward);
                    }
                }
            }
            emit SinglePriceSettled(request.pendingAddress, price);
            return;
        } else {
            //handle multiple requests
            MultipleRequest memory multipleRequest = multipleRequests[requestData];
            if(multipleRequest.pendingAddressesKey != 0) {
                //if proposed price was successfully disputed return
                if(multipleRequest.proposedPrice != price) {
                    emit MultiplePriceSettled(multipleRequest.pendingAddressesKey, price);
                    return;
                }
                if(price == 0) {
                    for(uint i = 0; i <= pendingAddresses[multipleRequest.pendingAddressesKey].length - 1; i++) {
                        address _address = pendingAddresses[multipleRequest.pendingAddressesKey][i];
                        listMapping[_address] = false;
                        removeIndex(getIndex(_address));
                    }
                    if(removeReward > 0){
                        WETH.transfer(multipleRequest.proposer, removeReward * pendingAddresses[multipleRequest.pendingAddressesKey].length);
                    }
                    emit MultiplePriceSettled(multipleRequest.pendingAddressesKey, 0);
                    return;
                }
                if(price == 1e18) {
                    for(uint i = 0; i <= pendingAddresses[multipleRequest.pendingAddressesKey].length - 1; i++) {
                        address _address = pendingAddresses[multipleRequest.pendingAddressesKey][i];
                        listMapping[_address] = true;
                        listArray.push(_address);
                    }
                    if(addReward > 0) {
                        WETH.transfer(multipleRequest.proposer, addReward * pendingAddresses[multipleRequest.pendingAddressesKey].length);
                    }
                    emit MultiplePriceSettled(multipleRequest.pendingAddressesKey, 1e18);
                    return;
                }
            }
            emit MultiplePriceSettled(multipleRequest.pendingAddressesKey, price);
            return;
        }
    }

    function getListArray() public view returns(address[] memory) {
        return listArray;
    }

    function getPendingAddressesArray(uint pendingAddressesKey) public view returns(address[] memory) {
        return pendingAddresses[pendingAddressesKey];
    }

    function getListLength() public view returns(uint) {
        return listArray.length;
    }

    function getIndex(address _address) internal view returns (uint i) {
        for(i = 0; i < listArray.length - 1; i++) {
            if(listArray[i] == _address) {
                return i;
            }
        }
    }
    function removeIndex(uint _index) internal {
        for (uint i = _index; i < listArray.length - 1; i++) {
            listArray[i] = listArray[i + 1];
        }
        listArray.pop();
    }
    function requestPriceFlow(uint _currentRequestTime, bytes memory _ancillaryDataFull) internal {
        oracle.requestPrice(priceId, _currentRequestTime, _ancillaryDataFull, WETH, 0);
        oracle.setCallbacks(priceId, _currentRequestTime, _ancillaryDataFull, false, false, true);
        oracle.setCustomLiveness(priceId, _currentRequestTime, _ancillaryDataFull, livenessPeriod);
        oracle.setBond(priceId, _currentRequestTime, _ancillaryDataFull, bondAmount);
    }

    //for formatting ancillary data. from: https://stackoverflow.com/a/65707309 
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
    }
    return string(s);
}
    //for formatting ancillary data. from: https://stackoverflow.com/a/65707309 
    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    //for formatting ancillary data. from: https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/common/implementation/AncillaryData.sol
    function toUtf8BytesUint(uint256 x) internal pure returns (bytes memory) {
        if (x == 0) {
            return "0";
        }
        uint256 j = x;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (x != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(x - (x / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            x /= 10;
        }
        return bstr;
    }
}