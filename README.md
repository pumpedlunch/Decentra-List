# Links

- Dapp: https://decentra-list.xyz
- Docs: https://decentra-list.gitbook.io/docs/
- Contact: https://twitter.com/DecentraListxyz

# Developer Info

- Getting Started:
    - Clone repo
    - Install dependencies: ```yarn install```
    - Run ```yarn run hardhat compile``` to create contract artifacts
    - Fill in dev variables in ```.env.sample``` and rename to ```.env```
    - Fill in Next.js local variables in ```.env.local.sample``` and rename to ```.env.local```
- Run local frontend: ```yarn dev``` & open [http://localhost:3000](http://localhost:3000) with your browser 
- Test smart contracts on Hardhat network: ```yarn test```
- Deploy contracts: 
    - update ```scripts/deploy.js``` variables for desired network
    - ```yarn deploy --network XXXXX```
- ```scripts/lists``` folder contains scripts for generating revisions for created lists. To run: 
```
yarn run hardhat run scripts/lists/UMAVotingAllstars.js --network mainnet
```

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).