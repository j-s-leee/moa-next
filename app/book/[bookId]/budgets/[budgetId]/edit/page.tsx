"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { toast } from "sonner";

/**
 * 예산 수정 페이지
 * TODO: 예산 수정 기능 구현
 */
export default function EditBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;
  const budgetId = params.budgetId as string;

  useEffect(() => {
    toast.info("예산 수정 기능은 곧 추가될 예정입니다.");
    router.push(`/book/${bookId}/budgets`);
  }, [bookId, budgetId, router]);

  return (
    <AppLayout title="예산 수정">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </AppLayout>
  );
}

