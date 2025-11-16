"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SortAsc, Loader, RefreshCw } from "lucide-react";
import { debounce } from "lodash";
import QuestionCard from "@/components/ui/question-card";

export default function FeedPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Fetch questions
  const fetchQuestions = useCallback(
    async (searchTerm, sortBy, pageNum, reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const params = new URLSearchParams({
          search: searchTerm,
          sort: sortBy,
          page: pageNum.toString(),
        });

        const response = await fetch(`/api/questions?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (reset) {
          setQuestions(data.questions || []);
        } else {
          setQuestions((prev) => [...prev, ...(data.questions || [])]);
        }
        setPagination(data.pagination || {});
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        setQuestions([]);
        setPagination({});
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      setPage(1);
      fetchQuestions(searchTerm, sort, 1, true);
    }, 500),
    [sort, fetchQuestions]
  );

  // Handle search changes
  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search, debouncedSearch]);

  // Handle sort changes
  useEffect(() => {
    setPage(1);
    fetchQuestions(search, sort, 1, true);
  }, [sort]);

  // Initial load
  useEffect(() => {
    fetchQuestions("", "newest", 1, true);
  }, []);

  const loadMore = () => {
    if (pagination.hasMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchQuestions(search, sort, nextPage, false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchQuestions(search, sort, 1, true);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-2xl w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions by title or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-[#1A1A1A] placeholder-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#FA5200] focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Sort and Refresh */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <SortAsc className="w-4 h-4 text-[#6B6B6B]" />
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-[#E5E5E5] rounded-lg px-3 py-2 text-sm bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FA5200] focus:border-transparent w-full sm:w-auto"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most_replies">Most Replies</option>
                </select>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#FA5200] hover:text-[#F37501] disabled:text-[#6B6B6B] transition-colors border border-[#E5E5E5] rounded-lg hover:border-[#FA5200] disabled:border-[#E5E5E5]"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="text-sm text-[#6B6B6B]">
              {pagination.totalCount !== undefined && (
                <span>
                  {pagination.totalCount} question
                  {pagination.totalCount !== 1 ? "s" : ""} found
                </span>
              )}
            </div>
          )}
        </div>

        {/* Questions Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 text-[#FA5200] animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[#6B6B6B] mb-2">No questions found</div>
            <div className="text-sm text-[#81462C]">
              {search
                ? "Try adjusting your search terms"
                : "Be the first to ask a question!"}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>

            {/* Load More - Minimalistic */}
            {pagination.hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={refreshing}
                  className="text-[#FA5200] hover:text-[#F37501] disabled:text-[#6B6B6B] transition-colors text-sm font-medium py-2 px-4 rounded-lg hover:bg-[#FA5200] hover:bg-opacity-5 disabled:hover:bg-transparent"
                >
                  {refreshing ? (
                    <span className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "View more questions"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
