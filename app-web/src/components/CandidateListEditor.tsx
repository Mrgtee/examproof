"use client";

import { useState } from "react";

interface CandidateListEditorProps {
  onAddCandidate: (candidate: { fullName: string; email: string }) => void;
}

export default function CandidateListEditor({
  onAddCandidate,
}: CandidateListEditorProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  function handleAddCandidate() {
    if (!fullName || !email) return;

    onAddCandidate({ fullName, email });
    setFullName("");
    setEmail("");
  }

  return (
    <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
      <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
        Candidate invites
      </div>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
        Add candidate
      </h3>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            placeholder="jane@example.com"
          />
        </div>

        <button
          onClick={handleAddCandidate}
          className="mt-2 w-fit rounded-full bg-[#4a3124] px-5 py-3 text-sm font-medium text-white"
        >
          Add candidate
        </button>
      </div>
    </div>
  );
}