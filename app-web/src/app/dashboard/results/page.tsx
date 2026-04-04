"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface CandidateRecord {
  id: string;
  full_name: string;
  email: string;
}

interface SubmissionRecord {
  id: string;
  candidate_id: string;
  result_status: string | null;
  objective_score: number | null;
  subjective_score: number | null;
  score: number | null;
  final_submission_hash: string | null;
  submitted_at: string | null;
  created_at: string;
}

export default function ResultsPage() {
  const [examId, setExamId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [submission, setSubmission] = useState<SubmissionRecord | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    setExamId(params.get("examId") || "");
    setCandidateId(params.get("candidateId") || "");
  }, []);

  useEffect(() => {
    async function loadResult() {
      if (!examId || !candidateId) {
        setMessage("Missing exam ID or candidate ID.");
        return;
      }

      const { data: candidateData, error: candidateError } = await supabase
        .from("candidates")
        .select("id, full_name, email")
        .eq("id", candidateId)
        .eq("exam_id", examId)
        .maybeSingle();

      if (candidateError) {
        setMessage(candidateError.message);
        return;
      }

      const { data: submissionData, error: submissionError } = await supabase
        .from("submissions")
        .select(
          "id, candidate_id, result_status, objective_score, subjective_score, score, final_submission_hash, submitted_at, created_at"
        )
        .eq("candidate_id", candidateId)
        .eq("exam_id", examId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (submissionError) {
        setMessage(submissionError.message);
        return;
      }

      setCandidate((candidateData as CandidateRecord) || null);
      setSubmission((submissionData as SubmissionRecord) || null);
    }

    if (examId && candidateId) {
      loadResult();
    }
  }, [examId, candidateId]);

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Candidate result
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Finalized score view
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

        {message && (
          <div className="mb-6 rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a]">
            {message}
          </div>
        )}

        {!submission ? (
          <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6 text-[#7f6a5a]">
            No result found yet.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                Candidate
              </div>
              <div className="mt-3 text-2xl font-semibold">
                {candidate?.full_name || submission.candidate_id}
              </div>
              <div className="mt-2 text-sm text-[#7f6a5a]">
                {candidate?.email || "-"}
              </div>
              <div className="mt-2 text-sm text-[#7f6a5a] break-all">
                Exam ID: {examId}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[#7f6a5a]">
                  Objective
                </div>
                <div className="mt-3 text-4xl font-semibold">
                  {submission.objective_score ?? "-"}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[#7f6a5a]">
                  Subjective
                </div>
                <div className="mt-3 text-4xl font-semibold">
                  {submission.subjective_score ?? "-"}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[#7f6a5a]">
                  Total score
                </div>
                <div className="mt-3 text-4xl font-semibold">
                  {submission.score ?? "-"}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6">
              <div className="text-sm text-[#7f6a5a]">
                Result status: {submission.result_status || "pending"}
              </div>
              <div className="mt-2 break-all text-sm text-[#7f6a5a]">
                Submission hash: {submission.final_submission_hash || "-"}
              </div>
              <div className="mt-2 text-sm text-[#7f6a5a]">
                Submitted: {submission.submitted_at || submission.created_at}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}