# ExamProof

**ExamProof** is a GenLayer-powered assessment platform for high-stakes evaluation workflows such as recruitment screening, grant reviews, fellowship selection, admissions assessments, scholarships, and other exam processes where **submission integrity, trusted grading, and defensible final results** matter.

ExamProof is built around a **GenLayer Intelligent Contract** rather than a traditional off-chain exam backend. Recruiters manage exams from their wallet, candidates submit **gaslessly** through a relayer, and the contract acts as the source of truth for exam state, submission validation, grading, and finalization.

## Live URL

**Production App:** `https://examproof.vercel.app`

---

## Overview

Most online exam platforms rely entirely on off-chain infrastructure for candidate registration, submission handling, grading, and result storage. That may be acceptable for simple quizzes, but it becomes weaker in workflows where the outcome affects hiring, funding, admissions, or other serious decisions.

ExamProof addresses that by moving the most important parts of the assessment lifecycle into a **GenLayer Intelligent Contract**. This makes the platform more suitable for environments where trust, traceability, and finality matter.

At a high level, ExamProof provides:

- recruiter-controlled exam creation
- gasless candidate submissions
- contract-backed grading workflows
- verifiable result finalization
- a stronger trust model for online assessments

---

## Core Idea

The central idea behind ExamProof is simple:

> keep the critical assessment logic inside a GenLayer Intelligent Contract.

The contract is responsible for:

- exam metadata
- lifecycle state
- question storage
- candidate registration
- submission budget control
- gasless submission authorization
- objective grading
- subjective grading flow
- final result state

This means the blockchain is not just an audit layer. It is part of the actual product logic.

---

# Key Features

## Recruiter Wallet Control

Recruiters connect an EVM wallet and use it to:

- deploy a new exam contract
- add questions
- register candidates
- fund submission budget
- publish and open exams
- grade submissions
- finalize results

The recruiter wallet is the operational owner of the exam workflow.

## Gasless Candidate Submission

Candidates do not need to connect a wallet.

Instead, each candidate receives an invite flow containing:

- exam contract address
- candidate ID
- access token

Candidates complete the exam and submit through a relay route, while the relayer wallet pays gas. The contract still decides whether the submission is valid.

## Contract-Backed Exam State

Important exam state is stored in the GenLayer contract, including:

- exam ID
- title
- description
- start and end time
- exam status
- submission budget
- submission fee per candidate
- questions
- registered candidates
- submissions
- scores
- grading reasoning
- final result status

## Sponsored Submission Budget

Recruiters sponsor candidate submissions by funding a submission budget for the exam.

This makes gasless candidate participation possible while keeping a controlled model for resource usage.

## Objective and Subjective Grading

ExamProof supports both:

### Objective grading
Used for questions with clear answers, such as MCQs.

### Subjective grading
Used for essays, short responses, and reasoning-based questions.

Objective grading is computed directly through contract logic. Subjective grading is processed through **GenLayer reasoning** and then written back into contract-backed state.

## Invite-Based Candidate Access

Candidates access exams through recruiter-generated invite links.

Each invite contains the information needed for a gasless submission flow without forcing candidates to handle blockchain wallet UX directly.

## Recruiter Workflow Tools

The recruiter interface currently supports:

- adding questions
- registering candidates
- exporting invite records
- funding submission budget
- refreshing exam state
- grading individual submissions
- grading submissions in bulk
- finalizing results individually
- finalizing graded results in bulk

---

# How ExamProof Works

## 1. Recruiter Connects Wallet

The recruiter connects a supported EVM wallet such as:

- MetaMask
- Rabby
- OKX Wallet

This wallet is used for recruiter-side exam management transactions.

## 2. Recruiter Deploys an Exam Contract

The recruiter creates a new exam by deploying the `ExamProofIC` contract on GenLayer.

The contract is initialized with:

- exam ID
- title
- description
- start time
- end time
- relayer address
- submission fee per candidate

## 3. Recruiter Adds Questions

Questions are stored in the contract.

Supported question types currently include:

- `mcq`
- `short_answer`
- `essay`

Each question may include:

- prompt
- type
- points
- options
- correct answer
- rubric

## 4. Recruiter Registers Candidates

Each candidate is registered with:

- candidate ID
- full name
- email
- secret hash

The recruiter side generates a raw invite token, hashes it, and stores only the hash in the contract.

This means the recruiter must preserve the raw token, because it cannot be recovered from contract state later.

## 5. Recruiter Funds Submission Budget

Before candidates can submit gaslessly, the recruiter must fund the submission budget.

If the budget is not funded, candidate submissions are rejected.

## 6. Recruiter Publishes and Opens the Exam

The recruiter moves the exam through lifecycle states such as:

- `draft`
- `scheduled`
- `open`
- `closed`
- `graded`
- `finalized`

Candidates can only submit while the exam is **open**.

## 7. Candidate Opens Invite Link

The candidate opens the invite link and loads:

- exam details
- question list

from contract state.

The candidate answers the exam without connecting a wallet.

## 8. Relay Submits Onchain

The relay route sends `submit_exam_gasless` to the GenLayer contract using the relayer wallet.

The contract verifies:

- the exam is open
- the candidate exists
- the candidate is active
- the candidate has not already submitted
- the submission budget is sufficient
- the submitted token matches the stored secret hash

If valid, the submission is recorded.

## 9. Contract Handles Grading

Objective grading is computed from submitted answers.

Subjective grading is triggered through GenLayer reasoning and stored in the submission record.

## 10. Recruiter Finalizes Results

After grading, the recruiter finalizes the result state for the candidate.

Final result data includes:

- objective score
- subjective score
- total score
- grading reasoning
- result status

---

# What Runs on GenLayer

The following core parts of ExamProof are GenLayer-backed:

- exam creation
- contract ownership
- question storage
- candidate registration
- relayer authorization
- submission budget tracking
- gasless submission validation
- objective grading
- subjective grading flow
- submission records
- final result state

---

# What Makes ExamProof Work

ExamProof combines four main layers:

## 1. GenLayer Intelligent Contract

The `ExamProofIC` contract defines:

- storage
- permissions
- lifecycle rules
- candidate verification
- grading flow
- final state transitions

## 2. Frontend Application

The frontend provides the recruiter and candidate interfaces for:

- exam creation
- question entry
- candidate management
- invite handling
- candidate access
- submission
- grading and finalization

## 3. Relayer Service

The relay route allows candidates to submit without a wallet.

The relayer:

- signs and sends the candidate transaction
- pays gas
- returns transaction outcome
- verifies onchain state when needed

The relayer does **not** decide submission validity. The contract does.

## 4. Invite Token Model

Candidate access is protected by a token-based model:

- raw token generated off-chain
- hash stored onchain
- candidate submits raw token
- contract verifies the hash

This supports a gasless candidate experience without exposing the stored credential directly in contract state.

---

# Architecture

## Frontend

- Next.js App Router frontend
- recruiter pages
- candidate pages
- relay API route
- docs page
- landing page

## Contract Layer

- `ExamProofIC` GenLayer Intelligent Contract
- direct tests
- integration tests

## Relay Layer

- relayer wallet private key stored in server environment variables
- relay endpoint submits candidate transactions to GenLayer

## Auth and Session Helpers

Some authentication-related pieces may still exist for dashboard or session handling, but **exam logic itself is no longer driven by Supabase tables**.

ExamProof is now **GenLayer-first**, with the contract as the source of truth for exam workflows.

---

# Project Structure

```text
app-web/
  public/
    contracts/
      examproof_ic.py
  src/
    app/
      page.tsx
      docs/page.tsx
      candidate/page.tsx
      candidate/[examId]/page.tsx
      recruiter/create-exam/page.tsx
      recruiter/exams/[examId]/page.tsx
      api/relay/submit/route.ts
    components/
      ExamProofLandingPage.tsx
      RecruiterWalletConnect.tsx
      QuestionEditor.tsx
      CandidateListEditor.tsx
    lib/
      genlayer.ts

contracts/
  examproof_ic.py

tests/
  direct/
    test_examproof_ic.py
  integration/
    test_examproof_ic_gasless.py
    test_examproof_ic_subjective.py