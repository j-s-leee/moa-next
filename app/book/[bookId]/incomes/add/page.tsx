"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { toast } from "sonner";

/**
 * 수입 추가 페이지
 * TODO: 수입 추가 기능 구현
 */
export default function AddIncomePage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;

  useEffect(() => {
    toast.info("수입 추가 기능은 곧 추가될 예정입니다.");
    router.push(`/book/${bookId}/incomes`);
  }, [bookId, router]);

  return (
    <AppLayout title="수입 추가">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </AppLayout>
  );
}

