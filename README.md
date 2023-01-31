# Links

- Dapp: https://decentra-list.xyz
- Docs: https://decentra-list.gitbook.io/docs/
- Contact: https://twitter.com/DecentraListxyz

# Developer Info

- Getting Started:
    - Clone repo
    - Install dependencies: ```yarn install```
    - Fill in variables in ```.env.sample``` and rename to ```.env```
- Run local frontend: ```yarn start```
- Test smart contracts on Hardhat network: ```yarn test```
- Deploy contracts: 
    - update ```scripts/deploy.js``` variables for desired network
    - ```yarn deploy --network XXXXX```
- ```scripts/lists``` folder contains scripts for generating revisions for created lists. To run: 
```
yarn run hardhat run scripts/lists/UMAVotingAllstars.js --network mainnet
```
