"use client";

import QuestionCard from "@/components/ui/question-card";

const sampleQuestions = [
  {
    id: "1cab1efb-9b96-4b65-8b85-2899a2c5554b",
    title: "How can I find peace in difficult times?",
    content:
      "I've been going through a really challenging season in my life and I'm struggling to find the peace that Scripture talks about. Any advice or biblical perspectives would be greatly appreciated.",
    keywords: ["peace", "difficult times", "faith"],
    created_by_id: "6602001d-290a-41f8-97bd-732d345a4abb",
    is_admin: true,
    created_at: "2025-11-15 16:54:40.378428+00",
    updated_at: "2025-11-15 16:54:40.378428+00",
  },
  {
    id: "b02b63b8-c5cf-49d1-9c01-d682e300499e",
    title: "What does it mean to love your neighbor?",
    content:
      "Jesus commanded us to love our neighbors as ourselves. In practical terms, what does this look like in our daily interactions with people who might be different from us or even difficult to love?",
    keywords: ["love", "neighbor", "practical faith", "relationships"],
    created_by_id: "9a603173-0463-4eb8-8bc8-a83fda6182ab",
    is_admin: false,
    created_at: "2024-01-15 12:00:00+00",
    updated_at: "2024-01-15 12:00:00+00",
  },
  {
    id: "baf89c4f-ae16-4275-86b6-cae097b73831",
    title: "Understanding the role of the Holy Spirit",
    content:
      "Could someone explain the different ways the Holy Spirit works in our lives today? I'm particularly interested in understanding the gifts of the Spirit and how they manifest in modern Christian life.",
    keywords: ["holy spirit", "spiritual gifts", "guidance"],
    created_by_id: "6602001d-290a-41f8-97bd-732d345a4abb",
    is_admin: true,
    created_at: "2025-11-10 18:54:40.378428+00",
    updated_at: "2025-11-10 18:54:40.378428+00",
  },
];

export default function Feed() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sampleQuestions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
}
