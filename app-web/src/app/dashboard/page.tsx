import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { getCurrentUserProfile } from "@/lib/get-user-profile";

export default async function DashboardPage() {
  const { profile } = await getCurrentUserProfile();

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Recruiter dashboard
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Assessment overview
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#7f6a5a]">
              Created exams, candidate sessions, submissions, and score
              finalization live here.
            </p>

            <div className="mt-4 inline-flex rounded-full border border-[#e7dcd1] bg-white px-4 py-2 text-sm text-[#7f6a5a]">
              Role: {profile?.role ?? "unknown"}
            </div>
          </div>

          <SignOutButton />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/recruiter/create-exam"
            className="rounded-[24px] border border-[#e7dcd1] bg-white p-5"
          >
            <div className="text-lg font-medium">Create exam</div>
            <div className="mt-2 text-sm text-[#7f6a5a]">
              Start a new assessment flow.
            </div>
          </Link>

          <Link
            href="/dashboard/exams"
            className="rounded-[24px] border border-[#e7dcd1] bg-white p-5"
          >
            <div className="text-lg font-medium">Open past exams</div>
            <div className="mt-2 text-sm text-[#7f6a5a]">
              Reopen and manage previous exams.
            </div>
          </Link>

          <Link
            href="/dashboard/jobs"
            className="rounded-[24px] border border-[#e7dcd1] bg-white p-5"
          >
            <div className="text-lg font-medium">Blockchain jobs</div>
            <div className="mt-2 text-sm text-[#7f6a5a]">
              Monitor queued on-chain actions.
            </div>
          </Link>

          <Link
            href="/docs"
            className="rounded-[24px] border border-[#e7dcd1] bg-white p-5"
          >
            <div className="text-lg font-medium">Docs</div>
            <div className="mt-2 text-sm text-[#7f6a5a]">
              Read how the platform works.
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}