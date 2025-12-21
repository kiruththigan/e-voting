import { ethers } from "ethers";
import FaceRegistryAbi from "./FaceRegistryAbi.json";

//rpcurlprivatekeyandcontractaddressaretakenfromenv
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
const contractAddress = process.env.FACE_CONTRACT_ADDRESS;

type FaceRegistryAbiType = {
  abi: ethers.InterfaceAbi;
};

function getContract() {
  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error("Blockchain configuration missing");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const iface = (FaceRegistryAbi as FaceRegistryAbiType).abi;

  return new ethers.Contract(contractAddress, iface, wallet);
}

export async function storeFaceHashOnChain(userId: string, hash: string) {
  const contract = getContract();
  const tx = await contract.enrollFace(userId, hash);
  await tx.wait();
}

export async function storeVerificationOnChain(userId: string) {
  const contract = getContract();
  const tx = await contract.addVerification(userId);
  await tx.wait();
}
