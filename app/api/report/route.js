import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, question_id } = body;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication token is required" },
        { status: 401 }
      );
    }

    if (!question_id) {
      return NextResponse.json(
        { message: "question_id is required" },
        { status: 400 }
      );
    }

    // Verify the token and get user info
    let userId;
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "your-fallback-secret-key-change-in-production"
      );
      userId = decoded.userId;
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Check if user session is valid
    const { data: session, error: sessionError } = await supabase
      .from("fake_user_sessions")
      .select("user_id")
      .eq("access_token", token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    // Verify the question exists
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    // Check if user has already reported this question
    const { data: existingReport, error: checkError } = await supabase
      .from("reports")
      .select("id")
      .eq("question_id", question_id)
      .eq("reported_by_id", userId)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { message: "You have already reported this question" },
        { status: 400 }
      );
    }

    // Create report record
    const reportData = {
      question_id: question_id,
      reported_by_id: userId,
      reported_at: new Date().toISOString(),
    };

    const { error: reportError } = await supabase
      .from("reports")
      .insert([reportData]);

    if (reportError) {
      console.error("Report creation error:", reportError);
      return NextResponse.json(
        { message: "Failed to create report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Question reported successfully",
    });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
