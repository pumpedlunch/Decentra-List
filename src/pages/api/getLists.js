import { ethers } from "ethers";
const FACTORY_ABI =
  require("../../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json").abi;
const DECENTRALIST_ABI =
  require("../../artifacts/contracts/Decentralist.sol/Decentralist.json").abi;

const CHAINS = {
  1: {
    name: "Ethereum",
    storeAddress: "0x54f44eA3D2e7aA0ac089c4d8F7C93C27844057BF",
    factoryAddress: "0xb1E6D19DeafC045336DD766Bf345c78e771Ef7eA",
    explorerUrl: "https://etherscan.io/address/",
    API: process.env.MAINNET_URL,
    provider: new ethers.providers.JsonRpcProvider(process.env.MAINNET_URL),
  },
  137: {
    name: "Polygon",
    storeAddress: "0xE58480CA74f1A819faFd777BEDED4E2D5629943d",
    factoryAddress: "",
    explorerUrl: "https://polygonscan.com/address/",
    API: process.env.POLYGON_URL,
    provider: new ethers.providers.JsonRpcProvider(process.env.POLYGON_URL),
  },
  10: {
    name: "Optimism",
    storeAddress: "0x5be04e53b465c6fD89ECfF3d36dDf666D198e31a",
    factoryAddress: "",
    explorerUrl: "https://optimistic.etherscan.io/address/",
    API: process.env.OPTIMISM_URL,
    provider: new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_URL),
  },
  5: {
    name: "Goerli",
    storeAddress: "0x07417cA264170Fc5bD3568f93cFb956729752B61",
    factoryAddress: "0x44a68aaBDE79B9404b3e9F65a72BA657cd52F146",
    explorerUrl: "https://goerli.etherscan.io/address/",
    API: process.env.GOERLI_URL,
    provider: new ethers.providers.JsonRpcProvider(process.env.GOERLI_URL),
  },
  80001: {
    name: "Mumbai",
    storeAddress: "0xce9Cf0C8f8121b573f6212344F53BC7746846e71",
    factoryAddress: "0x1D7065cD0e05104153b4B54ad62Da41122D9Ca0a",
    explorerUrl: "https://mumbai.polygonscan.com/address/",
    API: process.env.MUMBAI_URL,
    provider: new ethers.providers.JsonRpcProvider(process.env.MUMBAI_URL),
  },
};

export default async function getLists(req, res) {
  const network = req.body.network;

  const factoryContract = new ethers.Contract(
    CHAINS[network].factoryAddress,
    FACTORY_ABI,
    CHAINS[network].provider
  );
  const proxyAddresses = await factoryContract.getAllClones();

  let proxyTitles = proxyAddresses.map((address) => {
    const proxyContract = new ethers.Contract(
      address,
      DECENTRALIST_ABI,
      CHAINS[network].provider
    );
    return proxyContract.title();
  });

  await Promise.all(proxyTitles).then((_proxyTitles) => {
    proxyTitles = _proxyTitles;
  });

  res.status(200).json({
    proxyAddresses: proxyAddresses,
    proxyTitles: proxyTitles,
  });
}
