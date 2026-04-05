import hashlib


def sha(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def relayer_str(raw_bytes: bytes) -> str:
    return "0x" + raw_bytes.hex()


def deploy_exam(direct_deploy, relayer: str):
    return direct_deploy(
        "contracts/examproof_ic.py",
        "EXAM-001",
        "Recruitment Test",
        "Backend engineer screening exam",
        "2026-04-10T09:00:00Z",
        "2026-04-10T11:00:00Z",
        relayer,
        1,
    )


def test_create_exam_and_read(direct_deploy, direct_alice):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))
    exam = contract.get_exam()

    assert exam["exam_id"] == "EXAM-001"
    assert exam["title"] == "Recruitment Test"
    assert exam["status"] == "draft"


def test_add_question_candidate_and_budget(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))
    direct_vm.sender = direct_owner

    contract.add_question(
        "What is 2 + 2?",
        "mcq",
        5,
        ["2", "3", "4", "5"],
        "4",
        "",
    )

    contract.register_candidate(
        "cand-001",
        "Alice Doe",
        "alice@example.com",
        sha("cand-secret-001"),
    )

    contract.fund_submission_budget(3)

    exam = contract.get_exam()
    candidates = contract.get_candidates()

    assert exam["submission_budget"] == 3
    assert len(candidates) == 1
    assert candidates[0]["candidate_id"] == "cand-001"


def test_gasless_submission_uses_budget(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))

    direct_vm.sender = direct_owner
    contract.add_question(
        "What is 2 + 2?",
        "mcq",
        5,
        ["2", "3", "4", "5"],
        "4",
        "",
    )
    contract.register_candidate(
        "cand-001",
        "Alice Doe",
        "alice@example.com",
        sha("cand-secret-001"),
    )
    contract.fund_submission_budget(2)
    contract.publish_exam()
    contract.open_exam()

    direct_vm.sender = direct_alice
    contract.submit_exam_gasless(
        "cand-001",
        "cand-secret-001",
        '{"0":"4"}',
        "2026-04-10T09:30:00Z",
    )

    result = contract.get_result("cand-001")
    exam = contract.get_exam()
    candidates = contract.get_candidates()

    assert result["objective_score"] == 5
    assert result["total_score"] == 5
    assert exam["submission_budget"] == 1
    assert candidates[0]["has_submitted"] is True


def test_duplicate_submission_blocked(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))

    direct_vm.sender = direct_owner
    contract.add_question(
        "What is 2 + 2?",
        "mcq",
        5,
        ["2", "3", "4", "5"],
        "4",
        "",
    )
    contract.register_candidate(
        "cand-001",
        "Alice Doe",
        "alice@example.com",
        sha("cand-secret-001"),
    )
    contract.fund_submission_budget(2)
    contract.publish_exam()
    contract.open_exam()

    direct_vm.sender = direct_alice
    contract.submit_exam_gasless(
        "cand-001",
        "cand-secret-001",
        '{"0":"4"}',
        "2026-04-10T09:30:00Z",
    )

    try:
        contract.submit_exam_gasless(
            "cand-001",
            "cand-secret-001",
            '{"0":"4"}',
            "2026-04-10T09:31:00Z",
        )
        assert False, "Expected duplicate submission to fail"
    except Exception:
        assert True