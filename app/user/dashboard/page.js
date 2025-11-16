"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  FileQuestion,
  AlertCircle,
  User,
  Reply,
  Plus,
  X,
} from "lucide-react";
import QuestionCard from "@/components/ui/question-card";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("questions");
  const [userQuestions, setUserQuestions] = useState([]);
  const [userReplies, setUserReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionsPage, setQuestionsPage] = useState(1);
  const [repliesPage, setRepliesPage] = useState(1);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [pageSize, setPageSize] = useState(6);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    content: "",
    keywords: "",
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const router = useRouter();

  const pageSizeOptions = [4, 6, 10, 14, 20];

  useEffect(() => {
    if (activeTab === "questions") {
      fetchUserQuestions(1, true);
    } else if (activeTab === "replies") {
      fetchUserReplies(1, true);
    }
  }, [activeTab]);

  // Reset pagination when page size changes
  useEffect(() => {
    if (activeTab === "questions") {
      fetchUserQuestions(1, true);
    } else if (activeTab === "replies") {
      fetchUserReplies(1, true);
    }
  }, [pageSize]);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const fetchUserQuestions = async (page = 1, reset = false) => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          page,
          limit: pageSize,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setUserQuestions(data.questions || []);
          setQuestionsPage(1);
        } else {
          setUserQuestions((prev) => [...prev, ...(data.questions || [])]);
          setQuestionsPage(page);
        }
        setHasMoreQuestions(data.hasMore || false);
        setQuestionsTotal(data.total || 0);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to load your questions");
      }
    } catch (error) {
      console.error("Failed to fetch user questions:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserReplies = async (page = 1, reset = false) => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user-replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          page,
          limit: pageSize,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setUserReplies(data.questions || []);
          setRepliesPage(1);
        } else {
          setUserReplies((prev) => [...prev, ...(data.questions || [])]);
          setRepliesPage(page);
        }
        setHasMoreReplies(data.hasMore || false);
        setRepliesTotal(data.total || 0);
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to load questions you replied to"
        );
      }
    } catch (error) {
      console.error("Failed to fetch user replies:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/single-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          title: newQuestion.title,
          content: newQuestion.content,
          keywords: keywords,
        }),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        setNewQuestion({ title: "", content: "", keywords: "" });
        setKeywords([]);
        setKeywordInput("");
        // Refresh questions
        fetchUserQuestions(1, true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create question");
      }
    } catch (error) {
      console.error("Failed to create question:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !keywords.includes(keyword)) {
      setKeywords((prev) => [...prev, keyword]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove) => {
    setKeywords((prev) => prev.filter((k) => k !== keywordToRemove));
  };

  const handleKeywordKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "," || e.key === ";") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    // The useEffect will automatically trigger the reset
  };

  const StatsCard = ({ icon: Icon, title, value, description, total }) => (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#6B6B6B] mb-1">{title}</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{total}</p>
            <p className="text-xs text-[#6B6B6B] mt-1">{description}</p>
          </div>
          <div className="p-3 rounded-full bg-gradient-to-br from-[#FEA001] to-[#FA5200]">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ icon: Icon, title, description }) => (
    <Card className="border-dashed border-2 border-[#E5E5E5] bg-transparent">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-[#6B6B6B]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{title}</h3>
        <p className="text-[#6B6B6B] max-w-sm mx-auto">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">
              Your Dashboard
            </h1>
            <p className="text-[#6B6B6B] mt-2">
              Manage your questions and engagement
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-[#FCE4C2] text-[#FA5200] border border-[#FEA001] border-opacity-30"
          >
            <User className="h-3 w-3 mr-1" />
            Your Content
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatsCard
            icon={FileQuestion}
            title="Your Questions"
            value={userQuestions.length}
            total={questionsTotal}
            description="Total questions asked"
          />
          <StatsCard
            icon={Reply}
            title="Questions Replied To"
            value={userReplies.length}
            total={repliesTotal}
            description="Total questions engaged with"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-[#941004] border-opacity-85 bg-[#941004] bg-opacity-5">
          <CardContent className="p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-[#941004]" />
            <p className="text-sm font-medium text-[#941004]">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError("")}
              className="ml-auto text-[#941004] hover:text-[#941004] hover:bg-[#941004] hover:bg-opacity-10"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl font-semibold text-[#1A1A1A] flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-[#FA5200]" />
              Your Content
            </CardTitle>

            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[#6B6B6B]">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => handlePageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-[#6B6B6B]">per page</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex w-full p-1 m-4 bg-gray-50 rounded-lg">
              <TabsTrigger
                value="questions"
                className="flex-1 flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#FA5200] transition-all duration-300 px-2 py-2 text-sm min-w-0"
              >
                <FileQuestion className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[80px]">Your Questions</span>
                <Badge
                  variant="secondary"
                  className="ml-1 bg-white text-[#6B6B6B] flex-shrink-0 text-xs min-w-[auto]"
                >
                  {questionsTotal}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="replies"
                className="flex-1 flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#FA5200] transition-all duration-300 px-2 py-2 text-sm min-w-0"
              >
                <Reply className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[70px]">Replied To</span>
                <Badge
                  variant="secondary"
                  className="ml-1 bg-white text-[#6B6B6B] flex-shrink-0 text-xs min-w-[auto]"
                >
                  {repliesTotal}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-4 border-[#FEA001] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[#6B6B6B] text-sm">
                    Loading your content...
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            {!isLoading && (
              <>
                <TabsContent value="questions" className="m-0 p-6 pt-0">
                  {userQuestions.length === 0 ? (
                    <EmptyState
                      icon={FileQuestion}
                      title="No questions yet"
                      description="Questions you ask will appear here. Start by asking a question in the Feed."
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userQuestions.map((question) => (
                          <QuestionCard key={question.id} question={question} />
                        ))}
                      </div>
                      {hasMoreQuestions && (
                        <div className="flex justify-center mt-8">
                          <Button
                            onClick={() =>
                              fetchUserQuestions(questionsPage + 1, false)
                            }
                            variant="outline"
                            className="border-[#E5E5E5] text-[#6B6B6B] hover:text-[#FA5200] hover:border-[#FA5200]"
                          >
                            Load More Questions ({userQuestions.length} of{" "}
                            {questionsTotal} loaded)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="replies" className="m-0 p-6 pt-0">
                  {userReplies.length === 0 ? (
                    <EmptyState
                      icon={Reply}
                      title="No replies yet"
                      description="Questions you reply to will appear here. Engage with the community by replying to questions."
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userReplies.map((question) => (
                          <QuestionCard key={question.id} question={question} />
                        ))}
                      </div>
                      {hasMoreReplies && (
                        <div className="flex justify-center mt-8">
                          <Button
                            onClick={() =>
                              fetchUserReplies(repliesPage + 1, false)
                            }
                            variant="outline"
                            className="border-[#E5E5E5] text-[#6B6B6B] hover:text-[#FA5200] hover:border-[#FA5200]"
                          >
                            Load More Questions ({userReplies.length} of{" "}
                            {repliesTotal} loaded)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Question Button */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-8 right-8 h-12 px-4 rounded-full bg-gradient-to-r from-[#FEA001] to-[#FA5200] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-50">
            <Plus className="h-4 w-4 mr-2" />
            Create Question
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Ask a Question</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
                Title *
              </label>
              <Input
                value={newQuestion.title}
                onChange={(e) =>
                  setNewQuestion((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter your question title"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
                Content *
              </label>
              <Textarea
                value={newQuestion.content}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="Describe your question in detail..."
                rows={4}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
                Keywords
              </label>
              <div className="space-y-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyPress}
                  placeholder="Type keywords and press Enter or comma"
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="bg-[#FCE4C2] text-[#81462C] px-2 py-1 flex items-center space-x-1"
                    >
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="hover:text-[#FA5200]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-[#E5E5E5] text-[#6B6B6B] hover:text-[#FA5200] hover:border-[#FA5200]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#FEA001] to-[#FA5200] text-white hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Question"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
