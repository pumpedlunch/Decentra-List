---
description: Methodology for producing a full list of addresses from on-chain events
---

# Verify Full Address List

The addresses that are currently on a given List are stored on-chain in a mapping rather than an array to minimize the smart contract storage size and gas costs. The full List of addresses can be easily viewed on the decentraList dapp by connecting your wallet to the given network and selecting a contract from the top left dropdown.&#x20;

If you would like to reproduce the full list of addresses using on-chain data, follow the below methodology:

1. Query all RevisionExecuted events for the List smart contract
2. The events must be looped over in chronological order adding or removing all revisedAddresses in the event depending on whether the proposed value is 1E18 or 0 respectively. \
   Note: the zero address should be ignored in revisedAddresses\
   Note: addresses already on the list should not be added in duplicate
