"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CandidateEntryPage() {
  const router = useRouter();
  const [examId, setExamId] = useState("");

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();

    if (!examId.trim()) return;

    router.push(`/candidate/${examId.trim()}`);
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Candidate access
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Join an exam
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[#7f6a5a]">
              Enter the exam UUID shared by your recruiter to continue into the
              assessment.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
          >
            Home
          </Link>
        </div>

        <form onSubmit={handleContinue} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Paste exam UUID"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            required
          />

          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-[#4a3124] px-6 py-3 text-white">
              Continue to exam
            </button>

            <Link
              href="/docs"
              className="rounded-full border border-[#e7dcd1] px-6 py-3"
            >
              Read docs
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}