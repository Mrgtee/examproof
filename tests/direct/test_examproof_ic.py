import hashlib
import json


def sha(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def relayer_str(raw_bytes: bytes) -> str:
    return "0x" + raw_bytes.hex()


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


def submit_authorized(
    contract,
    exam_id: str,
    candidate_id: str,
    candidate_secret: str,
    answers_json: str,
    submitted_at: str,
):
    authorization = submission_authorization(
        exam_id,
        candidate_id,
        candidate_secret,
        answers_json,
        submitted_at,
    )
    contract.submit_exam_gasless(
        candidate_id,
        answers_json,
        submitted_at,
        authorization,
    )
    return authorization


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


def prepare_open_mcq_exam(contract, correct_answer="4"):
    contract.add_question(
        "What is 2 + 2?",
        "mcq",
        5,
        ["2", "3", correct_answer, "5"],
        correct_answer,
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
    prepare_open_mcq_exam(contract)

    direct_vm.sender = direct_alice
    answers_json = json.dumps({"0": "4"})
    submitted_at = "2026-04-10T09:30:00Z"
    authorization = submit_authorized(
        contract,
        "EXAM-001",
        "cand-001",
        "cand-secret-001",
        answers_json,
        submitted_at,
    )

    result = contract.get_result("cand-001")
    exam = contract.get_exam()
    candidates = contract.get_candidates()

    assert result["objective_score"] == 5
    assert result["total_score"] == 5
    assert result["submission_authorization"] == authorization
    assert exam["submission_budget"] == 1
    assert candidates[0]["has_submitted"] is True


def test_submission_answers_json_allows_spaces_and_escaped_quotes(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))

    direct_vm.sender = direct_owner
    prepare_open_mcq_exam(contract, correct_answer='A "quoted" answer')

    direct_vm.sender = direct_alice
    answers_json = json.dumps({"0": 'A "quoted" answer'}, indent=2)
    submit_authorized(
        contract,
        "EXAM-001",
        "cand-001",
        "cand-secret-001",
        answers_json,
        "2026-04-10T09:30:00Z",
    )

    result = contract.get_result("cand-001")

    assert result["objective_score"] == 5
    assert result["total_score"] == 5


def test_relayed_submission_requires_candidate_authorized_payload(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))

    direct_vm.sender = direct_owner
    prepare_open_mcq_exam(contract)

    direct_vm.sender = direct_alice
    submitted_at = "2026-04-10T09:30:00Z"
    authorized_answers = json.dumps({"0": "4"})
    tampered_answers = json.dumps({"0": "5"})
    authorization = submission_authorization(
        "EXAM-001",
        "cand-001",
        "cand-secret-001",
        authorized_answers,
        submitted_at,
    )

    try:
        contract.submit_exam_gasless(
            "cand-001",
            tampered_answers,
            submitted_at,
            authorization,
        )
        assert False, "Expected tampered answers to fail authorization"
    except Exception:
        assert True

    submit_authorized(
        contract,
        "EXAM-001",
        "cand-001",
        "cand-secret-001",
        authorized_answers,
        submitted_at,
    )

    result = contract.get_result("cand-001")
    submissions = contract.get_submissions()

    assert submissions[0]["answers_json"] == authorized_answers
    assert result["objective_score"] == 5


def test_duplicate_submission_blocked(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))

    direct_vm.sender = direct_owner
    prepare_open_mcq_exam(contract)

    direct_vm.sender = direct_alice
    answers_json = json.dumps({"0": "4"})
    submitted_at = "2026-04-10T09:30:00Z"
    submit_authorized(
        contract,
        "EXAM-001",
        "cand-001",
        "cand-secret-001",
        answers_json,
        submitted_at,
    )

    try:
        submit_authorized(
            contract,
            "EXAM-001",
            "cand-001",
            "cand-secret-001",
            answers_json,
            "2026-04-10T09:31:00Z",
        )
        assert False, "Expected duplicate submission to fail"
    except Exception:
        assert True


def test_grading_and_finalization_are_one_shot(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    contract = deploy_exam(direct_deploy, relayer_str(direct_alice))

    direct_vm.sender = direct_owner
    prepare_open_mcq_exam(contract)

    direct_vm.sender = direct_alice
    answers_json = json.dumps({"0": "4"})
    submit_authorized(
        contract,
        "EXAM-001",
        "cand-001",
        "cand-secret-001",
        answers_json,
        "2026-04-10T09:30:00Z",
    )

    direct_vm.sender = direct_owner

    try:
        contract.finalize_result("cand-001", "finalized")
        assert False, "Expected ungraded finalization to fail"
    except Exception:
        assert True

    contract.grade_subjective_submission("cand-001")
    result = contract.get_result("cand-001")
    assert result["result_status"] == "graded"
    assert result["grading_reasoning"] == "No subjective questions to grade"

    try:
        contract.grade_subjective_submission("cand-001")
        assert False, "Expected repeated grading to fail"
    except Exception:
        assert True

    try:
        contract.finalize_result("cand-001", "reopened")
        assert False, "Expected unsupported final status to fail"
    except Exception:
        assert True

    contract.finalize_result("cand-001", "finalized")
    result = contract.get_result("cand-001")
    assert result["result_status"] == "finalized"

    try:
        contract.finalize_result("cand-001", "finalized")
        assert False, "Expected repeated finalization to fail"
    except Exception:
        assert True

    try:
        contract.grade_subjective_submission("cand-001")
        assert False, "Expected grading finalized submission to fail"
    except Exception:
        assert True
