import { Suspense } from "react";
import QuestionBankManagement from "@/features/lecturer/QuestionBankManagement";

export const dynamic = "force-dynamic";

export default function AdminQuestionBankPage() {
  return (
    <Suspense fallback={null}>
      <QuestionBankManagement />
    </Suspense>
  );
}
