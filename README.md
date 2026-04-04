# ExamProof

**ExamProof** is a verifiable assessment platform for high-stakes online exams such as recruitment tests, grant screening, admissions assessments, scholarship evaluations, and other timed selection workflows where trust, structure, and reviewability matter.

## Live App

**Production URL:** https://examproof.vercel.app

---

## Overview

Most online exam platforms focus only on delivering questions and collecting answers. ExamProof goes further by giving recruiters and institutions a more structured and reviewable workflow for:

- creating timed assessments
- managing candidate access
- collecting submissions
- reviewing candidate answers
- finalizing results
- reopening old exams
- tracking important assessment events through a GenLayer-backed processing layer

ExamProof is designed for serious use cases where assessment integrity matters more than basic form collection.

---

## What Problem ExamProof Solves

Online assessments often suffer from a trust gap.

Many tools can deliver questions, but they do not provide a strong and traceable workflow for:

- controlled candidate access
- timed exam execution
- submission integrity
- result finalization
- later review of outcomes

ExamProof solves this by giving recruiters a complete exam lifecycle system with a verifiable backend process for critical actions.

---

## Core Features

### Recruiter Features

- Sign up and sign in securely
- Create exams with:
  - title
  - description
  - start time
  - end time
- Add questions
- Add candidates
- Share exam access through:
  - direct candidate link
  - UUID-based exam access
- Reopen previously created exams
- Review candidate submissions
- View candidate submitted answers
- View finalized scores and result status

### Candidate Features

- Join exams through:
  - direct recruiter-shared link
  - manual UUID entry
- Enter candidate details
- Take the exam
- Submit answers

### Result and Verification Features

- Queue critical assessment actions as blockchain jobs
- Process jobs privately through a worker
- Track exam registration
- Commit submission hashes
- Finalize result states
- Review blockchain job status

---

## How It Works

### 1. Recruiter Creates an Exam

A recruiter signs in and creates a new assessment by entering the exam metadata:

- title
- description
- start time
- end time

Once created, the exam receives a unique identifier and becomes the container for questions, candidate records, and submission flow.

### 2. Recruiter Adds Questions and Candidates

The recruiter builds the exam by:

- adding questions
- adding candidate records
- copying a candidate access link or UUID

### 3. Candidate Joins and Submits

Candidates enter through a separate candidate path.

They can either:

- paste the exam UUID manually
- or open a recruiter-shared candidate link

After entering their details, they take the assessment and submit their answers.

### 4. Submission Is Stored and Queued

Submissions are stored in the application database, and a submission hash is generated.

The app then creates a queued blockchain job for critical actions such as:

- exam registration
- submission commitment
- result finalization

### 5. Private Worker Processes Jobs

Instead of exposing sensitive signing logic in the frontend, ExamProof uses a **private worker** to process queued jobs securely.

This gives the platform a safer architecture for production-style use.

### 6. Recruiter Reviews and Finalizes Results

Recruiters and admins can:

- inspect submissions
- review submitted answers
- queue finalization
- view objective score
- view subjective score
- view total score
- view result status

### 7. Reopen Old Exams

Recruiters can return to past exams from the exams list without creating a new exam every time.

---

## GenLayer Integration

ExamProof uses **GenLayer Intelligent Contracts** as its trust layer for critical assessment events.

Instead of using blockchain as a cosmetic add-on, the platform routes important workflow transitions through a GenLayer-backed processing flow.

### GenLayer-backed actions include:

- **Exam registration**
  - when a recruiter creates an exam, the system can register that exam state through a queued blockchain job

- **Submission commitment**
  - when a candidate submits answers, the system generates a submission hash and commits that state through the job flow

- **Result finalization**
  - when a result is finalized, the final scoring state can be processed through the GenLayer-backed worker flow

### Why this matters

This architecture improves trust in how critical exam events are handled.

The public app remains the operational interface, while the GenLayer-backed worker and contract layer strengthen integrity around:

- exam state changes
- submission commitment
- final result state

---

## Architecture

ExamProof is built as a multi-part system:

### Frontend / App Layer
- **Next.js**
- recruiter UI
- candidate UI
- documentation page
- dashboard and exam management pages

### Data Layer
- **Supabase**
- authentication
- database
- candidate records
- exam records
- submissions
- blockchain job queue

### Verification / Job Layer
- **Private worker**
- processes queued blockchain jobs
- keeps sensitive credentials out of the frontend

### Trust Layer
- **GenLayer Intelligent Contract**
- used for verifiable assessment state transitions

---

## Tech Stack

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
- **GenLayer**
- **Vercel** for frontend deployment
- **Railway** or similar service for worker deployment

---

## Main User Flows

## Recruiter Flow

1. Open landing page
2. Sign in or create account
3. Create exam
4. Add questions
5. Add candidates
6. Share candidate link or UUID
7. Review submissions
8. Finalize results
9. Reopen old exams later

## Candidate Flow

1. Open landing page or recruiter-shared link
2. Go to candidate access page
3. Enter UUID or use direct link
4. Enter candidate details
5. Answer questions
6. Submit exam

---

## Key Pages

- `/` — Landing page
- `/auth/sign-in` — Recruiter authentication
- `/recruiter/create-exam` — Exam registration page
- `/recruiter/exams/[examId]` — Exam details and management
- `/candidate` — Candidate entry page
- `/candidate/[examId]` — Candidate exam page
- `/dashboard` — Recruiter dashboard
- `/dashboard/exams` — Reopen past exams
- `/dashboard/jobs` — Blockchain jobs view
- `/dashboard/results` — Result page
- `/admin/finalize` — Finalization page
- `/docs` — Platform guide

---

## Environment Variables

## Frontend App

Create an `.env.local` file inside `app-web`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key