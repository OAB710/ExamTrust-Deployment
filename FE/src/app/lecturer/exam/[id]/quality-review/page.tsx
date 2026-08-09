"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyQualityReviewRedirect() {
  const params = useParams();
  const router = useRouter();
  const routeId = params?.id;
  const examId = Array.isArray(routeId) ? routeId[0] : routeId;

  useEffect(() => {
    if (examId) router.replace(`/lecturer/analytics?examId=${encodeURIComponent(examId)}`);
  }, [examId, router]);

  return null;
}
