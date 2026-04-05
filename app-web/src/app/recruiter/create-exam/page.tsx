"use client";

import { useMemo, useState } from "react";
import RecruiterWalletConnect from "@/components/RecruiterWalletConnect";
import {
  deployExamContract,
  type HexAddress,
} from "@/lib/genlayer";

function makeExamId() {
  return `EXAM-${Date.now()}`;
}

function toIsoUtcFromDatetimeLocal(value: string) {
  if (!value) return "";
  return new Date(value).toISOString();
}

export default function CreateExamPage() {
  const [wallet, setWallet] = useState<HexAddress | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submissionFeePerCandidate, setSubmissionFeePerCandidate] = useState("1");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !!wallet && !!title && !!startTime && !!endTime;
  }, [wallet, title, startTime, endTime]);

  async function handleCreateExam() {
    if (!wallet) {
      setResponse("Connect a recruiter wallet first.");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const examId = makeExamId();

      const deployment = await deployExamContract({
        recruiter: wallet,
        examId,
        title: title.trim(),
        description: description.trim(),
        startTime: toIsoUtcFromDatetimeLocal(startTime),
        endTime: toIsoUtcFromDatetimeLocal(endTime),
        submissionFeePerCandidate: Number(submissionFeePerCandidate || "1"),
      });

      setResponse(
        `Exam contract deployed successfully. Contract address: ${deployment.contractAddress}`
      );

      window.location.href = `/recruiter/exams/${deployment.contractAddress}`;
    console.error("Deploy exam failed:", error);
      setResponse(
        error instanceof Error
           ? `Failed to deploy exam contract: ${error.message}`
           : "Failed to deploy exam contract."
          );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
            Recruiter workspace
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Create assessment
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#7f6a5a]">
            Deploy a new ExamProofIC contract from the recruiter wallet. This wallet
            becomes the exam owner and pays gas for exam management actions.
          </p>
        </div>

        <div className="grid gap-6">
          <RecruiterWalletConnect onConnected={setWallet} />

          <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6">
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Assessment title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                  placeholder="Grant Screening Test 2026"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[140px] w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                  placeholder="Write a short description of the exam..."
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Start time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">End time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sponsored submission fee per candidate
                </label>
                <input
                  type="number"
                  min="1"
                  value={submissionFeePerCandidate}
                  onChange={(e) => setSubmissionFeePerCandidate(e.target.value)}
                  className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                />
              </div>

              <button
                onClick={handleCreateExam}
                disabled={!canSubmit || loading}
                className="mt-3 w-fit rounded-full bg-[#4a3124] px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Deploying..." : "Deploy exam contract"}
              </button>
            </div>
          </div>

          {response && (
            <div className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a]">
              {response}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}