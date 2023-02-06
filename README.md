---
description: decentraList overview
---

# Overview

decentraList is a platform for creating customizable, decentrally decided, updating on-chain Lists of Ethereum addresses for reference in other smart contracts.

**Properties:**

**Customizable -** You write the List Criteria for what addresses should be on or off your List. The criteria can be based on any publicly verifiable information that pertains to an Ethereum address (ie. wallet history, smart contract code, activity on L2s, gas fees burned).

**Decentrally Decided -** All proposed additions and removals to the list are verified as per the list criteria by [UMA’s Optimistic Oracle](https://docs.umaproject.org/), not a centralized, trusted party.

**Updating -** The List is referenceable by other smart contracts upon creation and can be revised as per the List Criteria into the future while staying referenceable. There are optional rewards that can be set for successfully adding and/or removing addresses from the List, incentivizing anyone to keep the list current.

**On-chain -** the List of addresses is stored on a smart contract as a mapping for easy, low gas referencing by other smart contracts. The entire List of addresses can be viewed on decentra-list.xyz or trustlessly built by querying events.
