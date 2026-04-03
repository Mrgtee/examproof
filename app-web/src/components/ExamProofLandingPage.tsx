"use client";

import Link from "next/link";

export default function ExamProofLandingPage() {
  const palette = {
    page: "#ddd1c4",
    shell: "#f7f2ec",
    surface: "#fffaf4",
    card: "#efe5da",
    cardSoft: "#f5eee7",
    line: "#e7dcd1",
    text: "#2f241d",
    muted: "#7f6a5a",
    accent: "#b99173",
    accentDark: "#8a6147",
    dark: "#34251d",
  };

  const steps = [
    {
      no: "01",
      title: "Recruiters create assessments",
      body: "Recruiters sign in, define the exam window, add candidates, and prepare the questions for a verifiable assessment flow.",
    },
    {
      no: "02",
      title: "Candidates join with UUID or direct link",
      body: "Candidates can paste the exam UUID manually or open a recruiter-shared candidate link that already contains the exam identifier.",
    },
    {
      no: "03",
      title: "Submissions are queued for on-chain trust",
      body: "Submissions are recorded in the app, then blockchain jobs are processed privately for safer GenLayer-backed verification.",
    },
  ];

  const highlights = [
    {
      title: "Recruiter-first workflow",
      body: "Clean exam creation flow for recruiters with candidate management and shareable exam access.",
    },
    {
      title: "Candidate-friendly entry",
      body: "Candidates can join by UUID or by a direct exam link shared by the recruiter.",
    },
    {
      title: "GenLayer-backed trust",
      body: "Assessment actions can be committed and finalized through a safer queued blockchain workflow.",
    },
    {
      title: "Clear operational docs",
      body: "A dedicated docs page explains the platform, the flows, and how to navigate the system.",
    },
  ];

  return (
    <main
      className="min-h-screen px-4 py-6 md:px-6 lg:px-8"
      style={{
        background: `radial-gradient(circle at top, #e7ddd3 0%, ${palette.page} 38%, #d7cabd 100%)`,
        color: palette.text,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        className="mx-auto max-w-7xl rounded-[32px] border p-3 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-5"
        style={{ background: palette.shell, borderColor: palette.line }}
      >
        <header
          className="sticky top-4 z-20 mx-auto flex max-w-6xl items-center justify-between rounded-full border px-4 py-3 md:px-6"
          style={{
            background: "rgba(255,250,244,0.86)",
            borderColor: palette.line,
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${palette.accentDark} 0%, ${palette.accent} 100%)`,
              }}
            >
              EP
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] md:text-[15px]">
                ExamProof
              </div>
              <div
                className="text-[10px] uppercase tracking-[0.34em] md:text-[11px]"
                style={{ color: palette.muted }}
              >
                Verifiable Assessment Protocol
              </div>
            </div>
          </div>

          <nav
            className="hidden items-center gap-8 text-sm md:flex"
            style={{ color: palette.muted }}
          >
            <a href="#about" className="transition hover:opacity-70">
              About
            </a>
            <a href="#workflow" className="transition hover:opacity-70">
              Workflow
            </a>
            <Link href="/docs" className="transition hover:opacity-70">
              Docs
            </Link>
          </nav>

          <Link
            href="/recruiter/create-exam"
            className="rounded-full px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${palette.accentDark} 0%, ${palette.accent} 100%)`,
              textDecoration: "none",
            }}
          >
            Recruiter sign in
          </Link>
        </header>

        <section
          className="mt-4 overflow-hidden rounded-[30px]"
          style={{
            background: `linear-gradient(90deg, rgba(42,28,22,0.84) 0%, rgba(70,48,36,0.70) 42%, rgba(185,145,115,0.24) 100%), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=80') center/cover`,
          }}
        >
          <div className="grid min-h-[620px] gap-10 px-6 py-8 md:px-10 md:py-10 lg:px-14 lg:py-14">
            <div className="flex flex-col justify-between">
              <div>
                <div
                  className="inline-flex rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/85"
                  style={{ borderColor: "rgba(255,255,255,0.18)" }}
                >
                  Powered by GenLayer infrastructure
                </div>
              </div>

              <div>
                <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-6xl lg:text-[76px]">
                  Bringing trust and finality to high-stakes online exams
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-white/78 md:text-lg">
                  ExamProof helps recruiters, grant programs, and admissions
                  teams run synchronized assessments with stronger timing
                  control, submission integrity, and verifiable score
                  finalization.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/recruiter/create-exam"
                    className="rounded-full px-5 py-3 text-sm font-medium"
                    style={{
                      background: "#fff",
                      color: palette.text,
                      textDecoration: "none",
                    }}
                  >
                    Recruiter sign in
                  </Link>
                  <Link
                    href="/candidate"
                    className="rounded-full border px-5 py-3 text-sm font-medium text-white"
                    style={{
                      borderColor: "rgba(255,255,255,0.18)",
                      textDecoration: "none",
                    }}
                  >
                    Candidate access
                  </Link>
                  <Link
                    href="/docs"
                    className="rounded-full border px-5 py-3 text-sm font-medium text-white"
                    style={{
                      borderColor: "rgba(255,255,255,0.18)",
                      textDecoration: "none",
                    }}
                  >
                    Docs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.25fr_0.9fr]"
        >
          <div
            className="rounded-[28px] p-7 md:p-8"
            style={{
              background: `linear-gradient(180deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`,
              color: "#fff",
            }}
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/70">
              Assessment integrity
            </div>
            <div className="mt-10 text-6xl font-semibold tracking-[-0.06em]">
              100%
            </div>
            <div className="mt-2 text-white/80">
              Window synchronization focus
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-3xl font-semibold">2</div>
                <div className="mt-1 text-white/78">Main user paths</div>
              </div>
              <div>
                <div className="text-3xl font-semibold">1</div>
                <div className="mt-1 text-white/78">Trusted result layer</div>
              </div>
            </div>
          </div>

          <div
            className="rounded-[28px] p-7 md:p-8"
            style={{ background: palette.cardSoft }}
          >
            <div className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
              Who we are
            </div>
            <p
              className="mt-5 max-w-2xl text-[15px] leading-8 md:text-base"
              style={{ color: palette.muted }}
            >
              ExamProof is built for teams that need more than a standard CBT
              platform. We focus on high-stakes assessment flows where timing,
              grading trust, and final result integrity actually matter.
            </p>
            <p
              className="mt-4 max-w-2xl text-[15px] leading-8 md:text-base"
              style={{ color: palette.muted }}
            >
              Recruiters create and manage exams. Candidates join by UUID or
              direct link. The system records a verifiable trail for key
              assessment events.
            </p>
          </div>

          <div
            className="overflow-hidden rounded-[28px]"
            style={{ background: palette.card }}
          >
            <div
              className="h-full min-h-[280px] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80')",
              }}
            />
          </div>
        </section>

        <section
          id="workflow"
          className="mt-14 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div>
            <div className="max-w-xl">
              <div
                className="text-xs uppercase tracking-[0.28em]"
                style={{ color: palette.muted }}
              >
                The workflow
              </div>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
                How ExamProof works from entry to verification
              </h2>
            </div>

            <div className="mt-8 space-y-4">
              {steps.map((step) => (
                <div
                  key={step.no}
                  className="rounded-[28px] border p-6 md:p-7"
                  style={{
                    borderColor: palette.line,
                    background: palette.surface,
                  }}
                >
                  <div
                    className="text-5xl font-light tracking-[-0.08em]"
                    style={{ color: "#d3c4b6" }}
                  >
                    {step.no}
                  </div>
                  <div className="mt-3 text-2xl font-medium tracking-[-0.03em] md:text-[30px]">
                    {step.title}
                  </div>
                  <p
                    className="mt-3 max-w-2xl text-[15px] leading-8 md:text-base"
                    style={{ color: palette.muted }}
                  >
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[32px] border p-3"
            style={{ borderColor: palette.line, background: palette.card }}
          >
            <div
              className="h-full min-h-[760px] rounded-[24px] bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(52,37,29,0.12) 0%, rgba(52,37,29,0.26) 100%), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80')",
              }}
            />
          </div>
        </section>

        <section id="why" className="mt-14">
          <div className="max-w-2xl">
            <div
              className="text-xs uppercase tracking-[0.28em]"
              style={{ color: palette.muted }}
            >
              Why ExamProof
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              A cleaner interface for high-stakes assessment integrity
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item, idx) => (
              <div
                key={item.title}
                className={`rounded-[28px] border p-6 ${
                  idx === 3 ? "xl:col-span-2" : ""
                }`}
                style={{
                  borderColor: palette.line,
                  background:
                    idx === 2
                      ? `linear-gradient(180deg, ${palette.accent} 0%, ${palette.accentDark} 100%)`
                      : idx === 3
                        ? palette.dark
                        : palette.cardSoft,
                  color: idx >= 2 ? "#fff" : palette.text,
                }}
              >
                <div className="text-xl font-medium tracking-[-0.03em] md:text-2xl">
                  {item.title}
                </div>
                <p
                  className="mt-3 text-[15px] leading-8 md:text-base"
                  style={{
                    color:
                      idx >= 2 ? "rgba(255,255,255,0.80)" : palette.muted,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className="rounded-[30px] p-8 md:p-10"
            style={{ background: palette.dark, color: "#fff" }}
          >
            <div className="text-xs uppercase tracking-[0.28em] text-white/55">
              Product positioning
            </div>
            <h3 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Not just another exam website — a verifiable assessment layer for
              serious use cases
            </h3>
            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-white/76 md:text-base">
              Built for recruitment, grants, fellowships, bootcamps,
              admissions, and other workflows where synchronized timing,
              trusted grading, and defensible results are part of the product.
            </p>
          </div>

          <div
            className="rounded-[30px] p-8 md:p-10"
            style={{ background: palette.card }}
          >
            <div
              className="text-xs uppercase tracking-[0.28em]"
              style={{ color: palette.muted }}
            >
              Quick navigation
            </div>
            <div className="mt-4 space-y-3">
              <Link
                href="/recruiter/create-exam"
                className="block rounded-[18px] bg-white px-4 py-3 text-sm font-medium"
              >
                Recruiter sign in / sign up
              </Link>
              <Link
                href="/candidate"
                className="block rounded-[18px] bg-white px-4 py-3 text-sm font-medium"
              >
                Candidate access
              </Link>
              <Link
                href="/docs"
                className="block rounded-[18px] bg-white px-4 py-3 text-sm font-medium"
              >
                Docs and platform guide
              </Link>
              <Link
                href="/dashboard"
                className="block rounded-[18px] bg-white px-4 py-3 text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        <footer
          className="mt-6 rounded-[24px] border px-6 py-5 md:flex md:items-center md:justify-between"
          style={{
            borderColor: palette.line,
            background: "#fffaf4",
            color: palette.muted,
          }}
        >
          <div className="text-sm">
            © 2026 ExamProof. Verifiable assessment infrastructure.
          </div>
          <div className="mt-2 text-sm md:mt-0">
            Powered by{" "}
            <span style={{ color: palette.text, fontWeight: 600 }}>
              GenLayer Intelligent Contract
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}