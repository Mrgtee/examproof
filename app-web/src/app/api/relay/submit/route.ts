import { NextResponse } from "next/server";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import { privateKeyToAccount } from "viem/accounts";

type HexAddress = `0x${string}`;

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getReceiptError(receipt: any): string {
  return (
    receipt?.data?.stderr ||
    receipt?.data?.error ||
    receipt?.data?.message ||
    receipt?.txDataDecoded?.stderr ||
    receipt?.txDataDecoded?.error ||
    receipt?.txExecutionResultName ||
    "Gasless submission execution failed."
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifySubmissionExists(
  client: ReturnType<typeof createClient>,
  examAddress: HexAddress,
  candidateId: string
) {
  try {
    const result = await client.readContract({
      address: examAddress,
      functionName: "get_result",
      args: [candidateId],
      stateStatus: "accepted",
    });

    if (result && typeof result === "object") {
      return result;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const examAddress = body.examAddress as HexAddress | undefined;
    const candidateId = body.candidateId as string | undefined;
    const candidateToken = body.candidateToken as string | undefined;
    const answersJson = body.answersJson as string | undefined;
    const submittedAt = body.submittedAt as string | undefined;

    if (!examAddress || !candidateId || !candidateToken || !answersJson || !submittedAt) {
      return NextResponse.json(
        { error: "Missing required submission fields." },
        { status: 400 }
      );
    }

    const relayerPrivateKey = getEnv("EXAMPROOF_RELAYER_PRIVATE_KEY") as HexAddress;
    const relayerAccount = privateKeyToAccount(relayerPrivateKey);

    const client = createClient({
      chain: studionet,
      account: relayerAccount,
    });

    const txHash = await client.writeContract({
      account: relayerAccount,
      address: examAddress,
      functionName: "submit_exam_gasless",
      args: [candidateId, candidateToken, answersJson, submittedAt],
      value: BigInt(0),
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      status: TransactionStatus.ACCEPTED,
      retries: 200,
      interval: 5000,
    });

    if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN) {
      return NextResponse.json({
        ok: true,
        txHash,
        resultStatus: receipt.txExecutionResultName,
      });
    }

    // Fallback: sometimes the receipt can look inconclusive even though
    // the contract state already changed. Verify directly from contract state.
    for (let i = 0; i < 3; i++) {
      const verified = await verifySubmissionExists(client, examAddress, candidateId);
      if (verified) {
        return NextResponse.json({
          ok: true,
          txHash,
          resultStatus: "VERIFIED_ONCHAIN",
          result: verified,
        });
      }

      await sleep(3000);
    }

    return NextResponse.json(
      {
        error: getReceiptError(receipt),
        txHash,
        resultStatus: receipt.txExecutionResultName,
        receipt,
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Relay submission failed.",
      },
      { status: 500 }
    );
  }
}