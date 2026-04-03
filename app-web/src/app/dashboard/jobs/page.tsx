"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    async function loadJobs() {
      const { data } = await supabase
        .from("blockchain_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      setJobs(data || []);
    }

    loadJobs();
  }, []);

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
          Blockchain jobs
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          On-chain action queue
        </h1>

        <div className="mt-8 space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-[20px] border border-[#e7dcd1] bg-white p-4"
            >
              <div className="text-sm font-medium">{job.job_type}</div>
              <div className="mt-1 text-sm text-[#7f6a5a]">
                Status: {job.status}
              </div>
              <div className="mt-1 text-sm text-[#7f6a5a]">
                Exam ID: {job.exam_id || "-"}
              </div>
              <div className="mt-1 text-sm text-[#7f6a5a]">
                Candidate ID: {job.candidate_id || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}