def test_create_exam_and_get_exam(direct_vm, direct_deploy, direct_owner):
    contract = direct_deploy("contracts/exam_proof.py")

    direct_vm.sender = direct_owner

    contract.create_exam(
        "exam-001",
        "meta-hash-001",
        "2026-04-03T09:00:00Z",
        "2026-04-03T10:30:00Z",
    )

    exam = contract.get_exam("exam-001")

    assert exam["exam_id"] == "exam-001"
    assert exam["metadata_hash"] == "meta-hash-001"
    assert exam["start_time"] == "2026-04-03T09:00:00Z"
    assert exam["end_time"] == "2026-04-03T10:30:00Z"


def test_only_owner_can_create_exam(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/exam_proof.py")

    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Only owner"):
        contract.create_exam(
            "exam-002",
            "meta-hash-002",
            "2026-04-03T09:00:00Z",
            "2026-04-03T10:30:00Z",
        )


def test_commit_submission_and_read_it(direct_vm, direct_deploy, direct_owner):
    contract = direct_deploy("contracts/exam_proof.py")

    direct_vm.sender = direct_owner
    contract.create_exam(
        "exam-003",
        "meta-hash-003",
        "2026-04-03T09:00:00Z",
        "2026-04-03T10:30:00Z",
    )

    contract.commit_submission(
        "exam-003",
        "candidate-001",
        "submission-hash-001",
    )

    submission = contract.get_submission("exam-003", "candidate-001")

    assert submission["submission_hash"] == "submission-hash-001"
    assert submission["result_status"] == "submitted"


def test_cannot_commit_submission_twice(direct_vm, direct_deploy, direct_owner):
    contract = direct_deploy("contracts/exam_proof.py")

    direct_vm.sender = direct_owner
    contract.create_exam(
        "exam-004",
        "meta-hash-004",
        "2026-04-03T09:00:00Z",
        "2026-04-03T10:30:00Z",
    )

    contract.commit_submission(
        "exam-004",
        "candidate-002",
        "submission-hash-002",
    )

    with direct_vm.expect_revert("Submission already committed"):
        contract.commit_submission(
            "exam-004",
            "candidate-002",
            "submission-hash-003",
        )


def test_finalize_score_and_get_result(direct_vm, direct_deploy, direct_owner):
    contract = direct_deploy("contracts/exam_proof.py")

    direct_vm.sender = direct_owner
    contract.create_exam(
        "exam-005",
        "meta-hash-005",
        "2026-04-03T09:00:00Z",
        "2026-04-03T10:30:00Z",
    )

    contract.commit_submission(
        "exam-005",
        "candidate-003",
        "submission-hash-005",
    )

    contract.finalize_score(
        "exam-005",
        "candidate-003",
        "40",
        "35",
        "75",
    )

    result = contract.get_result("exam-005", "candidate-003")

    assert result["objective_score"] == "40"
    assert result["subjective_score"] == "35"
    assert result["total_score"] == "75"
    assert result["result_status"] == "finalized"


def test_cannot_finalize_without_submission(direct_vm, direct_deploy, direct_owner):
    contract = direct_deploy("contracts/exam_proof.py")

    direct_vm.sender = direct_owner
    contract.create_exam(
        "exam-006",
        "meta-hash-006",
        "2026-04-03T09:00:00Z",
        "2026-04-03T10:30:00Z",
    )

    with direct_vm.expect_revert("Submission not found"):
        contract.finalize_score(
            "exam-006",
            "candidate-404",
            "10",
            "20",
            "30",
        )