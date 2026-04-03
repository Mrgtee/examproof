import "dotenv/config";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

type BlockchainJob = {
  id: string;
  job_type: "register_exam" | "commit_submission" | "finalize_score";
  exam_id: string | null;
  candidate_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  retries: number;
};

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const privateKey = process.env.GENLAYER_PRIVATE_KEY!;
const contractAddress = process.env.GENLAYER_CONTRACT_ADDRESS! as `0x${string}`;

if (!supabaseUrl || !supabaseServiceRoleKey || !contractAddress) {
  throw new Error("Missing required worker environment variables.");
}

if (!privateKey) {
  throw new Error("Missing GENLAYER_PRIVATE_KEY. Export it in the terminal before running the worker.");
}

const supabase = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);

const account = createAccount(privateKey as `0x${string}`);

const client = createClient({
  chain: studionet,
  account,
});

async function updateJob(
  jobId: string,
  values: Record<string, unknown>
) {
  const { error } = await supabase
    .from("blockchain_jobs")
    .update(values)
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to update job ${jobId}: ${error.message}`);
  }
}

async function processRegisterExam(job: BlockchainJob) {
  const payload = job.payload as {
    examId: string;
    metadataHash: string;
    startTime: string;
    endTime: string;
  };

  const txHash = await client.writeContract({
    address: contractAddress,
    functionName: "create_exam",
    args: [
      payload.examId,
      payload.metadataHash,
      payload.startTime,
      payload.endTime,
    ],
    value: BigInt(0),
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
  });

  await updateJob(job.id, {
    status: "completed",
    tx_hash: txHash,
    contract_address: contractAddress,
    result: receipt,
    updated_at: new Date().toISOString(),
  });

  console.log(`Completed register_exam job: ${job.id}`);
}

async function processCommitSubmission(job: BlockchainJob) {
  const payload = job.payload as {
    examId: string;
    candidateId: string;
    submissionHash: string;
  };

  const txHash = await client.writeContract({
    address: contractAddress,
    functionName: "commit_submission",
    args: [
      payload.examId,
      payload.candidateId,
      payload.submissionHash,
    ],
    value: BigInt(0),
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
  });

  await updateJob(job.id, {
    status: "completed",
    tx_hash: txHash,
    contract_address: contractAddress,
    result: receipt,
    updated_at: new Date().toISOString(),
  });

  console.log(`Completed commit_submission job: ${job.id}`);
}

async function processFinalizeScore(job: BlockchainJob) {
  const payload = job.payload as {
    examId: string;
    candidateId: string;
    objectiveScore: number | string;
    subjectiveScore: number | string;
    totalScore: number | string;
  };

  const txHash = await client.writeContract({
    address: contractAddress,
    functionName: "finalize_score",
    args: [
      payload.examId,
      payload.candidateId,
      String(payload.objectiveScore),
      String(payload.subjectiveScore),
      String(payload.totalScore),
    ],
    value: BigInt(0),
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
  });

  await updateJob(job.id, {
    status: "completed",
    tx_hash: txHash,
    contract_address: contractAddress,
    result: receipt,
    updated_at: new Date().toISOString(),
  });

  console.log(`Completed finalize_score job: ${job.id}`);
}

async function processJob(job: BlockchainJob) {
  await updateJob(job.id, {
    status: "processing",
    updated_at: new Date().toISOString(),
  });

  try {
    if (job.job_type === "register_exam") {
      await processRegisterExam(job);
      return;
    }

    if (job.job_type === "commit_submission") {
      await processCommitSubmission(job);
      return;
    }

    if (job.job_type === "finalize_score") {
      await processFinalizeScore(job);
      return;
    }

    throw new Error(`Unknown job type: ${job.job_type}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown worker error";

    await updateJob(job.id, {
      status: "failed",
      error: message,
      retries: (job.retries || 0) + 1,
      updated_at: new Date().toISOString(),
    });

    console.error(`Failed job ${job.id}:`, message);
  }
}

async function main() {
  const { data, error } = await supabase
    .from("blockchain_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch pending jobs: ${error.message}`);
  }

  const jobs = (data || []) as BlockchainJob[];

  if (jobs.length === 0) {
    console.log("No pending blockchain jobs found.");
    return;
  }

  for (const job of jobs) {
    console.log(`Processing job ${job.id} (${job.job_type})`);
    await processJob(job);
  }
}

main().catch((error) => {
  console.error("Worker fatal error:", error);
  process.exit(1);
});