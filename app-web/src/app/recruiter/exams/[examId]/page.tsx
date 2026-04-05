"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import QuestionEditor from "@/components/QuestionEditor";
import CandidateListEditor from "@/components/CandidateListEditor";
import RecruiterWalletConnect from "@/components/RecruiterWalletConnect";
import {
  contractRead,
  contractWrite,
  getSavedRecruiterWallet,
  type HexAddress,
} from "@/lib/genlayer";

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
  question_type: string;
  points: number;
  options: string[];
  rubric: string;
}

interface CandidateView {
  candidate_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  has_submitted: boolean;
}

interface SubmissionView {
  candidate_id: string;
  answers_json: string;
  objective_score: number;
  subjective_score: number;
  total_score: number;
  result_status: string;
  submitted_at: string;
  grading_reasoning: string;
}

interface CandidateInviteRecord {
  candidateId: string;
  fullName: string;
  email: string;
  token: string;
  inviteUrl: string;
  createdAt: string;
}

function randomId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function inviteStorageKey(examAddress: string) {
  return `examproof_invites_${examAddress.toLowerCase()}`;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RecruiterExamDetailsPage() {
  const params = useParams();
  const rawExamId = params?.examId;
  const examAddress =
    typeof rawExamId === "string"
      ? (rawExamId as HexAddress)
      : Array.isArray(rawExamId)
        ? (rawExamId[0] as HexAddress)
        : ("" as HexAddress);

  const isValidExamAddress =
    !!examAddress &&
    examAddress !== ("undefined" as HexAddress) &&
    examAddress !== ("null" as HexAddress) &&
    examAddress.startsWith("0x");

  const [wallet, setWallet] = useState<HexAddress | null>(null);
  const [exam, setExam] = useState<ExamView | null>(null);
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [candidates, setCandidates] = useState<CandidateView[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionView[]>([]);
  const [invites, setInvites] = useState<CandidateInviteRecord[]>([]);
  const [message, setMessage] = useState("");
  const [candidateExamLink, setCandidateExamLink] = useState("");
  const [budgetUnits, setBudgetUnits] = useState("1");
  const [busyAction, setBusyAction] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const saved = getSavedRecruiterWallet();
    if (saved) {
      setWallet(saved);
    }
  }, []);

  useEffect(() => {
    if (isValidExamAddress && typeof window !== "undefined") {
      setCandidateExamLink(`${window.location.origin}/candidate/${examAddress}`);
    } else {
      setCandidateExamLink("");
    }
  }, [examAddress, isValidExamAddress]);

  useEffect(() => {
    if (typeof window === "undefined" || !isValidExamAddress) return;
    try {
      const raw = window.localStorage.getItem(inviteStorageKey(examAddress));
      if (!raw) {
        setInvites([]);
        return;
      }
      const parsed = JSON.parse(raw) as CandidateInviteRecord[];
      setInvites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setInvites([]);
    }
  }, [examAddress, isValidExamAddress]);

  function persistInvites(nextInvites: CandidateInviteRecord[]) {
    setInvites(nextInvites);
    if (typeof window !== "undefined" && isValidExamAddress) {
      window.localStorage.setItem(
        inviteStorageKey(examAddress),
        JSON.stringify(nextInvites)
      );
    }
  }

  async function loadData(silent = false) {
    if (!isValidExamAddress) {
      setMessage("Invalid contract address. Please create a new exam again.");
      return;
    }

    try {
      if (!silent) {
        setRefreshing(true);
      }

      const [examData, questionData, candidateData, submissionData] = await Promise.all([
        contractRead<ExamView>({
          address: examAddress,
          functionName: "get_exam",
        }),
        contractRead<QuestionView[]>({
          address: examAddress,
          functionName: "get_questions",
        }),
        contractRead<CandidateView[]>({
          address: examAddress,
          functionName: "get_candidates",
        }),
        contractRead<SubmissionView[]>({
          address: examAddress,
          functionName: "get_submissions",
        }),
      ]);

      setExam(examData);
      setQuestions(questionData || []);
      setCandidates(candidateData || []);
      setSubmissions(submissionData || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load contract state."
      );
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    if (isValidExamAddress) {
      void loadData();
    } else {
      setMessage("Invalid contract address. Please create a new exam again.");
    }
  }, [examAddress, isValidExamAddress]);

  const canWrite = useMemo(() => !!wallet && isValidExamAddress, [wallet, isValidExamAddress]);

  const gradedCount = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.result_status === "graded" ||
          ((submission.subjective_score ?? 0) > 0 &&
            submission.result_status !== "finalized")
      ).length,
    [submissions]
  );

  const finalizedCount = useMemo(
    () => submissions.filter((submission) => submission.result_status === "finalized").length,
    [submissions]
  );

  const submittedOnly = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.result_status !== "graded" &&
          submission.result_status !== "finalized"
      ),
    [submissions]
  );

  const gradeableSubmissions = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.result_status !== "graded" &&
          submission.result_status !== "finalized"
      ),
    [submissions]
  );

  const finalizableSubmissions = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.result_status === "graded" ||
          ((submission.subjective_score ?? 0) > 0 &&
            submission.result_status !== "finalized")
      ),
    [submissions]
  );

  async function runWrite(
    actionLabel: string,
    functionName: string,
    args: unknown[],
    successMessage: string
  ) {
    if (!wallet) {
      setMessage("Connect the recruiter wallet first.");
      return;
    }

    try {
      setBusyAction(actionLabel);
      setMessage("");

      await contractWrite({
        recruiter: wallet,
        address: examAddress,
        functionName,
        args,
      });

      setMessage(successMessage);
      await loadData(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : `Failed to ${actionLabel}.`
      );
    } finally {
      setBusyAction("");
    }
  }

  async function handleAddQuestion(question: {
    prompt: string;
    questionType: string;
    points: number;
    options?: string[];
    rubric?: string;
    correctAnswer?: string;
  }) {
    await runWrite(
      "add question",
      "add_question",
      [
        question.prompt,
        question.questionType,
        question.points,
        question.options || [],
        question.correctAnswer || "",
        question.rubric || "",
      ],
      "Question added successfully."
    );
  }

  async function handleAddCandidate(candidate: {
    fullName: string;
    email: string;
  }) {
    if (!wallet) {
      setMessage("Connect the recruiter wallet first.");
      return;
    }

    try {
      setBusyAction("add candidate");
      setMessage("");

      const candidateId = randomId("cand");
      const token = crypto.randomUUID();
      const secretHash = await sha256Hex(token);

      await contractWrite({
        recruiter: wallet,
        address: examAddress,
        functionName: "register_candidate",
        args: [
          candidateId,
          candidate.fullName,
          candidate.email.trim().toLowerCase(),
          secretHash,
        ],
      });

      const inviteUrl = `${window.location.origin}/candidate/${examAddress}?candidateId=${encodeURIComponent(
        candidateId
      )}&token=${encodeURIComponent(token)}`;

      const newInvite: CandidateInviteRecord = {
        candidateId,
        fullName: candidate.fullName,
        email: candidate.email.trim().toLowerCase(),
        token,
        inviteUrl,
        createdAt: new Date().toISOString(),
      };

      const nextInvites = [newInvite, ...invites];
      persistInvites(nextInvites);

      setMessage(
        "Candidate added and invite saved locally. Copy or export it from the Invite vault below."
      );
      await loadData(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to add candidate."
      );
    } finally {
      setBusyAction("");
    }
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

  async function copyInvite(inviteUrl: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage("Candidate invite link copied.");
    } catch {
      setMessage("Could not copy the invite link.");
    }
  }

  function removeInvite(candidateId: string) {
    const next = invites.filter((invite) => invite.candidateId !== candidateId);
    persistInvites(next);
    setMessage("Invite removed from local vault.");
  }

  function exportInvites() {
    if (invites.length === 0) {
      setMessage("No invites available to export.");
      return;
    }

    const content = JSON.stringify(invites, null, 2);
    downloadTextFile(
      `examproof-invites-${examAddress.slice(0, 10)}.json`,
      content
    );
    setMessage("Invite vault exported.");
  }

  function getCandidateName(candidateId: string) {
    return (
      candidates.find((candidate) => candidate.candidate_id === candidateId)?.full_name ||
      candidateId
    );
  }

  async function fundBudget() {
    const units = Number(budgetUnits);
    if (!Number.isFinite(units) || units <= 0) {
      setMessage("Enter a valid budget unit amount.");
      return;
    }

    await runWrite(
      "fund budget",
      "fund_submission_budget",
      [units],
      "Submission budget funded successfully."
    );
  }

  async function publishExam() {
    await runWrite("publish exam", "publish_exam", [], "Exam published successfully.");
  }

  async function openExam() {
    await runWrite("open exam", "open_exam", [], "Exam opened successfully.");
  }

  async function closeExam() {
    await runWrite("close exam", "close_exam", [], "Exam closed successfully.");
  }

  async function gradeSubmission(candidateId: string) {
    await runWrite(
      `grade ${candidateId}`,
      "grade_subjective_submission",
      [candidateId],
      "Subjective grading completed."
    );
  }

  async function finalizeSubmission(candidateId: string) {
    await runWrite(
      `finalize ${candidateId}`,
      "finalize_result",
      [candidateId, "finalized"],
      "Result finalized successfully."
    );
  }

  async function gradeAllSubmitted() {
    if (gradeableSubmissions.length === 0) {
      setMessage("No submitted entries available to grade.");
      return;
    }

    if (!wallet) {
      setMessage("Connect the recruiter wallet first.");
      return;
    }

    try {
      setBusyAction("grade all");
      setMessage("");

      for (const submission of gradeableSubmissions) {
        await contractWrite({
          recruiter: wallet,
          address: examAddress,
          functionName: "grade_subjective_submission",
          args: [submission.candidate_id],
        });
      }

      setMessage(`Graded ${gradeableSubmissions.length} submission(s).`);
      await loadData(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to grade all submissions."
      );
    } finally {
      setBusyAction("");
    }
  }

  async function finalizeAllGraded() {
    if (finalizableSubmissions.length === 0) {
      setMessage("No graded entries available to finalize.");
      return;
    }

    if (!wallet) {
      setMessage("Connect the recruiter wallet first.");
      return;
    }

    try {
      setBusyAction("finalize all");
      setMessage("");

      for (const submission of finalizableSubmissions) {
        await contractWrite({
          recruiter: wallet,
          address: examAddress,
          functionName: "finalize_result",
          args: [submission.candidate_id, "finalized"],
        });
      }

      setMessage(`Finalized ${finalizableSubmissions.length} submission(s).`);
      await loadData(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to finalize all submissions."
      );
    } finally {
      setBusyAction("");
    }
  }

  function getStatusBadgeColor(status: string | null) {
    if (status === "finalized") {
      return "bg-green-100 text-green-700";
    }
    if (status === "graded") {
      return "bg-blue-100 text-blue-700";
    }
    if (status === "submitted" || status === "completed") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "scheduled" || status === "pending" || status === "processing") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "failed" || status === "closed") {
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
              Manage contract-owned questions, candidates, submission budget, grading,
              and finalization.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadData()}
              disabled={refreshing}
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh data"}
            </button>

            <Link
              href="/recruiter/create-exam"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Create exam
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Home
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <RecruiterWalletConnect onConnected={setWallet} />
        </div>

        {message && (
          <div className="mb-6 rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a] break-words">
            {message}
          </div>
        )}

        <div className="mb-8 rounded-[28px] border border-[#e7dcd1] bg-white p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
            Contract address
          </div>
          <div className="mt-3 break-all rounded-[18px] bg-[#fffaf4] px-4 py-3 text-sm text-[#7f6a5a]">
            {examAddress || "No valid contract address."}
          </div>
        </div>

        {exam && (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                  Status
                </div>
                <div className="mt-3 text-2xl font-semibold">{exam.status}</div>
              </div>

              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                  Candidates
                </div>
                <div className="mt-3 text-2xl font-semibold">{candidates.length}</div>
              </div>

              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                  Submissions
                </div>
                <div className="mt-3 text-2xl font-semibold">{submissions.length}</div>
              </div>

              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                  Graded
                </div>
                <div className="mt-3 text-2xl font-semibold">{gradedCount}</div>
              </div>

              <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                  Finalized
                </div>
                <div className="mt-3 text-2xl font-semibold">{finalizedCount}</div>
              </div>
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Exam state
                </div>
                <div className="mt-4 space-y-3 text-sm text-[#7f6a5a]">
                  <div>
                    <span className="font-medium text-[#2f241d]">Title:</span> {exam.title}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Description:</span>{" "}
                    {exam.description || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Exam ID:</span> {exam.exam_id}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Status:</span> {exam.status}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Start:</span> {exam.start_time}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">End:</span> {exam.end_time}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Budget:</span>{" "}
                    {exam.submission_budget}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Fee per candidate:</span>{" "}
                    {exam.submission_fee_per_candidate}
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Owner:</span>
                    <div className="mt-1 break-all">{exam.owner}</div>
                  </div>
                  <div>
                    <span className="font-medium text-[#2f241d]">Relayer:</span>
                    <div className="mt-1 break-all">{exam.relayer}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Recruiter actions
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={publishExam}
                    disabled={!canWrite || busyAction !== ""}
                    className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {busyAction === "publish exam" ? "Publishing..." : "Publish"}
                  </button>

                  <button
                    onClick={openExam}
                    disabled={!canWrite || busyAction !== ""}
                    className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {busyAction === "open exam" ? "Opening..." : "Open"}
                  </button>

                  <button
                    onClick={closeExam}
                    disabled={!canWrite || busyAction !== ""}
                    className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {busyAction === "close exam" ? "Closing..." : "Close"}
                  </button>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium">Fund submission budget</label>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="number"
                      min="1"
                      value={budgetUnits}
                      onChange={(e) => setBudgetUnits(e.target.value)}
                      className="w-full max-w-[220px] rounded-[18px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                    />
                    <button
                      onClick={fundBudget}
                      disabled={!canWrite || busyAction !== ""}
                      className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {busyAction === "fund budget" ? "Funding..." : "Fund budget"}
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                    Bulk actions
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      onClick={gradeAllSubmitted}
                      disabled={!canWrite || busyAction !== "" || gradeableSubmissions.length === 0}
                      className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {busyAction === "grade all"
                        ? "Grading all..."
                        : `Grade all submitted (${gradeableSubmissions.length})`}
                    </button>

                    <button
                      onClick={finalizeAllGraded}
                      disabled={!canWrite || busyAction !== "" || finalizableSubmissions.length === 0}
                      className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm disabled:opacity-50"
                    >
                      {busyAction === "finalize all"
                        ? "Finalizing all..."
                        : `Finalize all graded (${finalizableSubmissions.length})`}
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                    Candidate exam link
                  </div>
                  <div className="mt-3 break-all rounded-[18px] bg-[#fffaf4] px-4 py-3 text-sm text-[#7f6a5a]">
                    {candidateExamLink || "No valid exam link available yet."}
                  </div>
                  <button
                    onClick={copyCandidateLink}
                    disabled={!isValidExamAddress}
                    className="mt-3 rounded-full bg-[#4a3124] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Copy generic link
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {invites.length > 0 && (
          <div className="mb-8 rounded-[28px] border border-[#e7dcd1] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Invite vault
                </div>
                <p className="mt-2 text-sm text-[#7f6a5a]">
                  These raw invite tokens are only stored locally in this browser.
                  Export them before clearing storage or changing devices.
                </p>
              </div>

              <button
                onClick={exportInvites}
                className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
              >
                Export invites
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite.candidateId}
                  className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-medium">{invite.fullName}</div>
                      <div className="mt-1 text-sm text-[#7f6a5a]">{invite.email}</div>
                      <div className="mt-2 text-xs text-[#7f6a5a]">
                        Candidate ID: {invite.candidateId}
                      </div>
                      <div className="mt-2 text-xs text-[#7f6a5a]">
                        Created: {new Date(invite.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyInvite(invite.inviteUrl)}
                        className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white"
                      >
                        Copy invite
                      </button>
                      <button
                        onClick={() => removeInvite(invite.candidateId)}
                        className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[18px] border border-[#e7dcd1] bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                      Invite URL
                    </div>
                    <div className="mt-2 break-all text-sm text-[#2f241d]">
                      {invite.inviteUrl}
                    </div>
                  </div>

                  <div className="mt-3 rounded-[18px] border border-[#e7dcd1] bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                      Access token
                    </div>
                    <div className="mt-2 break-all font-mono text-sm text-[#2f241d]">
                      {invite.token}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isValidExamAddress ? (
          <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6 text-[#7f6a5a]">
            This page was opened without a valid contract address. Go back to{" "}
            <Link href="/recruiter/create-exam" className="underline">
              Create exam
            </Link>{" "}
            and deploy a new exam contract.
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
                        key={`${question.prompt}-${index}`}
                        className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                      >
                        <div className="text-xs uppercase tracking-[0.2em] text-[#7f6a5a]">
                          Question {index + 1}
                        </div>
                        <div className="mt-2 text-lg font-medium">{question.prompt}</div>
                        <div className="mt-2 text-sm text-[#7f6a5a]">
                          Type: {question.question_type} · Points: {question.points}
                        </div>
                        {question.rubric ? (
                          <div className="mt-2 text-sm text-[#7f6a5a]">
                            Rubric: {question.rubric}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                  Registered candidates
                </div>
                <div className="mt-5 space-y-4">
                  {candidates.length === 0 ? (
                    <div className="text-sm text-[#7f6a5a]">No candidates added yet.</div>
                  ) : (
                    candidates.map((candidate) => (
                      <div
                        key={candidate.candidate_id}
                        className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                      >
                        <div className="text-lg font-medium">{candidate.full_name}</div>
                        <div className="mt-1 text-sm text-[#7f6a5a]">{candidate.email}</div>
                        <div className="mt-2 text-xs text-[#7f6a5a]">
                          Candidate ID: {candidate.candidate_id}
                        </div>
                        <div className="mt-2 text-xs text-[#7f6a5a]">
                          Submitted: {candidate.has_submitted ? "Yes" : "No"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                    Candidate submissions
                  </div>
                  <div className="text-sm text-[#7f6a5a]">
                    Submitted only: {submittedOnly.length}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {submissions.length === 0 ? (
                    <div className="text-sm text-[#7f6a5a]">No submissions yet.</div>
                  ) : (
                    submissions.map((submission, idx) => (
                      <div
                        key={`${submission.candidate_id}-${idx}`}
                        className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-lg font-medium">
                            {getCandidateName(submission.candidate_id)}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                              submission.result_status || "submitted"
                            )}`}
                          >
                            {submission.result_status || "submitted"}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-[#7f6a5a]">
                          Submitted: {submission.submitted_at}
                        </div>

                        <div className="mt-4 rounded-[18px] border border-[#e7dcd1] bg-white p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-[#7f6a5a]">
                            Raw submitted answers JSON
                          </div>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm text-[#2f241d]">
                            {submission.answers_json}
                          </pre>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => gradeSubmission(submission.candidate_id)}
                            disabled={
                              !canWrite ||
                              busyAction !== "" ||
                              submission.result_status === "graded" ||
                              submission.result_status === "finalized"
                            }
                            className="rounded-full bg-[#4a3124] px-4 py-2 text-sm text-white disabled:opacity-50"
                          >
                            {busyAction === `grade ${submission.candidate_id}`
                              ? "Grading..."
                              : submission.result_status === "graded" ||
                                  submission.result_status === "finalized"
                                ? "Already graded"
                                : "Grade"}
                          </button>

                          <button
                            onClick={() => finalizeSubmission(submission.candidate_id)}
                            disabled={
                              !canWrite ||
                              busyAction !== "" ||
                              submission.result_status === "finalized"
                            }
                            className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm disabled:opacity-50"
                          >
                            {busyAction === `finalize ${submission.candidate_id}`
                              ? "Finalizing..."
                              : submission.result_status === "finalized"
                                ? "Finalized"
                                : "Finalize"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                    Result overview
                  </div>
                  <div className="text-sm text-[#7f6a5a]">
                    Finalized: {finalizedCount}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {submissions.length === 0 ? (
                    <div className="text-sm text-[#7f6a5a]">No finalized results yet.</div>
                  ) : (
                    submissions.map((submission, idx) => (
                      <div
                        key={`${submission.candidate_id}-result-${idx}`}
                        className="rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-lg font-medium">
                            {getCandidateName(submission.candidate_id)}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                              submission.result_status || "submitted"
                            )}`}
                          >
                            {submission.result_status || "submitted"}
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
                              {submission.total_score ?? "-"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 rounded-[16px] border border-[#e7dcd1] bg-white p-3 text-sm text-[#7f6a5a]">
                          {submission.grading_reasoning || "No grading reasoning yet."}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}