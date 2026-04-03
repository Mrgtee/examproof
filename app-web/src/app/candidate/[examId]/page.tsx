"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { sha256 } from "@/lib/hash";
import { supabase } from "@/lib/supabase";

interface QuestionRecord {
  id: string;
  prompt: string;
  question_type: "mcq" | "short_answer" | "essay";
  points: number;
  options: string[] | null;
}

interface CandidateRecord {
  id: string;
  full_name: string;
  email: string;
}

export default function CandidateExamPage() {
  const params = useParams();
  const examId = String(params.examId);

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      const { data, error } = await supabase
        .from("questions")
        .select("id, prompt, question_type, points, options")
        .eq("exam_id", examId)
        .order("created_at", { ascending: true });

      if (error) {
        setMessage(error.message);
        return;
      }

      setQuestions((data as QuestionRecord[]) || []);
    }

    if (examId) {
      loadQuestions();
    }
  }, [examId]);

  const answerPayload = useMemo(() => answers, [answers]);

  function updateAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  async function handleSaveDraft() {
    setMessage("Draft saved in local state for now.");
  }

  async function handleFinalSubmit() {
    if (!candidateName || !candidateEmail) {
      setMessage("Please fill your name and email before submitting.");
      return;
    }

    if (questions.length === 0) {
      setMessage("No questions found for this exam.");
      return;
    }

    const unanswered = questions.some((q) => !answers[q.id]?.trim());
    if (unanswered) {
      setMessage("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const normalizedEmail = candidateEmail.trim().toLowerCase();
      const payloadString = JSON.stringify(answerPayload);
      const submissionHash = await sha256(payloadString);

      const { data: existingCandidate, error: existingCandidateError } =
        await supabase
          .from("candidates")
          .select("id, full_name, email")
          .eq("exam_id", examId)
          .eq("email", normalizedEmail)
          .maybeSingle();

      if (existingCandidateError) {
        setMessage(existingCandidateError.message);
        setLoading(false);
        return;
      }

      let candidate: CandidateRecord | null =
        existingCandidate as CandidateRecord | null;

      if (!candidate) {
        const { data: newCandidate, error: newCandidateError } =
          await supabase
            .from("candidates")
            .insert({
              exam_id: examId,
              full_name: candidateName.trim(),
              email: normalizedEmail,
            })
            .select("id, full_name, email")
            .single();

        if (newCandidateError) {
          setMessage(newCandidateError.message);
          setLoading(false);
          return;
        }

        candidate = newCandidate as CandidateRecord;
      }

      const { error: submissionError } = await supabase
        .from("submissions")
        .insert({
          exam_id: examId,
          candidate_id: candidate.id,
          answers: answerPayload,
          final_submission_hash: submissionHash,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        });

      if (submissionError) {
        setMessage(submissionError.message);
        setLoading(false);
        return;
      }

      await fetch("/api/blockchain-jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobType: "commit_submission",
          examId,
          candidateId: candidate.id,
          payload: {
            examId,
            candidateId: candidate.id,
            submissionHash,
          },
        }),
      });

      setMessage(`Submission successful. Final hash: ${submissionHash}`);
    } catch {
      setMessage("Something went wrong during submission.");
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
              Exam ID: {examId}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-[#efe5da] px-4 py-2 text-sm text-[#7f6a5a]">
              Official timer: 01:30:00
            </div>

            <Link
              href="/candidate"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Change UUID
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
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Full name"
          />
          <input
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            className="rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Email address"
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
                key={question.id}
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
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) =>
                            updateAnswer(question.id, e.target.value)
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.question_type === "short_answer" && (
                  <input
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      updateAnswer(question.id, e.target.value)
                    }
                    className="mt-5 w-full rounded-[20px] border border-[#e7dcd1] px-4 py-3 outline-none"
                    placeholder="Write your answer here..."
                  />
                )}

                {question.question_type === "essay" && (
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      updateAnswer(question.id, e.target.value)
                    }
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
          <div className="mt-5 rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a]">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}