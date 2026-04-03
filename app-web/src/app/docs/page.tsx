import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      title: "What ExamProof is",
      body: "ExamProof is a verifiable assessment platform for recruitment, grants, admissions, scholarship screening, bootcamp entry, and other high-stakes timed exam workflows.",
    },
    {
      title: "What the platform uses",
      body: "The platform is built with Next.js for the application layer, Supabase for authentication and data storage, and a GenLayer-backed private job-processing flow for verifiable assessment actions.",
    },
    {
      title: "Recruiter flow",
      body: "Recruiters sign in, create an exam, define the exam title and description, set the exam window, add questions, add candidates, and share the exam UUID or candidate link.",
    },
    {
      title: "Reopening past exams",
      body: "Recruiters can reopen previous exams from the exams list instead of creating a new exam every time. This makes it easy to continue management, review submissions, and finalize outstanding results.",
    },
    {
      title: "Candidate flow",
      body: "Candidates can join from the landing page by entering the exam UUID manually, or they can use a recruiter-shared direct exam link that already includes the exam identifier.",
    },
    {
      title: "Candidate submissions",
      body: "After joining an exam, candidates enter their details, answer all questions, and submit. Recruiters can later review the submitted answers directly inside the recruiter exam details page.",
    },
    {
      title: "Results and finalization",
      body: "Recruiters and admins can review submission status, queued blockchain jobs, and finalized result fields including objective score, subjective score, total score, and final result status.",
    },
    {
      title: "Blockchain job processing",
      body: "Sensitive GenLayer write actions are not signed directly from the public app. Instead, the application creates queued blockchain jobs, and a private worker processes them securely in the background.",
    },
    {
      title: "Navigation guide",
      body: "The landing page is the public entry point. Recruiters sign in to access exam creation and management. Candidates use the candidate page to join with UUID or direct link. The dashboard and exams list help recruiters return to previous work at any time.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Documentation
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Platform guide
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#7f6a5a]">
              Learn what the platform does, how it works, and how recruiters
              and candidates should navigate it from exam creation to finalized
              results.
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
              href="/dashboard"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/exams"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Exams list
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-[24px] border border-[#e7dcd1] bg-white p-6"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                {section.title}
              </h2>
              <p className="mt-3 text-[15px] leading-8 text-[#7f6a5a]">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}