"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultViewerPage() {
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId") || "";
  const candidateId = searchParams.get("candidateId") || "";

  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadResult() {
      if (!examId || !candidateId) return;

      setLoading(true);
      setMessage("");

      try {
        const res = await fetch("/api/genlayer/get-result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            examId,
            candidateId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage(data.error || "Failed to fetch result");
          return;
        }

        setResultData(data.result);
      } catch {
        setMessage("Something went wrong while fetching result.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [examId, candidateId]);

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
          On-chain result viewer
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Candidate result
        </h1>

        <div className="mt-6 rounded-[20px] border border-[#e7dcd1] bg-white p-4 text-sm text-[#7f6a5a]">
          <div>Exam ID: {examId || "-"}</div>
          <div className="mt-2">Candidate ID: {candidateId || "-"}</div>
        </div>

        {loading && (
          <div className="mt-6 rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a]">
            Loading result...
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a]">
            {message}
          </div>
        )}

        {resultData && (
          <div className="mt-6 rounded-[28px] border border-[#e7dcd1] bg-white p-6">
            <div className="text-sm text-[#7f6a5a] break-all">
              Raw response: {resultData.stdout || "-"}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}