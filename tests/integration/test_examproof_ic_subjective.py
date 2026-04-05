from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded


def test_subjective_grading_live():
    factory = get_contract_factory("ExamProofIC")
    account = get_default_account()

    contract = factory.deploy(
        args=[
            "EXAM-LIVE-001",
            "Recruitment Test",
            "Backend engineer screening exam",
            "2026-04-10T09:00:00Z",
            "2026-04-10T11:00:00Z",
        ],
        account=account,
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
        ]
    ).transact()
    assert tx_execution_succeeded(tx)

    tx = contract.publish_exam().transact()
    assert tx_execution_succeeded(tx)

    tx = contract.open_exam().transact()
    assert tx_execution_succeeded(tx)

    tx = contract.submit_exam(
        args=[
            "cand-001",
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

    result = contract.get_result(args=["cand-001"]).call()

    assert result["objective_score"] == 5
    assert result["subjective_score"] >= 0
    assert result["total_score"] >= 5
    assert result["result_status"] == "finalized"
    assert len(result["grading_reasoning"]) > 5