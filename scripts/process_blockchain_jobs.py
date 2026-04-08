import json
import subprocess
from datetime import datetime

from supabase import create_client

SUPABASE_URL = "https://xbpbsghhrcxxyzznffre.supabase.co"
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

CONTRACT_ADDRESS = "0xc08c7BcB3B10A587958473C97C26Ad654dF5fdDC"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def run_genlayer(args: list[str]) -> dict:
    result = subprocess.run(
        ["genlayer"] + args,
        cwd="/workspaces/examproof",
        capture_output=True,
        text=True,
    )
    return {
        "returncode": result.returncode,
        "stdout": result.stdout.strip(),
        "stderr": result.stderr.strip(),
    }


def process_job(job: dict):
    payload = job["payload"]
    job_type = job["job_type"]

    if job_type == "register_exam":
        args = [
            "write",
            CONTRACT_ADDRESS,
            "create_exam",
            json.dumps(payload["examId"]),
            json.dumps(payload["metadataHash"]),
            json.dumps(payload["startTime"]),
            json.dumps(payload["endTime"]),
        ]
    elif job_type == "commit_submission":
        args = [
            "write",
            CONTRACT_ADDRESS,
            "commit_submission",
            json.dumps(payload["examId"]),
            json.dumps(payload["candidateId"]),
            json.dumps(payload["submissionHash"]),
        ]
    elif job_type == "finalize_score":
        args = [
            "write",
            CONTRACT_ADDRESS,
            "finalize_score",
            json.dumps(payload["examId"]),
            json.dumps(payload["candidateId"]),
            json.dumps(str(payload["objectiveScore"])),
            json.dumps(str(payload["subjectiveScore"])),
            json.dumps(str(payload["totalScore"])),
        ]
    else:
        raise ValueError(f"Unknown job_type: {job_type}")

    result = run_genlayer(args)

    if result["returncode"] == 0:
        supabase.table("blockchain_jobs").update({
            "status": "completed",
            "result": result,
            "updated_at": datetime.utcnow().isoformat(),
            "contract_address": CONTRACT_ADDRESS,
        }).eq("id", job["id"]).execute()
    else:
        supabase.table("blockchain_jobs").update({
            "status": "failed",
            "error": result["stderr"] or result["stdout"],
            "result": result,
            "retries": (job.get("retries") or 0) + 1,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()


def main():
    response = supabase.table("blockchain_jobs").select("*").eq("status", "pending").limit(20).execute()
    jobs = response.data or []

    for job in jobs:
        supabase.table("blockchain_jobs").update({
            "status": "processing",
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        try:
            process_job(job)
        except Exception as e:
            supabase.table("blockchain_jobs").update({
                "status": "failed",
                "error": str(e),
                "retries": (job.get("retries") or 0) + 1,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", job["id"]).execute()


if __name__ == "__main__":
    main()
