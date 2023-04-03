import { ethers } from "ethers";
const FACTORY_ABI =
  require("../../artifacts/contracts/DecentralistProxyFactory.sol/DecentralistProxyFactory.json").abi;
const DECENTRALIST_ABI =
  require("../../artifacts/contracts/Decentralist.sol/Decentralist.json").abi;
import { CHAINS } from "../../utils/constants";

export default async function getLists(req, res) {
  const network = req.body.network;
  const provider = new ethers.providers.JsonRpcProvider(CHAINS[network].API_URL);

  const factoryContract = new ethers.Contract(
    CHAINS[network].factoryAddress,
    FACTORY_ABI,
    provider
  );
  const proxyAddresses = await factoryContract.getAllClones();

  let proxyTitles = proxyAddresses.map((address) => {
    const proxyContract = new ethers.Contract(
      address,
      DECENTRALIST_ABI,
      provider
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
