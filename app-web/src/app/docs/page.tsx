import Link from "next/link";

const sections = [
  {
    title: "What ExamProof is",
    body: [
      "ExamProof is a contract-first assessment platform built on GenLayer.",
      "It is designed for recruitment tests, grant screening, admissions exams, and other serious evaluation workflows where integrity, traceability, and defensible grading matter.",
      "Instead of storing the core exam logic in a normal off-chain database, ExamProof keeps the important workflow inside a GenLayer Intelligent Contract.",
    ],
  },
  {
    title: "What makes it different",
    body: [
      "The exam itself is owned and controlled by a GenLayer contract.",
      "Recruiters use their wallet to create and manage exams.",
      "Candidates do not need a wallet and do not pay gas.",
      "Candidate submissions are sent through a relayer, but the contract still decides whether a submission is valid.",
      "Objective grading and subjective grading both happen through the contract flow.",
    ],
  },
  {
    title: "How the architecture works",
    body: [
      "Recruiter wallet: creates the exam contract, manages the exam, funds submission budget, and pays for recruiter-side transactions.",
      "GenLayer Intelligent Contract: stores exam state, questions, candidates, submission budget, submissions, grading state, and final results.",
      "Relayer: sends gasless candidate submissions to the contract. It does not decide outcomes.",
      "Candidate: opens the invite link, answers questions, and submits without connecting a wallet.",
    ],
  },
  {
    title: "What happens on GenLayer",
    body: [
      "Exam creation",
      "Question storage",
      "Candidate registration",
      "Submission budget tracking",
      "Gasless submission validation",
      "MCQ grading",
      "Subjective grading with GenLayer reasoning",
      "Final result storage and status updates",
    ],
  },
  {
    title: "Recruiter flow",
    body: [
      "1. Connect a wallet on the recruiter side.",
      "2. Deploy a new ExamProof exam contract.",
      "3. Add questions to the contract.",
      "4. Register candidates.",
      "5. Fund the submission budget so candidates can submit gaslessly.",
      "6. Share each candidate’s invite link.",
      "7. Publish and open the exam.",
      "8. Review submissions.",
      "9. Grade subjective answers.",
      "10. Finalize results.",
    ],
  },
  {
    title: "Candidate flow",
    body: [
      "1. Open the invite link from the recruiter.",
      "2. The link contains the exam contract address, candidate ID, and access token.",
      "3. Load the exam questions directly from contract state.",
      "4. Fill all answers.",
      "5. Submit gaslessly through the relay endpoint.",
      "6. The contract verifies the candidate, token, budget, and exam status before accepting the submission.",
    ],
  },
  {
    title: "How gas works",
    body: [
      "Recruiters use their own wallet for recruiter-side actions like exam creation, adding questions, registering candidates, funding budget, grading, and finalization.",
      "Candidates do not connect a wallet and do not pay gas.",
      "A relayer wallet submits candidate transactions onchain.",
      "The recruiter-funded submission budget inside each exam contract controls how many gasless candidate submissions are allowed.",
    ],
  },
  {
    title: "How candidate access works",
    body: [
      "Each candidate is registered with a candidate ID and a secret hash.",
      "The recruiter gets a raw invite token only once at candidate registration time.",
      "That raw token is used in the invite link shared with the candidate.",
      "The contract stores only the hash, not the readable token.",
      "This means the recruiter should export or save invite links after generating them.",
    ],
  },
  {
    title: "How grading works",
    body: [
      "MCQ questions are graded directly from the submitted answers inside the contract.",
      "Essay and subjective responses are graded through GenLayer non-deterministic reasoning.",
      "The contract validates the returned grading structure before storing the result.",
      "Final scores include objective score, subjective score, total score, and grading reasoning.",
    ],
  },
  {
    title: "How to use ExamProof step by step",
    body: [
      "Step 1: Open the recruiter create-exam page.",
      "Step 2: Connect the recruiter wallet.",
      "Step 3: Fill exam title, description, start time, end time, and deploy the exam contract.",
      "Step 4: Open the recruiter exam page for the deployed contract.",
      "Step 5: Add questions.",
      "Step 6: Add candidates and save or export their invite links.",
      "Step 7: Fund submission budget.",
      "Step 8: Publish the exam.",
      "Step 9: Open the exam.",
      "Step 10: Candidate opens invite link and submits.",
      "Step 11: Recruiter refreshes submissions.",
      "Step 12: Recruiter grades responses.",
      "Step 13: Recruiter finalizes results.",
    ],
  },
  {
    title: "Important operational notes",
    body: [
      "The recruiter should export invite links after registration because the raw token is not recoverable from contract state later.",
      "Candidates cannot submit unless the exam is open and the submission budget is funded.",
    ],
  },
  {
    title: "Current product status",
    body: [
      "Recruiter wallet deployment is working.",
      "GenLayer contract-backed exam management is working.",
      "Gasless candidate submission is working through the relay.",
      "Contract-based grading and finalization are working.",
      "The app is now centered on GenLayer Intelligent Contract logic rather than a normal off-chain exam database.",
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
              Documentation
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              ExamProof guide
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#7f6a5a]">
              Learn what ExamProof is, how its GenLayer architecture works, and
              the exact steps recruiters and candidates should follow.
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
              href="/recruiter/create-exam"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Create exam
            </Link>
            <Link
              href="/candidate"
              className="rounded-full border border-[#e7dcd1] px-4 py-2 text-sm"
            >
              Candidate access
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

              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#7f6a5a]">
                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}