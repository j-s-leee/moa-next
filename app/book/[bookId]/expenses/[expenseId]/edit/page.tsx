"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { toast } from "sonner";

/**
 * 지출 수정 페이지
 * TODO: 지출 수정 기능 구현
 */
export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;
  const expenseId = params.expenseId as string;

  useEffect(() => {
    toast.info("지출 수정 기능은 곧 추가될 예정입니다.");
    router.push(`/book/${bookId}/expenses`);
  }, [bookId, expenseId, router]);

  return (
    <AppLayout title="지출 수정">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </AppLayout>
  );
}

