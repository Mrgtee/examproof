from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded
import hashlib


def sha(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def test_gasless_submission_live():
    factory = get_contract_factory("ExamProofIC")
    recruiter = get_default_account()

    # Live test uses recruiter as relayer too.
    relayer_hex = recruiter.address

    contract = factory.deploy(
        args=[
            "EXAM-GASLESS-001",
            "Recruitment Test",
            "Backend engineer screening exam",
            "2026-04-10T09:00:00Z",
            "2026-04-10T11:00:00Z",
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

    tx = contract.add_question(
        args=[
            "Explain why assessment integrity matters.",
            "essay",
            10,
            [],
            "",
            "Reward clarity, fairness reasoning, trust implications, and relevance to serious evaluation workflows.",
        ]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.register_candidate(
        args=[
            "cand-001",
            "Alice Doe",
            "alice@example.com",
            sha("cand-secret-001"),
        ]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.fund_submission_budget(
        args=[2]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.publish_exam().transact()
    assert tx_execution_succeeded(tx)

    tx = contract.open_exam().transact()
    assert tx_execution_succeeded(tx)

    tx = contract.submit_exam_gasless(
        args=[
            "cand-001",
            "cand-secret-001",
            '{"0":"4","1":"Assessment integrity matters because it protects fairness, improves trust, strengthens defensibility, and helps institutions make decisions they can justify."}',
            "2026-04-10T09:30:00Z",
        ]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.grade_subjective_submission(
        args=["cand-001"]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.finalize_result(
        args=["cand-001", "finalized"]
    ).transact()
    assert tx_execution_succeeded(tx)

    exam = contract.get_exam().call()
    result = contract.get_result(args=["cand-001"]).call()
    candidates = contract.get_candidates().call()

    assert exam["submission_budget"] == 1
    assert result["objective_score"] == 5
    assert result["subjective_score"] >= 0
    assert result["total_score"] >= 5
    assert result["result_status"] == "finalized"
    assert len(result["grading_reasoning"]) > 5
    assert candidates[0]["has_submitted"] is True