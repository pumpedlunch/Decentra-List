export const CHAINS = {
    1: {
      name: "Ethereum",
      storeAddress: "0x54f44eA3D2e7aA0ac089c4d8F7C93C27844057BF",
      factoryAddress: "0xb1E6D19DeafC045336DD766Bf345c78e771Ef7eA",
      explorerUrl: "https://etherscan.io/address/",
      API_URL: process.env.MAINNET_URL,
    },
    137: {
      name: "Polygon",
      storeAddress: "0xE58480CA74f1A819faFd777BEDED4E2D5629943d",
      factoryAddress: "0x0898f96352a2ddeb86De0F357E86D8Ddc1D8b4c6",
      explorerUrl: "https://polygonscan.com/address/",
      API_URL: process.env.POLYGON_URL,
    },
    10: {
      name: "Optimism",
      storeAddress: "0x5be04e53b465c6fD89ECfF3d36dDf666D198e31a",
      factoryAddress: "0x0898f96352a2ddeb86De0F357E86D8Ddc1D8b4c6",
      explorerUrl: "https://optimistic.etherscan.io/address/",
      API_URL: process.env.OPTIMISM_URL,
    },
    5: {
      name: "Goerli",
      storeAddress: "0x07417cA264170Fc5bD3568f93cFb956729752B61",
      factoryAddress: "0x44a68aaBDE79B9404b3e9F65a72BA657cd52F146",
      explorerUrl: "https://goerli.etherscan.io/address/",
      API_URL: process.env.GOERLI_URL,
    },
    80001: {
      name: "Mumbai",
      storeAddress: "0xce9Cf0C8f8121b573f6212344F53BC7746846e71",
      factoryAddress: "0x1D7065cD0e05104153b4B54ad62Da41122D9Ca0a",
      explorerUrl: "https://mumbai.polygonscan.com/address/",
      API_URL: process.env.MUMBAI_URL,
    },
  };