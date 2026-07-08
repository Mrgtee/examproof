import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, type DecodedDeployData } from "genlayer-js/types";

type HexAddress = `0x${string}`;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

function asHex(value: string, name: string): HexAddress {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`${name} must be a 0x-prefixed hex value.`);
  }
  return value as HexAddress;
}

function asPrivateKey(value: string): HexAddress {
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("GENLAYER_PRIVATE_KEY must be a 32-byte hex private key.");
  }
  return normalized as HexAddress;
}

function receiptRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getReceiptError(receipt: unknown) {
  const outer = receiptRecord(receipt);
  const data = receiptRecord(outer?.data);
  const decoded = receiptRecord(outer?.txDataDecoded);

  return (
    data?.stderr ||
    data?.error ||
    data?.message ||
    decoded?.stderr ||
    decoded?.error ||
    null
  );
}

function getContractAddress(receipt: unknown): HexAddress | null {
  const outer = receiptRecord(receipt);
  const data = receiptRecord(outer?.data);
  const fromData = data?.contract_address;
  if (typeof fromData === "string" && fromData.startsWith("0x")) {
    return fromData as HexAddress;
  }

  const decoded = outer?.txDataDecoded as DecodedDeployData | undefined;
  const fromDecoded = decoded?.contractAddress;
  if (typeof fromDecoded === "string" && fromDecoded.startsWith("0x")) {
    return fromDecoded as HexAddress;
  }

  return null;
}

async function main() {
  const privateKey = asPrivateKey(requiredEnv("GENLAYER_PRIVATE_KEY"));
  const relayer = asHex(
    optionalEnv(
      "EXAMPROOF_RELAYER_ADDRESS",
      process.env.NEXT_PUBLIC_EXAMPROOF_RELAYER_ADDRESS ||
        "0xd4face4a3600149f41c342ef0f8740f61047ecce"
    ),
    "EXAMPROOF_RELAYER_ADDRESS"
  );

  const examId = optionalEnv("EXAMPROOF_EXAM_ID", `EXAMPROOF-AUDIT-${Date.now()}`);
  const title = optionalEnv("EXAMPROOF_EXAM_TITLE", "ExamProof Audit Verification");
  const description = optionalEnv(
    "EXAMPROOF_EXAM_DESCRIPTION",
    "Fresh ExamProofIC deployment containing the July 2026 audit fixes."
  );
  const startTime = optionalEnv("EXAMPROOF_START_TIME", "2026-07-08T00:00:00Z");
  const endTime = optionalEnv("EXAMPROOF_END_TIME", "2026-12-31T23:59:59Z");
  const submissionFee = Number(optionalEnv("EXAMPROOF_SUBMISSION_FEE", "1"));

  if (!Number.isInteger(submissionFee) || submissionFee <= 0) {
    throw new Error("EXAMPROOF_SUBMISSION_FEE must be a positive integer.");
  }

  const account = createAccount(privateKey);
  const client = createClient({ chain: studionet, account });
  const code = readFileSync("contracts/examproof_ic.py", "utf8");

  console.log("Deploying ExamProofIC to studionet...");
  console.log(`Owner: ${account.address}`);
  console.log(`Relayer: ${relayer}`);
  console.log(`Exam ID: ${examId}`);

  const txHash = await client.deployContract({
    code,
    args: [examId, title, description, startTime, endTime, relayer.toLowerCase(), submissionFee],
  });

  console.log(`Deploy tx: ${txHash}`);

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    retries: 200,
    interval: 5000,
  });

  const error = getReceiptError(receipt);
  if (error) {
    throw new Error(String(error));
  }

  const contractAddress = getContractAddress(receipt);
  if (!contractAddress) {
    console.error(JSON.stringify(receipt, null, 2));
    throw new Error("Deployment succeeded but no contract address was found in the receipt.");
  }

  const exam = await client.readContract({
    address: contractAddress,
    functionName: "get_exam",
    args: [],
  });

  const summary = {
    contractAddress,
    owner: account.address,
    relayer,
    exam_id: examId,
    title,
    status: receiptRecord(exam)?.status,
    txHash,
  };

  writeFileSync("examproof-deployment.json", `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  console.log("Wrote examproof-deployment.json");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
