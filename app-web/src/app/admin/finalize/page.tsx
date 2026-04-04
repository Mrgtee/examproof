"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function FinalizePage() {
  const [examId, setExamId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [objectiveScore, setObjectiveScore] = useState("");
  const [subjectiveScore, setSubjectiveScore] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [resultStatus, setResultStatus] = useState("finalized");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    setExamId(params.get("examId") || "");
    setCandidateId(params.get("candidateId") || "");
  }, []);

  async function handleFinalize() {
    if (!examId || !candidateId) {
      setMessage("Missing exam ID or candidate ID.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/blockchain-jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobType: "finalize_result",
          examId,
          candidateId,
          payload: {
            examId,
            candidateId,
            objectiveScore: objectiveScore ? Number(objectiveScore) : null,
            subjectiveScore: subjectiveScore ? Number(subjectiveScore) : null,
            score: totalScore ? Number(totalScore) : null,
            resultStatus,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to queue finalization.");
        return;
      }

      setMessage("Finalization job queued successfully.");
    } catch {
      setMessage("Something went wrong while queueing finalization.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Admin finalization
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Queue final result
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/exams"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              All exams
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Exam ID</label>
            <input
              value={examId}
              readOnly
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Candidate ID</label>
            <input
              value={candidateId}
              readOnly
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] px-4 py-3 outline-none"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Objective score
              </label>
              <input
                value={objectiveScore}
                onChange={(e) => setObjectiveScore(e.target.value)}
                className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                placeholder="40"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Subjective score
              </label>
              <input
                value={subjectiveScore}
                onChange={(e) => setSubjectiveScore(e.target.value)}
                className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                placeholder="35"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Total score</label>
              <input
                value={totalScore}
                onChange={(e) => setTotalScore(e.target.value)}
                className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                placeholder="75"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Result status</label>
            <select
              value={resultStatus}
              onChange={(e) => setResultStatus(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            >
              <option value="finalized">finalized</option>
              <option value="passed">passed</option>
              <option value="failed">failed</option>
              <option value="reviewed">reviewed</option>
            </select>
          </div>

          <button
            onClick={handleFinalize}
            disabled={loading}
            className="mt-3 w-fit rounded-full bg-[#4a3124] px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Queueing..." : "Queue finalization"}
          </button>

          {message && (
            <div className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a]">
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}