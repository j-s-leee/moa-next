"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { DateTime } from "luxon";

/**
 * 지출 목록 페이지
 * TODO: 지출 목록 기능 구현
 */
export default function ExpensesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  return (
    <AppLayout title="지출 내역">
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <p>지출 목록 기능은 곧 추가될 예정입니다.</p>
          {year && <p className="text-sm mt-2">{year}년 {month ? `${month}월` : ""}</p>}
        </div>
      </div>
    </AppLayout>
  );
}

