import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Dashboard
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              ExamProof workspace
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#7f6a5a]">
              Use the current GenLayer-first flows to create contract-backed
              exams, manage recruiter workflows, and access candidate entry.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Home
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Docs
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href="/recruiter/create-exam"
            className="rounded-[24px] border border-[#e7dcd1] bg-white p-6 transition hover:opacity-90"
          >
            <div className="text-xs uppercase tracking-[0.22em] text-[#7f6a5a]">
              Recruiter
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Create exam
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#7f6a5a]">
              Deploy a new GenLayer-backed exam contract from the recruiter wallet.
            </p>
          </Link>

          <Link
            href="/candidate"
            className="rounded-[24px] border border-[#e7dcd1] bg-white p-6 transition hover:opacity-90"
          >
            <div className="text-xs uppercase tracking-[0.22em] text-[#7f6a5a]">
              Candidate
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Join exam
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#7f6a5a]">
              Open an invite link or enter an exam contract address to continue.
            </p>
          </Link>

          <Link
            href="/docs"
            className="rounded-[24px] border border-[#e7dcd1] bg-white p-6 transition hover:opacity-90"
          >
            <div className="text-xs uppercase tracking-[0.22em] text-[#7f6a5a]">
              Guide
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Read docs
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#7f6a5a]">
              Review how ExamProof works and follow the current recruiter and
              candidate steps.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}