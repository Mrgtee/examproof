from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


def test_exam_lifecycle_integration():
    factory = get_contract_factory("ExamProof")
    contract = factory.deploy(args=[])

    receipt = contract.create_exam(
        args=[
            "exam-int-001",
            "meta-hash-int-001",
            "2026-04-03T09:00:00Z",
            "2026-04-03T10:30:00Z",
        ]
    ).transact()
    assert tx_execution_succeeded(receipt)

    exam = contract.get_exam(args=["exam-int-001"]).call()
    assert exam["exam_id"] == "exam-int-001"
    assert exam["metadata_hash"] == "meta-hash-int-001"

    receipt = contract.commit_submission(
        args=[
            "exam-int-001",
            "candidate-int-001",
            "submission-hash-int-001",
        ]
    ).transact()
    assert tx_execution_succeeded(receipt)

    submission = contract.get_submission(
        args=["exam-int-001", "candidate-int-001"]
    ).call()
    assert submission["submission_hash"] == "submission-hash-int-001"
    assert submission["result_status"] == "submitted"

    receipt = contract.finalize_score(
        args=[
            "exam-int-001",
            "candidate-int-001",
            "45",
            "40",
            "85",
        ]
    ).transact()
    assert tx_execution_succeeded(receipt)

    result = contract.get_result(
        args=["exam-int-001", "candidate-int-001"]
    ).call()
    assert result["objective_score"] == "45"
    assert result["subjective_score"] == "40"
    assert result["total_score"] == "85"
    assert result["result_status"] == "finalized"