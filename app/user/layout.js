import Layout from "@/components/ui/layout";
import QuestionDetail from "@/components/ui/question-detail";
import { QuestionProvider } from "@/contexts/question-context";

export default function RootLayout({ children }) {
  return (
    <QuestionProvider>
      <Layout>{children}</Layout>
      <QuestionDetail />
    </QuestionProvider>
  );
}
