"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QuestionEditor from "@/components/QuestionEditor";
import CandidateListEditor from "@/components/CandidateListEditor";

interface QuestionRecord {
  id: string;
  prompt: string;
  question_type: string;
  points: number;
}

interface CandidateRecord {
  id: string;
  full_name: string;
  email: string;
}

interface SubmissionRecord {
  id: string;
  candidate_id: string;
  answers: Record<string, string> | null;
  final_submission_hash: string | null;
  status: string | null;
  result_status: string | null;
  objective_score: number | null;
  subjective_score: number | null;
  score: number | null;
  submitted_at: string | null;
  created_at: string;
}

interface BlockchainJobRecord {
  id: string;
  job_type: string;
  status: string;
  candidate_id: string | null;
  created_at: string;
}

export default function RecruiterExamDetailsPage() {
  const params = useParams();
  const rawExamId = params?.examId;
  const examId =
    typeof rawExamId === "string"
      ? rawExamId
      : Array.isArray(rawExamId)
        ? rawExamId[0]
        : "";

  const isValidExamId =
    !!examId && examId !== "undefined" && examId !== "null";

  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [jobs, setJobs] = useState<BlockchainJobRecord[]>([]);
  const [message, setMessage] = useState("");
  const [candidateExamLink, setCandidateExamLink] = useState("");

  useEffect(() => {
    if (isValidExamId && typeof window !== "undefined") {
      setCandidateExamLink(`${window.location.origin}/candidate/${examId}`);
    } else {
      setCandidateExamLink("");
    }
  }, [examId, isValidExamId]);

  async function loadData() {
    if (!isValidExamId) {
      setMessage("Invalid exam ID. Please create a new exam again.");
      return;
    }

    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .select("id, prompt, question_type, points")
      .eq("exam_id", examId)
      .order("created_at", { ascending: true });

    if (questionError) {
      setMessage(questionError.message);
      return;
    }

    const { data: candidateData, error: candidateError } = await supabase
      .from("candidates")
      .select("id, full_name, email")
      .eq("exam_id", examId)
      .order("created_at", { ascending: true });

    if (candidateError) {
      setMessage(candidateError.message);
      return;
    }

    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select(
        "id, candidate_id, answers, final_submission_hash, status, result_status, objective_score, subjective_score, score, submitted_at, created_at"
      )
      .eq("exam_id", examId)
      .order("created_at", { ascending: false });

    if (submissionError) {
      setMessage(submissionError.message);
      return;
    }

    const { data: jobData, error: jobError } = await supabase
      .from("blockchain_jobs")
      .select("id, job_type, status, candidate_id, created_at")
      .eq("exam_id", examId)
      .order("created_at", { ascending: false });

    if (jobError) {
      setMessage(jobError.message);
      return;
    }

    setQuestions(questionData || []);
    setCandidates(candidateData || []);
    setSubmissions((submissionData as SubmissionRecord[]) || []);
    setJobs(jobData || []);
  }

  useEffect(() => {
    if (isValidExamId) {
      loadData();
    } else {
      setMessage("Invalid exam ID. Please create a new exam again.");
    }
  }, [examId, isValidExamId]);

  async function handleAddQuestion(question: {
    prompt: string;
    questionType: string;
    points: number;
    options?: string[];
    rubric?: string;
    correctAnswer?: string;
  }) {
    if (!isValidExamId) {
      setMessage("Cannot add question because the exam ID is invalid.");
      return;
    }

    const { error } = await supabase.from("questions").insert({
      exam_id: examId,
      prompt: question.prompt,
      question_type: question.questionType,
      points: question.points,
      options: question.options || null,
      rubric: question.rubric || null,
      correct_answer: question.correctAnswer || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Question added successfully.");
    loadData();
  }

  async function handleAddCandidate(candidate: {
    fullName: string;
    email: string;
  }) {
    if (!isValidExamId) {
      setMessage("Cannot add candidate because the exam ID is invalid.");
      return;
    }

    const { error } = await supabase.from("candidates").insert({
      exam_id: examId,
      full_name: candidate.fullName,
      email: candidate.email.trim().toLowerCase(),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Candidate added successfully.");
    loadData();
  }

  async function copyCandidateLink() {
    if (!candidateExamLink) {
      setMessage("No valid candidate link is available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(candidateExamLink);
      setMessage("Candidate exam link copied.");
    } catch {
      setMessage("Could not copy the candidate link.");
    }
  }

  function getCandidateName(candidateId: string) {
    return (
      candidates.find((candidate) => candidate.id === candidateId)?.full_name ||
      candidateId
    );
  }

  function getStatusBadgeColor(status: string | null) {
    if (
      status === "completed" ||
      status === "finalized" ||
      status === "submitted"
    ) {
      return "bg-green-100 text-green-700";
    }
    if (status === "processing" || status === "pending") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "failed") {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Recruiter exam builder
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Exam details
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[#7f6a5a]">
              Manage questions, invited candidates, submissions, and finalized results.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/recruiter/create-exam"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Create exam
            </Link>
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

        <div className="mb-8 rounded-[28px] border border-[#e7dcd1] bg-white p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
            Candidate exam link
          </div>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="break-all rounded-[18px] bg-[#fffaf4] px-4 py-3 text-sm text-[#7f6a5a]">
              {candidateExamLink || "No valid exam link available yet."}
            </div>
            <button
              onClick={copyCandidateLink}
              disabled={!isValidExamId}
              className="w-fit rounded-full bg-[#4a3124] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              Copy link
            </button>
          </div>
        </div>

        {!isValidExamId ? (
          <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6 text-[#7f6a5a]">
            This page was opened without a valid exam ID. Go back to{" "}
            <Link href="/recruiter/create-exam" className="underline">
              Create exam
            </Link>{" "}
            and generate a new exam.
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <QuestionEditor onAddQuestion={handleAddQuestion} />
              <CandidateListEditor onAddCandidate={handleAddCandidate} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Saved questions
                </div>
                <div className="mt-5 space-y-4">
                  {questions.length === 0 ? (
                    <div className="text-sm text-[#7f6a5a]">No questions added yet.</div>
                  ) : (
                    questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                      >
                        <div className="text-xs uppercase tracking-[0.2em] text-[#7f6a5a]">
                          Question {index + 1}
                        </div>
                        <div className="mt-2 text-lg font-medium">{question.prompt}</div>
                        <div className="mt-2 text-sm text-[#7f6a5a]">
                          Type: {question.question_type} · Points: {question.points}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Invited candidates
                </div>
                <div className="mt-5 space-y-4">
                  {candidates.length === 0 ? (
                    <div className="text-sm text-[#7f6a5a]">No candidates added yet.</div>
                  ) : (
                    candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                      >
                        <div className="text-lg font-medium">{candidate.full_name}</div>
                        <div className="mt-1 text-sm text-[#7f6a5a]">{candidate.email}</div>
                        <div className="mt-2 text-xs text-[#7f6a5a]">
                          Candidate ID: {candidate.id}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Candidate submissions and answers
                </div>
                <div className="mt-5 space-y-4">
                  {submissions.length === 0 ? (
                    <div className="text-sm text-[#7f6a5a]">No submissions yet.</div>
                  ) : (
                    submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-lg font-medium">
                            {getCandidateName(submission.candidate_id)}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                              submission.status
                            )}`}
                          >
                            {submission.status || "unknown"}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-[#7f6a5a]">
                          Submitted: {submission.submitted_at || submission.created_at}
                        </div>

                        <div className="mt-2 text-sm text-[#7f6a5a]">
                          Result status: {submission.result_status || "pending"}
                        </div>

                        <div className="mt-2 text-sm text-[#7f6a5a] break-all">
                          Submission hash: {submission.final_submission_hash || "-"}
                        </div>

                        <div className="mt-4 rounded-[18px] border border-[#e7dcd1] bg-white p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                            Submitted answers
                          </div>

                          {!submission.answers ||
                          Object.keys(submission.answers).length === 0 ? (
                            <div className="mt-3 text-sm text-[#7f6a5a]">
                              No answers recorded.
                            </div>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {Object.entries(submission.answers).map(([questionId, answer]) => (
                                <div
                                  key={questionId}
                                  className="rounded-[16px] border border-[#e7dcd1] bg-[#fffaf4] p-3"
                                >
                                  <div className="text-xs uppercase tracking-[0.16em] text-[#7f6a5a]">
                                    Question ID
                                  </div>
                                  <div className="mt-1 break-all text-sm">{questionId}</div>

                                  <div className="mt-3 text-xs uppercase tracking-[0.16em] text-[#7f6a5a]">
                                    Answer
                                  </div>
                                  <div className="mt-1 whitespace-pre-wrap text-sm">
                                    {answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <a
                            href={`/admin/finalize?examId=${examId}&candidateId=${submission.candidate_id}`}
                            className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white"
                          >
                            Finalize score
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                    Finalized results
                  </div>
                  <div className="mt-5 space-y-4">
                    {submissions.length === 0 ? (
                      <div className="text-sm text-[#7f6a5a]">No finalized results yet.</div>
                    ) : (
                      submissions.map((submission) => (
                        <div
                          key={`${submission.id}-result`}
                          className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-lg font-medium">
                              {getCandidateName(submission.candidate_id)}
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                                submission.result_status
                              )}`}
                            >
                              {submission.result_status || "pending"}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="rounded-[16px] border border-[#e7dcd1] bg-white p-3">
                              <div className="text-xs uppercase tracking-[0.16em] text-[#7f6a5a]">
                                Objective
                              </div>
                              <div className="mt-2 text-2xl font-semibold">
                                {submission.objective_score ?? "-"}
                              </div>
                            </div>

                            <div className="rounded-[16px] border border-[#e7dcd1] bg-white p-3">
                              <div className="text-xs uppercase tracking-[0.16em] text-[#7f6a5a]">
                                Subjective
                              </div>
                              <div className="mt-2 text-2xl font-semibold">
                                {submission.subjective_score ?? "-"}
                              </div>
                            </div>

                            <div className="rounded-[16px] border border-[#e7dcd1] bg-white p-3">
                              <div className="text-xs uppercase tracking-[0.16em] text-[#7f6a5a]">
                                Total
                              </div>
                              <div className="mt-2 text-2xl font-semibold">
                                {submission.score ?? "-"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                    Blockchain jobs
                  </div>
                  <div className="mt-5 space-y-4">
                    {jobs.length === 0 ? (
                      <div className="text-sm text-[#7f6a5a]">No blockchain jobs yet.</div>
                    ) : (
                      jobs.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-lg font-medium">{job.job_type}</div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                                job.status
                              )}`}
                            >
                              {job.status}
                            </span>
                          </div>

                          <div className="mt-2 text-sm text-[#7f6a5a]">
                            Candidate ID: {job.candidate_id || "-"}
                          </div>
                          <div className="mt-2 text-sm text-[#7f6a5a]">
                            Created: {new Date(job.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}