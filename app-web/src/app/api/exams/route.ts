import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = crypto.randomBytes(16).toString("hex");

    const { data, error } = await supabase
      .from("exams")
      .insert({
        title: body.title,
        description: body.description,
        start_time: body.startTime,
        end_time: body.endTime,
        private_link_token: token,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ exam: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}