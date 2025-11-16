"use client";

import { useQuestion } from "@/contexts/question-context";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuestionCard({ question }) {
  const { selectQuestion, selectedQuestionId } = useQuestion();

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

  const truncateContent = (content, maxLength = 90) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + "...";
  };

  const isSelected = selectedQuestionId === question.id;

  return (
    <div
      onClick={() => selectQuestion(question.id)}
      className={`
        bg-white rounded-lg border border-[#E5E5E5] transition-all duration-300 cursor-pointer
        hover:shadow-lg hover:opacity-95
        active:opacity-90
        ${isSelected ? "shadow-md opacity-95 border-[#FA5200]" : "shadow-sm"}
      `}
    >
      <div className="p-6">
        {/* Title and Reply Count */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-[#1A1A1A] line-clamp-2 leading-tight flex-1">
            {question.title}
          </h3>
          <Badge
            variant="secondary"
            className="ml-2 bg-gray-50 text-[#6B6B6B] flex items-center space-x-1"
          >
            <MessageCircle className="h-3 w-3" />
            <span>{question.reply_count || 0}</span>
          </Badge>
        </div>

        {/* Content Preview */}
        <p className="text-[#6B6B6B] text-sm mb-6 line-clamp-3 leading-relaxed">
          {truncateContent(question.content)}
        </p>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[#F0F0F0]">
          {/* Author */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#6B6B6B]">Created by:</span>
            {question.is_admin ? (
              <div className="flex items-center space-x-1 bg-[#FCE4C2] px-2 py-1 rounded-full border border-[#FEA001] border-opacity-30">
                <img
                  src="/impact-logo.png"
                  alt="Impact Host"
                  className="w-3 h-3 rounded"
                />
                <span className="text-xs font-medium text-[#FA5200]">
                  Impact Host
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-[#1A1A1A]">
                user{question.created_by_id?.substring(0, 8)}...
              </span>
            )}
          </div>

          {/* Date */}
          <span className="text-xs text-[#6B6B6B] font-medium">
            {formatDate(question.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
