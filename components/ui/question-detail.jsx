"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuestion } from "@/contexts/question-context";
import { X, MessageCircle, ChevronDown, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// NEW: Controlled nested reply input component
const NestedReplyInput = ({
  replyId,
  initialContent = "",
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef(null);

  // Focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    onSubmit(content);
  };

  const handleChange = (e) => {
    setContent(e.target.value);
  };

  return (
    <div className="mt-4 p-4 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="Write your reply..."
        rows={3}
        className="mb-3 bg-white focus:ring-2 focus:ring-[#FA5200] focus:border-[#FA5200] border-[#E5E5E5] resize-none"
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1A1A1A]"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="bg-gradient-to-r from-[#FEA001] to-[#FA5200] text-white hover:from-[#FA5200] hover:to-[#FEA001] transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Reply"
          )}
        </Button>
      </div>
    </div>
  );
};

export default function QuestionDetail() {
  const { selectedQuestionId, clearSelectedQuestion } = useQuestion();
  const [question, setQuestion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [openReplyBoxes, setOpenReplyBoxes] = useState({});
  const [isReporting, setIsReporting] = useState(false);
  const [error, setError] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [submittingNestedReplies, setSubmittingNestedReplies] = useState({});

  // Track which reply box was just opened
  const newlyOpenedReplyId = useRef(null);

  useEffect(() => {
    if (selectedQuestionId) {
      fetchQuestionAndReplies();
    } else {
      setQuestion(null);
      setReplies([]);
      setError("");
      setOpenReplyBoxes({});
      newlyOpenedReplyId.current = null;
    }
  }, [selectedQuestionId]);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const fetchQuestionAndReplies = async () => {
    if (!selectedQuestionId) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/single-question?id=${selectedQuestionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        setReplies(data.replies || []);
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to load question. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to fetch question:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setError("Please write a reply before posting.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Please sign in to post a reply.");
      return;
    }

    setError("");
    setIsSubmittingReply(true);

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          parent_question_id: selectedQuestionId,
          content: replyContent,
          depth: 0,
        }),
      });

      if (response.ok) {
        setReplyContent("");
        await fetchQuestionAndReplies();
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to post reply. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to submit reply:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSubmitNestedReply = async (parentReplyId, content) => {
    if (!content.trim()) {
      setError("Please write a reply before posting.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Please sign in to post a reply.");
      return;
    }

    setError("");
    setSubmittingNestedReplies((prev) => ({ ...prev, [parentReplyId]: true }));

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          reply_id: parentReplyId,
          parent_question_id: selectedQuestionId,
          content: content,
          depth: 1,
        }),
      });

      if (response.ok) {
        setOpenReplyBoxes((prev) => ({ ...prev, [parentReplyId]: false }));
        await fetchQuestionAndReplies();
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to post reply. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to submit nested reply:", error);
      setError("Network error. Please try again.");
    } finally {
      setSubmittingNestedReplies((prev) => ({
        ...prev,
        [parentReplyId]: false,
      }));
    }
  };

  const handleReport = async () => {
    if (!selectedQuestionId) return;

    const token = getToken();
    if (!token) {
      setError("Please sign in to report content.");
      return;
    }

    setIsReporting(true);
    setError("");
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          question_id: selectedQuestionId,
        }),
      });

      if (response.ok) {
        const successMsg = "Question reported successfully";
        setError(successMsg);
        setTimeout(() => setError(""), 3000);
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to report question. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to report question:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsReporting(false);
    }
  };

  const toggleNestedReplies = (replyId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const toggleReplyBox = (replyId) => {
    const isOpening = !openReplyBoxes[replyId];

    if (isOpening) {
      newlyOpenedReplyId.current = replyId;
    }

    setOpenReplyBoxes((prev) => ({
      ...prev,
      [replyId]: isOpening,
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;

    if (diffMs < 0) return "Just now"; // safety, in case clocks drift

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // less than 1 hour
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? "Just now" : `${diffMinutes}m ago`;
    }

    // less than 24 hours
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    // yesterday
    if (diffDays === 1) {
      return "Yesterday";
    }

    // within the last 7 days
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    // older than a week
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const ReplyItem = ({ reply, depth = 0 }) => {
    const hasNestedReplies =
      reply.nested_replies && reply.nested_replies.length > 0;
    const showNestedReplies = expandedReplies[reply.id];
    const isReplyBoxOpen = openReplyBoxes[reply.id];
    const isSubmitting = submittingNestedReplies[reply.id];

    return (
      <div
        className={`${
          depth > 0 ? "ml-6 border-l-2 border-[#E5E5E5] pl-4 mt-4" : "pb-6"
        }`}
      >
        {/* Reply Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/profile.png" />
              <AvatarFallback className="bg-[#F0F0F0] text-[#6B6B6B]">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              {reply.is_admin ? (
                <Badge
                  variant="secondary"
                  className="bg-[#FCE4C2] text-[#FA5200] border border-[#FEA001]/30 hover:bg-[#FCE4C2] text-xs"
                >
                  <img
                    src="/impact-logo.png"
                    alt="Impact Host"
                    className="w-3 h-3 mr-1"
                  />
                  Impact Host
                </Badge>
              ) : (
                <span className="text-sm font-medium text-[#1A1A1A]">
                  user{reply.created_by_id?.substring(0, 8) || "unknown"}
                </span>
              )}
              <span className="text-xs text-[#6B6B6B]">•</span>
              <span className="text-xs text-[#6B6B6B]">
                {formatDate(reply.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Reply Content */}
        <p className="text-[#1A1A1A] text-sm mb-3 leading-relaxed">
          {reply.content}
        </p>

        {/* Reply Actions */}
        {depth === 0 && (
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleReplyBox(reply.id)}
              className="h-8 px-2 text-xs text-[#FA5200] hover:text-[#FA5200] hover:bg-[#FA5200]/5"
            >
              <MessageCircle size={14} className="mr-1" />
              {isReplyBoxOpen ? "Cancel" : "Reply"}
            </Button>

            {hasNestedReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNestedReplies(reply.id)}
                className="h-8 px-2 text-xs text-[#6B6B6B] hover:text-[#1A1A1A]"
              >
                <span>
                  {showNestedReplies ? "Hide" : "View"}{" "}
                  {reply.nested_replies.length} repl
                  {reply.nested_replies.length === 1 ? "y" : "ies"}
                </span>
                <ChevronDown
                  size={14}
                  className={`ml-1 transform transition-transform duration-200 ${
                    showNestedReplies ? "rotate-180" : ""
                  }`}
                />
              </Button>
            )}
          </div>
        )}

        {/* Reply Input for Depth 0 - NEW: Using controlled component */}
        {depth === 0 && isReplyBoxOpen && (
          <NestedReplyInput
            replyId={reply.id}
            initialContent=""
            onSubmit={(content) => handleSubmitNestedReply(reply.id, content)}
            onCancel={() => toggleReplyBox(reply.id)}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Nested Replies */}
        {hasNestedReplies && showNestedReplies && (
          <div className="mt-4 space-y-4">
            {reply.nested_replies.map((nestedReply) => (
              <ReplyItem
                key={nestedReply.id}
                reply={nestedReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Dark Overlay - Faster animation */}
      <div
        className={`
        fixed inset-0 bg-black/40 backdrop-blur-md z-[60] transition-all duration-300 ease-out
        hidden md:block
        ${selectedQuestionId ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
        onClick={clearSelectedQuestion}
      />

      {/* Desktop: Faster slide-in animation */}
      <div
        className={`
        fixed bg-white z-[70] shadow-2xl overflow-hidden
        hidden md:flex md:flex-col
        top-0 right-0 h-screen w-full max-w-2xl
        transition-transform duration-300 ease-out
        border-l border-[#E5E5E5]
        ${selectedQuestionId ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <PanelContent
          question={question}
          replies={replies}
          isLoading={isLoading}
          error={error}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          handleSubmitReply={handleSubmitReply}
          handleReport={handleReport}
          isReporting={isReporting}
          isSubmittingReply={isSubmittingReply}
          clearSelectedQuestion={clearSelectedQuestion}
          formatDate={formatDate}
          ReplyItem={ReplyItem}
          fetchQuestionAndReplies={fetchQuestionAndReplies}
        />
      </div>

      {/* Mobile: Faster slide-up animation */}
      <div
        className={`
        fixed bg-white z-[70] shadow-2xl overflow-hidden rounded-t-2xl
        md:hidden flex flex-col
        bottom-0 left-0 right-0 h-[90vh] max-h-screen
        transition-transform duration-300 ease-out
        ${selectedQuestionId ? "translate-y-0" : "translate-y-full"}
      `}
      >
        {/* Mobile handle bar */}
        <div className="sticky top-0 bg-white pt-4 pb-3 rounded-t-2xl z-20 border-b border-[#E5E5E5] shadow-sm">
          <div className="w-12 h-1.5 bg-[#6B6B6B] rounded-full mx-auto mb-2"></div>
        </div>

        <PanelContent
          question={question}
          replies={replies}
          isLoading={isLoading}
          error={error}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          handleSubmitReply={handleSubmitReply}
          handleReport={handleReport}
          isReporting={isReporting}
          isSubmittingReply={isSubmittingReply}
          clearSelectedQuestion={clearSelectedQuestion}
          formatDate={formatDate}
          ReplyItem={ReplyItem}
          fetchQuestionAndReplies={fetchQuestionAndReplies}
          isMobile={true}
        />
      </div>

      {/* Mobile Overlay - Faster animation */}
      <div
        className={`
        fixed inset-0 bg-black/30 backdrop-blur-md z-[60] transition-all duration-300 ease-out
        md:hidden
        ${selectedQuestionId ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
        onClick={clearSelectedQuestion}
      />
    </>
  );
}

// Panel content component
function PanelContent({
  question,
  replies,
  isLoading,
  error,
  replyContent,
  setReplyContent,
  handleSubmitReply,
  handleReport,
  isReporting,
  isSubmittingReply,
  clearSelectedQuestion,
  formatDate,
  ReplyItem,
  fetchQuestionAndReplies,
  isMobile = false,
}) {
  const mainTextareaRef = useRef(null);

  // Focus main textarea when panel opens
  useEffect(() => {
    if (question && mainTextareaRef.current) {
      setTimeout(() => {
        mainTextareaRef.current?.focus();
      }, 200);
    }
  }, [question]);

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5] px-4 py-3 flex justify-between items-center z-30 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          Question Details
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSelectedQuestion}
          className="h-8 w-8 hover:bg-[#FAFAFA] transition-colors text-[#6B6B6B] hover:text-[#1A1A1A]"
        >
          <X size={18} />
        </Button>
      </div>

      <ScrollArea className="flex-1 h-full">
        <div className="p-6 pb-24">
          {/* Error Message */}
          {error && (
            <Alert
              variant={error.includes("success") ? "default" : "destructive"}
              className={`mb-6 border-l-4 ${
                error.includes("success")
                  ? "border-[#FEA001] bg-[#FCE4C2] text-[#81462C]"
                  : "border-[#941004] bg-[#941004]/10 text-[#941004]"
              }`}
            >
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <LoadingSkeleton />
          ) : question ? (
            <>
              {/* Question Content */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4 leading-tight">
                  {question.title}
                </h1>
                <p className="text-[#1A1A1A] leading-relaxed whitespace-pre-wrap mb-6 text-base">
                  {question.content}
                </p>

                <Separator className="my-6 bg-[#E5E5E5]" />

                {/* Created by section */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/profile.png" />
                      <AvatarFallback className="bg-[#F0F0F0] text-[#6B6B6B]">
                        U
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#6B6B6B]">Asked by</span>
                      {question.is_admin ? (
                        <Badge
                          variant="secondary"
                          className="bg-[#FCE4C2] text-[#FA5200] border border-[#FEA001]/30 text-xs"
                        >
                          <img
                            src="/impact-logo.png"
                            alt="Impact Host"
                            className="w-3 h-3 mr-1"
                          />
                          Impact Host
                        </Badge>
                      ) : (
                        <span className="font-medium text-[#1A1A1A]">
                          user
                          {question.created_by_id?.substring(0, 8) || "unknown"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[#6B6B6B] text-sm">
                    {formatDate(question.created_at)}
                  </span>
                </div>
              </div>

              {/* Main Reply Input */}
              <div className="mb-8 p-4 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                  Post a reply
                </h3>
                <form onSubmit={handleSubmitReply}>
                  <Textarea
                    ref={mainTextareaRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    className="mb-4 resize-none bg-white focus:ring-2 focus:ring-[#FA5200] focus:border-[#FA5200] border-[#E5E5E5] transition-all"
                    onKeyDown={(e) => {
                      if (e.ctrlKey && e.key === "Enter") {
                        e.preventDefault();
                        handleSubmitReply(e);
                      }
                    }}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="px-6 transition-all bg-gradient-to-r from-[#FEA001] to-[#FA5200] text-white hover:from-[#FA5200] hover:to-[#FEA001]"
                      disabled={isSubmittingReply || !replyContent.trim()}
                    >
                      {isSubmittingReply ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post Reply"
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Replies Section */}
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                  {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                </h3>

                {replies.length === 0 ? (
                  <div className="text-center py-12 text-[#6B6B6B] bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
                    <MessageCircle
                      size={48}
                      className="mx-auto mb-3 opacity-40 text-[#6B6B6B]"
                    />
                    <p className="text-sm">
                      No replies yet. Be the first to reply!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {replies.map((reply) => (
                      <ReplyItem key={reply.id} reply={reply} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-[#6B6B6B] bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
              <p className="mb-4">Failed to load question</p>
              <Button
                onClick={fetchQuestionAndReplies}
                variant="outline"
                className="border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1A1A1A]"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Report Button */}
      <div
        className={`fixed ${
          isMobile ? "bottom-4 right-4" : "bottom-6 right-6"
        } z-20`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleReport}
          disabled={isReporting}
          className="bg-white/95 backdrop-blur shadow-lg border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white hover:shadow-xl transition-all"
        >
          <Flag size={16} className="mr-2" />
          {isReporting ? "Reporting..." : "Report"}
        </Button>
      </div>
    </>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Question skeleton */}
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-8 w-3/4 bg-[#E5E5E5]" />
        <Skeleton className="h-4 w-full bg-[#E5E5E5]" />
        <Skeleton className="h-4 w-full bg-[#E5E5E5]" />
        <Skeleton className="h-4 w-2/3 bg-[#E5E5E5]" />
        <Separator className="my-6 bg-[#E5E5E5]" />
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-6 w-6 rounded-full bg-[#E5E5E5]" />
            <Skeleton className="h-4 w-32 bg-[#E5E5E5]" />
          </div>
          <Skeleton className="h-4 w-24 bg-[#E5E5E5]" />
        </div>
      </div>

      {/* Reply input skeleton */}
      <div className="space-y-4 p-4 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] animate-pulse">
        <Skeleton className="h-6 w-24 bg-[#E5E5E5]" />
        <Skeleton className="h-24 w-full bg-[#E5E5E5]" />
        <Skeleton className="h-10 w-24 ml-auto bg-[#E5E5E5]" />
      </div>

      {/* Replies skeleton */}
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-6 w-20 bg-[#E5E5E5]" />
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full bg-[#E5E5E5]" />
                <Skeleton className="h-4 w-32 bg-[#E5E5E5]" />
              </div>
              <Skeleton className="h-4 w-full bg-[#E5E5E5]" />
              <Skeleton className="h-4 w-3/4 bg-[#E5E5E5]" />
              <div className="flex space-x-4">
                <Skeleton className="h-6 w-12 bg-[#E5E5E5]" />
                <Skeleton className="h-6 w-16 bg-[#E5E5E5]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
