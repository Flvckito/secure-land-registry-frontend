import { ethers } from "ethers";
import { abi } from "./abi";
import { contractAddress } from "./contract";

let contract: any;

export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  contract = new ethers.Contract(contractAddress, abi, signer);

  return signer;
};

export const getContract = () => {
  if (!contract) throw new Error("Wallet not connected");
  return contract;
};