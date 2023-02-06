---
description: >-
  Description and walkthrough for referencing the address List in another smart
  contract
---

# Reference List from another Smart Contract

1. Download the Decentralist Interface [here](https://github.com/pumpedlunch/decentraList/blob/master/contracts/interfaces/DecentralistInterface.sol), save to your project repo and import the interface into your smart contract
2. Declare a list variable for the specific List smart contract address wrapped in the Decentralist Interface
3. Call the onList() function on the list variable with the address to lookup. This will return a bool whether the address is currently on the List.

See the below example contract which stores a vote if msg.sender is on a fictitious Voter Whitelist:

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

// 1. import DecentralistInterface
import "INSERT_PATHING/DecentralistInterface.sol"; 

contract WhiteListVote {
    // 2. declare decentralist variable. Insert the Voter Whitelist's contract address.
    DecentralistInterface public list= DecentralistInterface(INSERT_ADDRESS); 
    uint256 public yesCount;
    uint256 public noCount;

    mapping(address => bool) public hasVoted;

    function vote(bool _vote, address _address) external {
        // 3. call list.onList() to return bool whether _address is on the Voter Whitelist
        require(list.onList(_address), 
            "msg.sender must be on current voting whitelist"); 
        require(hasVoted[_address] == false, 
            "msg.sender has already voted");

        hasVoted[_address] = true;
        
        if(_vote) {
            yesCount++;
        } else {
            noCount++;
        }
    }
}
```
