"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import Landing from './Landing';

const roleToPath: Record<string, string> = {
  ADMIN: "/admin",
  LECTURER: "/lecturer",
  STUDENT: "/student",
};

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(roleToPath[user.role] ?? "/student");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return <Landing />;
};

export default Index;

