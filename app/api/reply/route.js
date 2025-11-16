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
    const { token, parent_question_id, reply_id, content, depth = 0 } = body;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication token is required" },
        { status: 401 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: "Reply content is required" },
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

    // Validate depth rules
    if (depth > 1) {
      return NextResponse.json(
        { message: "Cannot reply beyond depth 1" },
        { status: 400 }
      );
    }

    let finalParentQuestionId = parent_question_id;

    // For depth 0, must have parent_question_id
    if (depth === 0) {
      if (!parent_question_id) {
        return NextResponse.json(
          { message: "Parent question ID is required for depth 0 replies" },
          { status: 400 }
        );
      }

      // Verify the question exists
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .select("id")
        .eq("id", parent_question_id)
        .single();

      if (questionError || !question) {
        return NextResponse.json(
          { message: "Question not found" },
          { status: 404 }
        );
      }
    }

    // For depth 1, must have reply_id and validate it exists
    if (depth === 1) {
      if (!reply_id) {
        return NextResponse.json(
          { message: "Reply ID is required for depth 1 replies" },
          { status: 400 }
        );
      }

      // Verify the parent reply exists and is depth 0
      const { data: parentReply, error: parentError } = await supabase
        .from("replies")
        .select("id, depth, parent_question_id")
        .eq("id", reply_id)
        .single();

      if (parentError || !parentReply) {
        return NextResponse.json(
          { message: "Parent reply not found" },
          { status: 404 }
        );
      }

      if (parentReply.depth !== 0) {
        return NextResponse.json(
          { message: "Can only reply to depth 0 replies" },
          { status: 400 }
        );
      }

      // Use the parent reply's question ID
      finalParentQuestionId = parentReply.parent_question_id;
    }

    // Check if user is admin by querying the admins table
    const { data: adminCheck, error: adminError } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    const is_admin = !!adminCheck; // true if user exists in admins table

    // Create the reply
    const replyData = {
      content: content.trim(),
      created_by_id: userId,
      is_admin,
      depth,
      parent_question_id: finalParentQuestionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add reply_id for depth 1 replies
    if (depth === 1) {
      replyData.reply_id = reply_id;
    }

    const { data: newReply, error: insertError } = await supabase
      .from("replies")
      .insert([replyData])
      .select()
      .single();

    if (insertError) {
      console.error("Reply creation error:", insertError);
      return NextResponse.json(
        { message: "Failed to create reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Reply created successfully",
      reply: newReply,
    });
  } catch (error) {
    console.error("Reply creation error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
