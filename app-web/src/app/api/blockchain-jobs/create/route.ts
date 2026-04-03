import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from("blockchain_jobs")
      .insert({
        job_type: body.jobType,
        exam_id: body.examId ?? null,
        candidate_id: body.candidateId ?? null,
        payload: body.payload,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, job: data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create blockchain job" },
      { status: 500 }
    );
  }
}