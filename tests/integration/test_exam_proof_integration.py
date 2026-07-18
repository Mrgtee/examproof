import hashlib
import json

from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded


def sha(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def auth_field(value: str) -> str:
    return f"{len(value.encode())}:{value}"


def submission_authorization(
    exam_id: str,
    candidate_id: str,
    candidate_secret: str,
    answers_json: str,
    submitted_at: str,
) -> str:
    payload = "\n".join(
        [
            "ExamProofSubmission:v1",
            "exam_id:" + auth_field(exam_id),
            "candidate_id:" + auth_field(candidate_id),
            "submitted_at:" + auth_field(submitted_at),
            "answers_json:" + auth_field(answers_json),
        ]
    )
    return sha(payload + "\nsecret_hash:" + auth_field(sha(candidate_secret)))


def test_exam_lifecycle_integration():
    factory = get_contract_factory("ExamProofIC")
    recruiter = get_default_account()
    relayer_hex = recruiter.address

    contract = factory.deploy(
        args=[
            "exam-int-001",
            "Integration Test",
            "Current ExamProofIC lifecycle smoke test",
            "2026-04-03T09:00:00Z",
            "2026-04-03T10:30:00Z",
            relayer_hex,
            1,
        ],
        account=recruiter,
    )

    tx = contract.add_question(
        args=[
            "What is 2 + 2?",
            "mcq",
            5,
            ["2", "3", "4", "5"],
            "4",
            "",
        ]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.register_candidate(
        args=[
            "candidate-int-001",
            "Integration Candidate",
            "candidate@example.com",
            sha("candidate-secret-int-001"),
        ]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.fund_submission_budget(args=[1]).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.publish_exam().transact()
    assert tx_execution_succeeded(tx)

    tx = contract.open_exam().transact()
    assert tx_execution_succeeded(tx)

    answers_json = json.dumps({"0": "4"}, indent=2)
    submitted_at = "2026-04-03T09:30:00Z"
    authorization = submission_authorization(
        "exam-int-001",
        "candidate-int-001",
        "candidate-secret-int-001",
        answers_json,
        submitted_at,
    )

    tx = contract.submit_exam_gasless(
        args=[
            "candidate-int-001",
            answers_json,
            submitted_at,
            authorization,
        ]
    ).transact()
    assert tx_execution_succeeded(tx)

    exam = contract.get_exam().call()
    result = contract.get_result(args=["candidate-int-001"]).call()
    candidates = contract.get_candidates().call()

    assert exam["exam_id"] == "exam-int-001"
    assert exam["status"] == "open"
    assert exam["submission_budget"] == 0
    assert result["objective_score"] == 5
    assert result["subjective_score"] == 0
    assert result["total_score"] == 5
    assert result["result_status"] == "submitted"
    assert result["submission_authorization"] == authorization
    assert candidates[0]["has_submitted"] is True
