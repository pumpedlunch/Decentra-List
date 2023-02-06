---
description: Description of functions only available to the List owner
---

# Owner Only Functions

Below is a list of functions only available to the Owner of a List. These functions are currently not supported on the decentraList dapp, but can be called from the Etherscan Contract > Write Contract page.

* setBond: revises the Bond that is added to the UMA Final Fee to calculate the Total Bond required for anyone to propose a revision to the List
* setLiveness: revises the Liveness time period for which a proposed revision can be reviewed and disputed
* setRewards: revises both the Addition and Removal Reward that is given to a successful proposer for every address added or removed.
* transferOwnership: transfers ownership of the List to another address
* renounceOwnership: transfers ownership to the zero address, effectively making the contract un-ownable
* withdraw: withdraws the entered amount of the List token
* rescue: allows withdrawal of any ERC-20 token that may have been accidentally sent to the List  contract
