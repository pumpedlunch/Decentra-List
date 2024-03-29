require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "goerli",
  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_URL,
        blockNumber: 16521526
      }
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    optimism: {
      url: process.env.OPTIMISM_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    polygon: {
      url: process.env.POLYGON_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    mumbai: {
      url: process.env.MUMBAI_URL,
      accounts: [process.env.PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey:  process.env.OPTIMISM_ETHERSCAN_API_KEY // process.env.ETHERSCAN_API_KEY //, process.env.POLYGONSCAN_API_KEY 
  },
  paths: {
    artifacts: "./src/artifacts",
  },
};