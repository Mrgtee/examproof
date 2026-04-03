"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FinalizePage() {
  const searchParams = useSearchParams();

  const [examId, setExamId] = useState(searchParams.get("examId") || "");
  const [candidateId, setCandidateId] = useState(searchParams.get("candidateId") || "");
  const [objectiveScore, setObjectiveScore] = useState("40");
  const [subjectiveScore, setSubjectiveScore] = useState("35");
  const [totalScore, setTotalScore] = useState("75");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const total =
      Number(objectiveScore || 0) + Number(subjectiveScore || 0);
    setTotalScore(String(total));
  }, [objectiveScore, subjectiveScore]);

  async function handleFinalize() {
    setMessage("");

    const queueRes = await fetch("/api/blockchain-jobs/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobType: "finalize_score",
        examId,
        candidateId,
        payload: {
          examId,
          candidateId,
          objectiveScore: Number(objectiveScore),
          subjectiveScore: Number(subjectiveScore),
          totalScore: Number(totalScore),
        },
      }),
    });

    const queueData = await queueRes.json();

    if (!queueRes.ok) {
      setMessage(queueData.error || "Failed to queue finalize job.");
      return;
    }

    const { error } = await supabase
      .from("submissions")
      .update({
        objective_score: Number(objectiveScore),
        subjective_score: Number(subjectiveScore),
        score: Number(totalScore),
        result_status: "queued_for_finalization",
      })
      .eq("exam_id", examId)
      .eq("candidate_id", candidateId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Finalize job queued successfully.");
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
          Admin scoring
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Finalize score on GenLayer
        </h1>

        <div className="mt-8 grid gap-4">
          <input
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Exam ID"
          />
          <input
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Candidate ID"
          />
          <input
            value={objectiveScore}
            onChange={(e) => setObjectiveScore(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Objective score"
          />
          <input
            value={subjectiveScore}
            onChange={(e) => setSubjectiveScore(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Subjective score"
          />
          <input
            value={totalScore}
            readOnly
            className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] px-4 py-3 outline-none"
            placeholder="Total score"
          />

          <button
            onClick={handleFinalize}
            className="mt-2 w-fit rounded-full bg-[#4a3124] px-6 py-3 text-white"
          >
            Queue finalize score
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