"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ExamRecord {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export default function ExamsListPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [message, setMessage] = useState("");

  async function loadExams() {
    const { data, error } = await supabase
      .from("exams")
      .select("id, title, description, start_time, end_time, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setExams((data as ExamRecord[]) || []);
  }

  useEffect(() => {
    loadExams();
  }, []);

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Recruiter dashboard
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              All assessments
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#7f6a5a]">
              Reopen any previously created exam and continue managing its candidates,
              submissions, and results.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/recruiter/create-exam"
              className="rounded-full bg-[#4a3124] px-5 py-3 text-sm font-medium text-white"
            >
              Create new exam
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#e7dcd1] px-5 py-3 text-sm"
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

        <div className="grid gap-4">
          {exams.length === 0 ? (
            <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-6 text-[#7f6a5a]">
              No exams created yet.
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-[24px] border border-[#e7dcd1] bg-white p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
                      Exam record
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                      {exam.title || "Untitled exam"}
                    </h2>
                    <p className="mt-3 text-[15px] leading-7 text-[#7f6a5a]">
                      {exam.description || "No description provided."}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-[#7f6a5a] md:grid-cols-2">
                      <div>Start: {exam.start_time || "-"}</div>
                      <div>End: {exam.end_time || "-"}</div>
                      <div className="md:col-span-2 break-all">Exam ID: {exam.id}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/recruiter/exams/${exam.id}`}
                      className="rounded-full bg-[#4a3124] px-5 py-3 text-sm font-medium text-white"
                    >
                      Open exam
                    </Link>
                    <Link
                      href={`/candidate/${exam.id}`}
                      className="rounded-full border border-[#e7dcd1] px-5 py-3 text-sm"
                    >
                      Candidate view
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}