import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("id");

    if (!questionId) {
      return NextResponse.json(
        { message: "Question ID is required" },
        { status: 400 }
      );
    }

    // Fetch the question
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    // Fetch depth 0 replies (direct replies to question)
    const { data: depth0Replies, error: depth0Error } = await supabase
      .from("replies")
      .select("*")
      .eq("parent_question_id", questionId)
      .eq("depth", 0)
      .order("is_admin", { ascending: false }) // Admin replies first
      .order("created_at", { ascending: true });

    if (depth0Error) {
      console.error("Depth 0 replies fetch error:", depth0Error);
      return NextResponse.json(
        { message: "Failed to fetch replies" },
        { status: 500 }
      );
    }

    // If there are depth 0 replies, fetch their nested replies (depth 1)
    let depth1Replies = [];
    if (depth0Replies && depth0Replies.length > 0) {
      const depth0ReplyIds = depth0Replies.map((reply) => reply.id);

      const { data: nestedReplies, error: nestedError } = await supabase
        .from("replies")
        .select("*")
        .in("reply_id", depth0ReplyIds)
        .eq("depth", 1)
        .order("created_at", { ascending: true });

      if (!nestedError) {
        depth1Replies = nestedReplies || [];
      }
    }

    // Organize replies into nested structure
    const repliesWithNested = (depth0Replies || []).map((reply) => ({
      ...reply,
      nested_replies: depth1Replies.filter(
        (nested) => nested.reply_id === reply.id
      ),
    }));

    return NextResponse.json({
      question,
      replies: repliesWithNested,
    });
  } catch (error) {
    console.error("Single question fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, title, content, keywords = [] } = body;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication token is required" },
        { status: 401 }
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

    if (!title || !title.trim()) {
      return NextResponse.json(
        { message: "Question title is required" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: "Question content is required" },
        { status: 400 }
      );
    }

    // Check if user is admin by checking admins table
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    const is_admin = !!admin; // User is admin if found in admins table

    // Create the question
    const questionData = {
      title: title.trim(),
      content: content.trim(),
      keywords: keywords,
      created_by_id: userId,
      is_admin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newQuestion, error: insertError } = await supabase
      .from("questions")
      .insert([questionData])
      .select()
      .single();

    if (insertError) {
      console.error("Question creation error:", insertError);
      return NextResponse.json(
        { message: "Failed to create question" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Question created successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Question creation error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}