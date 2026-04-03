import { NextResponse } from "next/server";
import { commitSubmissionOnGenLayer } from "@/lib/genlayer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await commitSubmissionOnGenLayer({
      examId: body.examId,
      candidateId: body.candidateId,
      submissionHash: body.submissionHash,
    });

    return NextResponse.json({ success: true, result });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to commit submission on GenLayer" },
      { status: 500 }
    );
  }
}