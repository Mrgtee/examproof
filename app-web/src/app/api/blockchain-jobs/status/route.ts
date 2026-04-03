import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from("blockchain_jobs")
      .select("*")
      .eq("id", body.jobId)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, job: data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch blockchain job" },
      { status: 500 }
    );
  }
}