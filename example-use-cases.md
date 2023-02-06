---
description: ABC DAO Voting Whitelist & Other List Ideas
---

# Example Use Cases

## ABC DAO Voting Whitelist

ABC DAO wants to create a white list for addresses that have held their ABC NFT for more than one year and use it to gate their DAO voting:

1. ABC DAO creates a new List on Decentra-List with the following inputs:
   * Title: ABC Voting White List
   * Criteria: Addresses that currently hold an ABC NFT that they have held for over 1 year. See ABC NFT contract here: 0xABC...
2. ABC DAO creates a voting contract that requires that any address calling the vote function must be on the ABC Voting White List
3. ABC DAO or any other address can now propose address to add to or remove from the ABC Voting White List. All proposed revisions are sent to UMA's Optimistic Oracle to verify that all proposed additions meet the Criteria and all proposed removals do not meet the Criteria. For our example,&#x20;
   * ABC DAO may want to initially add all addresses that meet the Criteria.&#x20;
   * After kickstarting the list, they can let eligible addresses that want to vote add themselves to the list.
   * They incentivize anyone to watch for and propose removals by funding the ABC Voting White List to pay rewards to any address successfully proposing removals.

ABC DAO now has an easily referenceable, decentralized, evergreen voting whitelist that requires does not require DAO administrators to do anything other than keep the contract funded.

## Other List Ideas

* **On-chain Credit Rating Markers:** track past wallet activity (ie. Criteria: addresses that have paid > 10 ETH in loan interest without ever being liquidated on mainnet or other L2s) that are referenced by undercollateralized lenders for better loan terms
* **Royalty Enforcing NFT Exchange List:** Used to gate NFT transfers. This ensures that creator royalties are protected into the future and also protects NFT holders from a centralized party unfairly restricting transfers on their NFTs. This List could be a public good that becomes an industry standard referenced by multiple NFT projects.
* **AAA Rated Token List:** that parties use to restrict acceptable payment forms or DEXs use to prevent pools with scam tokens from being created. Example Criteria could be: ERC20 compatible tokens that are more than 1 year old and have had a market cap (calculated as per ...) over $10M for the last 6 months.
* **DAO Participation Rewards or Roles:** white list rewards, privileges or admin rights based on past address participation. Example Criteria: has voted in X% of DAO votes and held at least Y DAO tokens for the last Z years.
* **Protocol Integration Incentives:** a lending platform could create a Top 5 Integration Builders List based on cumulative deposits through smart contracts deployed by the builder's address. The builders could claim rewards once a month while they are on the list.
