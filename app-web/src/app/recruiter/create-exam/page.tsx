"use client";

import { useState } from "react";

export default function CreateExamPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  async function handleCreateExam() {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
        }),
      });

      const data = await res.json();
      console.log("EXAMS API RESPONSE:", data);

      if (!res.ok) {
        setResponse(data.error || "Failed to create exam");
        return;
      }

      const examId = data?.exam?.id;

      if (!examId) {
        setResponse("Exam was created, but no exam ID was returned.");
        return;
      }

      const metadataHash = `exam-meta-${examId}`;

      const jobRes = await fetch("/api/blockchain-jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobType: "register_exam",
          examId,
          payload: {
            examId,
            metadataHash,
            startTime,
            endTime,
          },
        }),
      });

      const jobData = await jobRes.json();
      console.log("BLOCKCHAIN JOB RESPONSE:", jobData);

      if (!jobRes.ok) {
        setResponse(
          jobData.error || "Exam created, but failed to queue blockchain job."
        );
        return;
      }

      window.location.href = `/recruiter/exams/${examId}`;
    } catch (error) {
      console.error("CREATE EXAM ERROR:", error);
      setResponse("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Recruiter workspace
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Create assessment
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#7f6a5a]">
              Define the exam metadata, timing window, and base structure for your
              high-stakes assessment flow.
            </p>
          </div>
        </div>

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
            <label className="mb-2 block text-sm font-medium">Description</label>
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

          <button
            onClick={handleCreateExam}
            disabled={loading}
            className="mt-3 w-fit rounded-full bg-[#4a3124] px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Save and continue"}
          </button>

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