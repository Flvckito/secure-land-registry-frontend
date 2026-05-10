import { ethers } from "ethers";
import { abi } from "./abi.ts";
import { contractAddress } from "./contract.ts";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

import "./styles.css";

// --------------------
// Blockchain globals
// --------------------
let contract: any;
let signer: any;

// --------------------
// Connect Wallet (MetaMask)
// --------------------
export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  signer = await provider.getSigner();

  contract = new ethers.Contract(contractAddress, abi, signer);

  console.log("Wallet connected:", await signer.getAddress());
};

// --------------------
// Get contract for other pages
// --------------------
export const getContract = () => {
  if (!contract) {
    throw new Error("Wallet not connected");
  }
  return contract;
};

// --------------------
// Router
// --------------------
const router = getRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// --------------------
// Render App
// --------------------
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
