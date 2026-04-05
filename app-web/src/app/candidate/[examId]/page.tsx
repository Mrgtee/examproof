"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { contractRead, type HexAddress } from "@/lib/genlayer";

interface ExamView {
  owner: string;
  relayer: string;
  exam_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  submission_budget: number;
  submission_fee_per_candidate: number;
  question_count: number;
  candidate_count: number;
  submission_count: number;
}

interface QuestionView {
  prompt: string;
  question_type: "mcq" | "short_answer" | "essay";
  points: number;
  options: string[];
  rubric: string;
}

export default function CandidateExamPage() {
  const params = useParams();
  const rawExamId = params?.examId;
  const examAddress =
    typeof rawExamId === "string"
      ? (rawExamId as HexAddress)
      : Array.isArray(rawExamId)
        ? (rawExamId[0] as HexAddress)
        : ("" as HexAddress);

  const [candidateId, setCandidateId] = useState("");
  const [candidateToken, setCandidateToken] = useState("");
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [exam, setExam] = useState<ExamView | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const candidateIdFromUrl = url.searchParams.get("candidateId") || "";
    const tokenFromUrl = url.searchParams.get("token") || "";

    if (candidateIdFromUrl) setCandidateId(candidateIdFromUrl);
    if (tokenFromUrl) setCandidateToken(tokenFromUrl);
  }, []);

  useEffect(() => {
    async function loadExam() {
      if (!examAddress || examAddress === ("undefined" as HexAddress)) {
        setMessage("Invalid exam contract address.");
        return;
      }

      try {
        const [examData, questionData] = await Promise.all([
          contractRead<ExamView>({
            address: examAddress,
            functionName: "get_exam",
          }),
          contractRead<QuestionView[]>({
            address: examAddress,
            functionName: "get_questions",
          }),
        ]);

        setExam(examData);
        setQuestions(questionData || []);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to load exam."
        );
      }
    }

    void loadExam();
  }, [examAddress]);

  const answerPayload = useMemo(() => {
    const mapped: Record<string, string> = {};
    questions.forEach((_, index) => {
      mapped[String(index)] = answers[String(index)] || "";
    });
    return mapped;
  }, [answers, questions]);

  function updateAnswer(questionIndex: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  }

  async function handleSaveDraft() {
    setMessage("Draft saved locally in this browser session.");
  }

  async function handleFinalSubmit() {
    if (!candidateId.trim() || !candidateToken.trim()) {
      setMessage("Candidate ID and access token are required.");
      return;
    }

    if (questions.length === 0) {
      setMessage("No questions found for this exam.");
      return;
    }

    if (exam?.status !== "open") {
      setMessage("This exam is not open for submissions yet.");
      return;
    }

    if ((exam?.submission_budget ?? 0) < (exam?.submission_fee_per_candidate ?? 1)) {
      setMessage("Submission budget is currently unavailable for this exam.");
      return;
    }

    const unanswered = questions.some((_, index) => !answers[String(index)]?.trim());
    if (unanswered) {
      setMessage("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/relay/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examAddress,
          candidateId: candidateId.trim(),
          candidateToken: candidateToken.trim(),
          answersJson: JSON.stringify(answerPayload),
          submittedAt: new Date().toISOString(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Submission failed.");
      }

      setMessage(
        `Submission successful. Tx: ${payload.txHash}${payload.resultStatus ? ` · Status: ${payload.resultStatus}` : ""}`
      );

      try {
        const refreshedExam = await contractRead<ExamView>({
          address: examAddress,
          functionName: "get_exam",
        });
        setExam(refreshedExam);
      } catch {
        // ignore refresh failure
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong during submission."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Candidate assessment
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {exam?.title || "Assessment"}
            </h1>
            <p className="mt-2 text-sm text-[#7f6a5a] break-all">
              Contract: {examAddress}
            </p>
            {exam ? (
              <p className="mt-2 text-sm text-[#7f6a5a]">
                Status: {exam.status} · Budget remaining: {exam.submission_budget}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/candidate"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Change exam
            </Link>

            <Link
              href="/"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Home
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <input
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Candidate ID"
          />
          <input
            value={candidateToken}
            onChange={(e) => setCandidateToken(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Access token"
          />
        </div>

        <div className="mt-8 space-y-6">
          {questions.length === 0 ? (
            <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6 text-[#7f6a5a]">
              No questions found for this exam yet.
            </div>
          ) : (
            questions.map((question, index) => (
              <div
                key={`${question.prompt}-${index}`}
                className="rounded-[28px] border border-[#e7dcd1] bg-white p-6"
              >
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Question {index + 1}
                </div>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
                  {question.prompt}
                </h2>

                {question.question_type === "mcq" && (
                  <div className="mt-5 space-y-3">
                    {(question.options || []).map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center gap-3 rounded-[18px] border border-[#e7dcd1] bg-[#fffaf4] px-4 py-3"
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={answers[String(index)] === option}
                          onChange={(e) =>
                            updateAnswer(String(index), e.target.value)
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.question_type === "short_answer" && (
                  <input
                    value={answers[String(index)] || ""}
                    onChange={(e) => updateAnswer(String(index), e.target.value)}
                    className="mt-5 w-full rounded-[20px] border border-[#e7dcd1] px-4 py-3 outline-none"
                    placeholder="Write your answer here..."
                  />
                )}

                {question.question_type === "essay" && (
                  <textarea
                    value={answers[String(index)] || ""}
                    onChange={(e) => updateAnswer(String(index), e.target.value)}
                    className="mt-5 min-h-[220px] w-full rounded-[20px] border border-[#e7dcd1] px-4 py-3 outline-none"
                    placeholder="Write your answer here..."
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleSaveDraft}
            className="rounded-full border border-[#e7dcd1] px-5 py-3"
          >
            Save draft
          </button>
          <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="rounded-full bg-[#4a3124] px-5 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Final submit"}
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a] break-words">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}