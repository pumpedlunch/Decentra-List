---
description: Description and walkthrough for Executing Approved Revisions
---

# Execute Approved Revisions

Once the Oracle settles a price on a proposed revision, the revision will be marked on the List smart contract as Approved. The executeRevision function must be called on the List contract to pay out any rewards and add the addresses to the List. Any address can call this function. In the future decentraList plans to run a bot listening for approved revisions that immediately executes them.

To execute an Approved Revision:

1. Navigate to the [dapp](https://decentralist-alpha.vercel.app/), select the network of the Price Request and connect your wallet.
2. Open the Approved Revisions drop down, hit the Execute button for the revision to execute and approve the transaction in your wallet.
