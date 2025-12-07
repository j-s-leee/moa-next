"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * 예산 관리 페이지 리다이렉트
 * 첫 번째 개인 가계부로 자동 리다이렉트
 */
export default function BudgetPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToBookBudget() {
      try {
        const response = await fetch("/api/book");
        if (!response.ok) {
          throw new Error("가계부 조회 실패");
        }
        const data = await response.json();
        if (data.books && data.books.length > 0) {
          router.replace(`/book/${data.books[0].id}/budgets`);
        } else {
          router.replace("/book");
        }
      } catch (error) {
        console.error("가계부 조회 오류:", error);
        router.replace("/book");
      }
    }

    redirectToBookBudget();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
