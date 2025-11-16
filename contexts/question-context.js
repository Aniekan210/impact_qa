"use client";

import { createContext, useContext, useState, useCallback } from "react";

const QuestionContext = createContext();

export function QuestionProvider({ children }) {
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const selectQuestion = useCallback((questionId) => {
    setSelectedQuestionId((currentId) => {
      // If clicking the same question, close it (toggle behavior)
      if (currentId === questionId) {
        return null;
      }
      // Otherwise select the new question
      return questionId;
    });
  }, []);

  const clearSelectedQuestion = useCallback(() => {
    setSelectedQuestionId(null);
  }, []);

  const value = {
    selectedQuestionId,
    selectQuestion,
    clearSelectedQuestion,
  };

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
}

export function useQuestion() {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error("useQuestion must be used within a QuestionProvider");
  }
  return context;
}
