# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class ExamProof(gl.Contract):
    owner: Address
    exam_exists: TreeMap[str, bool]
    exam_metadata_hash: TreeMap[str, str]
    exam_start_time: TreeMap[str, str]
    exam_end_time: TreeMap[str, str]
    submission_hashes: TreeMap[str, str]
    objective_scores: TreeMap[str, str]
    subjective_scores: TreeMap[str, str]
    total_scores: TreeMap[str, str]
    result_statuses: TreeMap[str, str]

    def __init__(self):
        self.owner = gl.message.sender_address

    @gl.public.write
    def create_exam(
        self,
        exam_id: str,
        metadata_hash: str,
        start_time: str,
        end_time: str,
    ) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")

        if self.exam_exists.get(exam_id, False):
            raise gl.UserError("Exam already exists")

        self.exam_exists[exam_id] = True
        self.exam_metadata_hash[exam_id] = metadata_hash
        self.exam_start_time[exam_id] = start_time
        self.exam_end_time[exam_id] = end_time

    @gl.public.view
    def get_exam(self, exam_id: str) -> dict:
        if not self.exam_exists.get(exam_id, False):
            raise gl.UserError("Exam not found")

        return {
            "exam_id": exam_id,
            "metadata_hash": self.exam_metadata_hash.get(exam_id, ""),
            "start_time": self.exam_start_time.get(exam_id, ""),
            "end_time": self.exam_end_time.get(exam_id, ""),
        }

    @gl.public.write
    def commit_submission(
        self,
        exam_id: str,
        candidate_id: str,
        submission_hash: str,
    ) -> None:
        if not self.exam_exists.get(exam_id, False):
            raise gl.UserError("Exam not found")

        submission_key = self._submission_key(exam_id, candidate_id)

        if self.submission_hashes.get(submission_key, "") != "":
            raise gl.vm.UserError("Submission already committed")

        self.submission_hashes[submission_key] = submission_hash
        self.result_statuses[submission_key] = "submitted"

    @gl.public.view
    def get_submission(self, exam_id: str, candidate_id: str) -> dict:
        submission_key = self._submission_key(exam_id, candidate_id)

        return {
            "exam_id": exam_id,
            "candidate_id": candidate_id,
            "submission_hash": self.submission_hashes.get(submission_key, ""),
            "result_status": self.result_statuses.get(submission_key, ""),
            "objective_score": self.objective_scores.get(submission_key, ""),
            "subjective_score": self.subjective_scores.get(submission_key, ""),
            "total_score": self.total_scores.get(submission_key, ""),
        }

    @gl.public.write
    def finalize_score(
        self,
        exam_id: str,
        candidate_id: str,
        objective_score: str,
        subjective_score: str,
        total_score: str,
    ) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")

        if not self.exam_exists.get(exam_id, False):
            raise gl.UserError("Exam not found")

        submission_key = self._submission_key(exam_id, candidate_id)

        if self.submission_hashes.get(submission_key, "") == "":
            raise gl.vm.UserError("Submission not found")

        self.objective_scores[submission_key] = objective_score
        self.subjective_scores[submission_key] = subjective_score
        self.total_scores[submission_key] = total_score
        self.result_statuses[submission_key] = "finalized"

    @gl.public.view
    def get_result(self, exam_id: str, candidate_id: str) -> dict:
        submission_key = self._submission_key(exam_id, candidate_id)

        return {
            "exam_id": exam_id,
            "candidate_id": candidate_id,
            "objective_score": self.objective_scores.get(submission_key, ""),
            "subjective_score": self.subjective_scores.get(submission_key, ""),
            "total_score": self.total_scores.get(submission_key, ""),
            "result_status": self.result_statuses.get(submission_key, ""),
        }

    def _submission_key(self, exam_id: str, candidate_id: str) -> str:
        return f"{exam_id}:{candidate_id}"