---
description: Description and walkthrough for creating a new List
---

# Create a New List

1. Select your desired Ethereum network in the top right corner and connect your wallet
2. Hit the Create List Button in the top right corner
3. Fill in the following fields:
   * Title: a short descriptive title for the List. ie. XYZ Hackers
   * List Criteria: detailed criteria describing what addresses should be included in the List. The List Criteria will be passed to the UMA Optimistic Oracle on every proposed revision so the Oracle participants can verify the proposed addresses for addition or removal.\
     Note: The criteria should be publicly verifiable for all addresses so Oracle participants can verify addition or removal of any proposed addresses.
   * Token Address: the smart contract address of the token that will be used for Oracle bonds and any optional List rewards. All tokens on the UMA Optimistic Oracle whitelist for a given network are accepted.\
     Note: See UMA token whitelists here: [Mainnet ](https://docs.umaproject.org/resources/approved-collateral-types)| [Goerli](https://goerli.etherscan.io/address/0x63fDfF29EBBcf1a958032d1E64F7627c3C98A059#readContract#F1)
   * Owner Address: the address of the List owner. Owner’s have the ability to revise the Bond, Addition Reward, Removal Reward and Liveness period, are expected to fund the List contract to pay out rewards and are the only party able to remove funds from the List contract. The Owner may not change the List criteria and has no special privileges to add or remove addresses from the List. \
     Note: If it is desired to make the List a public good where multiple parties contribute funds to the contract for paying rewards and no party should be able to remove funds, ownership can be renounced anytime after creating the List.
   * Bond: When addresses are proposed to be added or removed from the List, the proposer must deposit a Total Bond to the Oracle. The Total Bond is UMA’s fixed Final Fee for a given token plus this Bond. decentraList requires that the Bond amount must be greater or equal than the Final Fee.\
     Note: The Total Bond is lost if the Oracle finds that the proposed addition or removal of addresses was incorrect, but fully refundable otherwise.\
     Note: Setting a higher Bond increases security by increasing the incentives Oracle disputer’s have to find incorrect proposals. However, higher bonds also increase the risk and capital requirements for List revision proposers.
   * Addition Reward (optional): the amount paid from the List contract to the proposer per address (not transaction) successfully added the List.\
     Note: The number of addresses added to the List is calculated when an Oracle verified revision is executed on the List smart contract.\
     Note: Paying a higher Addition Reward incentivizes anyone to propose additions to the List.
   * Removal Reward (optional): the amount paid from the List contract to the proposer per address (not transaction) successfully removed from the List.\
     Note: The number of addresses removed from the List is calculated when an Oracle verified proposal is executed on the List smart contract.\
     Note: Paying a higher Removal Reward incentivizes anyone to propose removals to the list.
   * Liveness Period: the time the proposed changes to the List will stay open on the Oracle for disputes. The minimum Liveness Period varies by network (1 sec for Goerli, 8 hours for Mainnet).\
     Note: Longer Liveness Period’s gives better assurance that the proposals are thoroughly checked, but also increases the response time from a correct proposed revision to execution on the List.
4. Click Submit and sign the transaction in your wallet.
