"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  TransactionStatus,
  type DecodedDeployData,
  type GenLayerChain,
  type TransactionHash,
  type CalldataEncodable,
} from "genlayer-js/types";

declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: {
      ethereum?: any;
    };
  }
}

export type HexAddress = `0x${string}`;

type InjectedProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isOkxWallet?: boolean;
  providers?: InjectedProvider[];
};

export const RELAYER_ADDRESS =
  (process.env.NEXT_PUBLIC_EXAMPROOF_RELAYER_ADDRESS as HexAddress | undefined) ??
  ("0x0000000000000000000000000000000000000000" as HexAddress);

function getInjectedProviders(): InjectedProvider[] {
  if (typeof window === "undefined") return [];

  const found: InjectedProvider[] = [];

  const pushIfValid = (provider: any) => {
    if (
      provider &&
      typeof provider.request === "function" &&
      !found.includes(provider)
    ) {
      found.push(provider);
    }
  };

  if (window.okxwallet?.ethereum) {
    pushIfValid(window.okxwallet.ethereum);
  }

  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    for (const provider of window.ethereum.providers) {
      pushIfValid(provider);
    }
  }

  if (window.ethereum) {
    pushIfValid(window.ethereum);
  }

  return found;
}

function pickBestProvider(): InjectedProvider {
  const providers = getInjectedProviders();

  if (providers.length === 0) {
    throw new Error(
      "No injected wallet found. Install OKX Wallet, Rabby, MetaMask, or another EVM wallet."
    );
  }

  const okx = providers.find((provider) => provider.isOkxWallet);
  if (okx) return okx;

  const rabby = providers.find((provider) => provider.isRabby);
  if (rabby) return rabby;

  const metamask = providers.find((provider) => provider.isMetaMask);
  if (metamask) return metamask;

  return providers[0];
}

export function createReadClient() {
  return createClient({
    chain: studionet,
  });
}

export function createWriteClient(account: HexAddress) {
  const provider = pickBestProvider();

  return createClient({
    chain: studionet,
    account,
    provider,
  });
}

async function requestAccounts(): Promise<HexAddress> {
  const provider = pickBestProvider();

  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  const account = accounts?.[0] as HexAddress | undefined;
  if (!account) {
    throw new Error("No wallet account returned.");
  }

  return account;
}

async function ensureStudionet() {
  const provider = pickBestProvider();

  const chainIdHex = "0x" + Number(studionet.id).toString(16);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: "GenLayer Studio Network",
          nativeCurrency: {
            name: "GEN",
            symbol: "GEN",
            decimals: 18,
          },
          rpcUrls: ["https://studio.genlayer.com/api"],
          blockExplorerUrls: ["https://genlayer-explorer.vercel.app"],
        },
      ],
    });
  }
}

export function getSavedRecruiterWallet(): HexAddress | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem("examproof_recruiter_wallet");
  return (saved as HexAddress | null) ?? null;
}

export async function connectRecruiterWallet(): Promise<HexAddress> {
  const account = await requestAccounts();
  await ensureStudionet();
  window.localStorage.setItem("examproof_recruiter_wallet", account);
  return account;
}

export async function loadContractCode(path = "/contracts/examproof_ic.py") {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load contract source: ${res.status} ${res.statusText}`);
  }

  return await res.text();
}

function extractReceiptError(receipt: any): string | null {
  const txResult = receipt?.txExecutionResultName;
  const data = receipt?.data;
  const decoded = receipt?.txDataDecoded;

  const reason =
    data?.stderr ||
    data?.error ||
    data?.message ||
    decoded?.stderr ||
    decoded?.error ||
    null;

  if (reason) return String(reason);
  if (txResult && txResult !== "FINISHED_WITH_RETURN") {
    return `Execution failed: ${txResult}`;
  }
  return null;
}

export async function deployExamContract(params: {
  recruiter: HexAddress;
  examId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  relayerAddress?: HexAddress;
  submissionFeePerCandidate?: number;
}) {
  const {
    recruiter,
    examId,
    title,
    description,
    startTime,
    endTime,
    relayerAddress = RELAYER_ADDRESS,
    submissionFeePerCandidate = 1,
  } = params;

  await ensureStudionet();

  const client = createWriteClient(recruiter);
  const code = await loadContractCode();

  const txHash = (await client.deployContract({
    code,
    args: [
      examId,
      title,
      description,
      startTime,
      endTime,
      relayerAddress.toLowerCase(),
      submissionFeePerCandidate,
    ] as CalldataEncodable[],
  })) as TransactionHash;

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    retries: 200,
    interval: 5000,
  });

  const deployError = extractReceiptError(receipt);
  if (deployError) {
    throw new Error(deployError);
  }

  const contractAddress =
    (client.chain as GenLayerChain).id !== studionet.id
      ? ((receipt.txDataDecoded as DecodedDeployData | undefined)?.contractAddress as
          | HexAddress
          | undefined)
      : (receipt?.data?.contract_address as HexAddress | undefined);

  if (!contractAddress) {
    console.error("Deploy receipt:", receipt);
    throw new Error("Deployment succeeded but no contract address was found in the receipt.");
  }

  return {
    txHash,
    receipt,
    contractAddress,
  };
}

export async function contractRead<T>({
  address,
  functionName,
  args = [],
}: {
  address: HexAddress;
  functionName: string;
  args?: CalldataEncodable[];
}): Promise<T> {
  const client = createReadClient();

  const result = await client.readContract({
    address,
    functionName,
    args,
  });

  return result as T;
}

export async function contractWrite(params: {
  recruiter: HexAddress;
  address: HexAddress;
  functionName: string;
  args?: CalldataEncodable[];
}) {
  const { recruiter, address, functionName, args = [] } = params;

  await ensureStudionet();

  const writeClient = createWriteClient(recruiter);
  const readClient = createReadClient();

  const txHash = (await writeClient.writeContract({
    address,
    functionName,
    args,
    value: BigInt(0),
  })) as TransactionHash;

  const receipt = await readClient.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    retries: 200,
    interval: 5000,
  });

  const writeError = extractReceiptError(receipt);
  if (writeError) {
    throw new Error(writeError);
  }

  return { txHash, receipt };
}