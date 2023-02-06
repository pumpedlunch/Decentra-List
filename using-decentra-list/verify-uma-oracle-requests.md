---
description: Description and walkthrough for Verifying decentraList Oracle Requests
---

# Verify UMA Oracle Requests

UMA Optimistic Oracle price requests made by decentraList are handled by the Oracle the same as any other price requests. For more info on how the Oracle works, see UMA’s [docs](https://docs.umaproject.org/). See current Oracle Price Requests: [Mainnet ](https://oracle.umaproject.org/)| [Goerli](https://testnet.oracle.umaproject.org/)

The ancillary data for decentraList price requests will include List Criteria specific to the List. The Proposed Addresses for the price request can easily be found as per the steps below:

1. Navigate to the [dapp](https://decentralist-alpha.vercel.app/), select the network of the Price Request and connect your wallet.
2. Select the List address from the top drop down to display information about that List. The List address can be found in the requester field of the oracle Price Request.
3. Open the Pending Revisions drop down and find the proposed addresses for the Revision ID provided in the oracle Price Request Ancillary Data.

Alternatively, the Proposed Addresses can also be found on the blockchain using a block explorer or node provider in the proposedAddresses parameter of the RevisionProposed event emitted by the requester's address with Revision ID matching the ancillary data.
