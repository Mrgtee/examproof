# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
import typing
import hashlib


@allow_storage
@dataclass
class Question:
    prompt: str
    question_type: str
    points: i32
    options: DynArray[str]
    correct_answer: str
    rubric: str


@allow_storage
@dataclass
class Candidate:
    candidate_id: str
    full_name: str
    email: str
    secret_hash: str
    is_active: bool
    has_submitted: bool


@allow_storage
@dataclass
class Submission:
    candidate_id: str
    answers_json: str
    objective_score: i32
    subjective_score: i32
    total_score: i32
    result_status: str
    submitted_at: str
    grading_reasoning: str


class ExamProofIC(gl.Contract):
    owner: Address
    relayer: str
    exam_id: str
    title: str
    description: str
    start_time: str
    end_time: str
    status: str
    submission_budget: i32
    submission_fee_per_candidate: i32
    questions: DynArray[Question]
    candidates: DynArray[Candidate]
    submissions: DynArray[Submission]

    def __init__(
        self,
        exam_id: str,
        title: str,
        description: str,
        start_time: str,
        end_time: str,
        relayer: str,
        submission_fee_per_candidate: int,
    ):
        self.owner = gl.message.sender_address
        self.relayer = relayer.lower()
        self.exam_id = exam_id
        self.title = title
        self.description = description
        self.start_time = start_time
        self.end_time = end_time
        self.status = "draft"
        self.submission_budget = i32(0)
        self.submission_fee_per_candidate = i32(submission_fee_per_candidate)
        self.questions = []
        self.candidates = []
        self.submissions = []

    def _sender_hex(self) -> str:
        return ("0x" + gl.message.sender_address.as_bytes.hex()).lower()

    def _only_owner(self):
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")

    def _only_relayer(self):
        if self._sender_hex() != self.relayer:
            raise gl.vm.UserError("Only relayer")

    def _find_candidate_index(self, candidate_id: str) -> i32:
        for i in range(len(self.candidates)):
            if self.candidates[i].candidate_id == candidate_id:
                return i
        return -1

    def _find_submission_index(self, candidate_id: str) -> i32:
        for i in range(len(self.submissions)):
            if self.submissions[i].candidate_id == candidate_id:
                return i
        return -1

    def _extract_answer_value(self, answers_json: str, answer_key: str) -> str:
        needle = '"' + answer_key + '":"'
        start = answers_json.find(needle)
        if start == -1:
            return ""

        value_start = start + len(needle)
        value_end = answers_json.find('"', value_start)
        if value_end == -1:
            return ""

        return answers_json[value_start:value_end]

    def _grade_objective_from_json(self, answers_json: str) -> i32:
        total = i32(0)

        for i in range(len(self.questions)):
            q = self.questions[i]
            if q.question_type != "mcq":
                continue

            provided = self._extract_answer_value(answers_json, str(i))
            if provided == q.correct_answer:
                total += q.points

        return total

    def _hash_secret(self, secret: str) -> str:
        return hashlib.sha256(secret.encode()).hexdigest()

    @gl.public.write
    def set_relayer(self, relayer: str):
        self._only_owner()
        self.relayer = relayer.lower()

    @gl.public.write
    def fund_submission_budget(self, units: int):
        self._only_owner()
        if units <= 0:
            raise gl.vm.UserError("Units must be greater than zero")
        self.submission_budget += i32(units)

    @gl.public.write
    def publish_exam(self):
        self._only_owner()
        if self.status != "draft":
            raise gl.vm.UserError("Exam can only be published from draft")
        self.status = "scheduled"

    @gl.public.write
    def open_exam(self):
        self._only_owner()
        if self.status not in ["draft", "scheduled"]:
            raise gl.vm.UserError("Exam cannot be opened from current state")
        self.status = "open"

    @gl.public.write
    def close_exam(self):
        self._only_owner()
        if self.status != "open":
            raise gl.vm.UserError("Exam is not open")
        self.status = "closed"

    @gl.public.write
    def add_question(
        self,
        prompt: str,
        question_type: str,
        points: int,
        options: DynArray[str],
        correct_answer: str,
        rubric: str,
    ):
        self._only_owner()

        if self.status not in ["draft", "scheduled"]:
            raise gl.vm.UserError("Questions can only be added before exam opens")

        if question_type not in ["mcq", "short_answer", "essay"]:
            raise gl.vm.UserError("Invalid question type")

        if points <= 0:
            raise gl.vm.UserError("Points must be greater than zero")

        self.questions.append(
            Question(
                prompt=prompt,
                question_type=question_type,
                points=i32(points),
                options=options,
                correct_answer=correct_answer,
                rubric=rubric,
            )
        )

    @gl.public.write
    def register_candidate(
        self,
        candidate_id: str,
        full_name: str,
        email: str,
        secret_hash: str,
    ):
        self._only_owner()

        if self._find_candidate_index(candidate_id) != -1:
            raise gl.vm.UserError("Candidate already registered")

        self.candidates.append(
            Candidate(
                candidate_id=candidate_id,
                full_name=full_name,
                email=email,
                secret_hash=secret_hash,
                is_active=True,
                has_submitted=False,
            )
        )

    @gl.public.write
    def submit_exam_gasless(
        self,
        candidate_id: str,
        candidate_secret: str,
        answers_json: str,
        submitted_at: str,
    ):
        self._only_relayer()

        if self.status != "open":
            raise gl.vm.UserError("Exam is not open")

        candidate_index = self._find_candidate_index(candidate_id)
        if candidate_index == -1:
            raise gl.vm.UserError("Candidate not registered")

        candidate = self.candidates[candidate_index]

        if not candidate.is_active:
            raise gl.vm.UserError("Candidate is inactive")

        if candidate.has_submitted:
            raise gl.vm.UserError("Candidate already submitted")

        if self._find_submission_index(candidate_id) != -1:
            raise gl.vm.UserError("Submission already exists")

        if self.submission_budget < self.submission_fee_per_candidate:
            raise gl.vm.UserError("Insufficient submission budget")

        if self._hash_secret(candidate_secret) != candidate.secret_hash:
            raise gl.vm.UserError("Invalid candidate secret")

        objective_score = self._grade_objective_from_json(answers_json)

        self.submissions.append(
            Submission(
                candidate_id=candidate_id,
                answers_json=answers_json,
                objective_score=objective_score,
                subjective_score=i32(0),
                total_score=objective_score,
                result_status="submitted",
                submitted_at=submitted_at,
                grading_reasoning="Pending subjective grading",
            )
        )

        self.candidates[candidate_index] = Candidate(
            candidate_id=candidate.candidate_id,
            full_name=candidate.full_name,
            email=candidate.email,
            secret_hash=candidate.secret_hash,
            is_active=candidate.is_active,
            has_submitted=True,
        )

        self.submission_budget -= self.submission_fee_per_candidate

    @gl.public.write
    def grade_subjective_submission(self, candidate_id: str):
        self._only_owner()

        submission_index = self._find_submission_index(candidate_id)
        if submission_index == -1:
            raise gl.vm.UserError("Submission not found")

        submission = self.submissions[submission_index]

        total_subjective = i32(0)
        reasoning_parts: DynArray[str] = []

        for i in range(len(self.questions)):
            q = self.questions[i]

            if q.question_type == "mcq":
                continue

            answer = self._extract_answer_value(submission.answers_json, str(i))

            if answer == "":
                reasoning_parts.append(
                    "Question " + str(i) + ": no answer provided, score 0"
                )
                continue

            max_points = int(q.points)

            prompt = f"""
You are grading a candidate response for a high-stakes exam.

Question:
{q.prompt}

Rubric:
{q.rubric}

Candidate answer:
{answer}

Maximum points:
{max_points}

Return ONLY valid JSON with this exact structure:
{{
  "score": <integer from 0 to {max_points}>,
  "reasoning": "<brief justification>"
}}
""".strip()

            def leader_fn():
                return gl.nondet.exec_prompt(prompt, response_format="json")

            def validator_fn(leader_result) -> bool:
                if not isinstance(leader_result, gl.vm.Return):
                    return False

                data = leader_result.calldata
                if not isinstance(data, dict):
                    return False

                score = data.get("score")
                reasoning = data.get("reasoning")

                if not isinstance(score, int):
                    return False

                if score < 0 or score > max_points:
                    return False

                if not isinstance(reasoning, str):
                    return False

                if len(reasoning.strip()) < 5:
                    return False

                return True

            grade_data = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

            awarded = i32(grade_data["score"])
            total_subjective += awarded

            reasoning_parts.append(
                "Question "
                + str(i)
                + ": score "
                + str(grade_data["score"])
                + "/"
                + str(max_points)
                + " - "
                + grade_data["reasoning"]
            )

        total_score = submission.objective_score + total_subjective
        reasoning_text = " | ".join(reasoning_parts)

        self.submissions[submission_index] = Submission(
            candidate_id=submission.candidate_id,
            answers_json=submission.answers_json,
            objective_score=submission.objective_score,
            subjective_score=total_subjective,
            total_score=total_score,
            result_status="graded",
            submitted_at=submission.submitted_at,
            grading_reasoning=reasoning_text,
        )

        self.status = "graded"

    @gl.public.write
    def finalize_result(
        self,
        candidate_id: str,
        result_status: str,
    ):
        self._only_owner()

        submission_index = self._find_submission_index(candidate_id)
        if submission_index == -1:
            raise gl.vm.UserError("Submission not found")

        old = self.submissions[submission_index]

        self.submissions[submission_index] = Submission(
            candidate_id=old.candidate_id,
            answers_json=old.answers_json,
            objective_score=old.objective_score,
            subjective_score=old.subjective_score,
            total_score=old.total_score,
            result_status=result_status,
            submitted_at=old.submitted_at,
            grading_reasoning=old.grading_reasoning,
        )

        self.status = "finalized"

    @gl.public.view
    def get_exam(self) -> TreeMap[str, typing.Any]:
        return {
            "owner": str(self.owner),
            "relayer": self.relayer,
            "exam_id": self.exam_id,
            "title": self.title,
            "description": self.description,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "status": self.status,
            "submission_budget": self.submission_budget,
            "submission_fee_per_candidate": self.submission_fee_per_candidate,
            "question_count": len(self.questions),
            "candidate_count": len(self.candidates),
            "submission_count": len(self.submissions),
        }

    @gl.public.view
    def get_questions(self) -> DynArray[TreeMap[str, typing.Any]]:
        result: DynArray[TreeMap[str, typing.Any]] = []
        for q in self.questions:
            result.append(
                {
                    "prompt": q.prompt,
                    "question_type": q.question_type,
                    "points": q.points,
                    "options": q.options,
                    "rubric": q.rubric,
                }
            )
        return result

    @gl.public.view
    def get_candidates(self) -> DynArray[TreeMap[str, typing.Any]]:
        result: DynArray[TreeMap[str, typing.Any]] = []
        for c in self.candidates:
            result.append(
                {
                    "candidate_id": c.candidate_id,
                    "full_name": c.full_name,
                    "email": c.email,
                    "is_active": c.is_active,
                    "has_submitted": c.has_submitted,
                }
            )
        return result

    @gl.public.view
    def get_submissions(self) -> DynArray[TreeMap[str, typing.Any]]:
        result: DynArray[TreeMap[str, typing.Any]] = []
        for s in self.submissions:
            result.append(
                {
                    "candidate_id": s.candidate_id,
                    "answers_json": s.answers_json,
                    "objective_score": s.objective_score,
                    "subjective_score": s.subjective_score,
                    "total_score": s.total_score,
                    "result_status": s.result_status,
                    "submitted_at": s.submitted_at,
                    "grading_reasoning": s.grading_reasoning,
                }
            )
        return result

    @gl.public.view
    def get_result(self, candidate_id: str) -> TreeMap[str, typing.Any]:
        idx = self._find_submission_index(candidate_id)
        if idx == -1:
            raise gl.vm.UserError("Submission not found")

        s = self.submissions[idx]
        return {
            "candidate_id": s.candidate_id,
            "objective_score": s.objective_score,
            "subjective_score": s.subjective_score,
            "total_score": s.total_score,
            "result_status": s.result_status,
            "submitted_at": s.submitted_at,
            "grading_reasoning": s.grading_reasoning,
        }