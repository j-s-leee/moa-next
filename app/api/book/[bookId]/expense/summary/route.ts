import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { expenses, books } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isValidDateString } from "@/lib/utils/date";
import { DateTime } from "luxon";

/**
 * 지출 합계 조회 API
 * GET /api/book/[bookId]/expense/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&year=YYYY&month=MM
 *
 * 특정 가계부의 지출 합계를 조회합니다.
 * 쿼리 파라미터로 기간 필터링 가능합니다.
 * 
 * 필터링 우선순위:
 * 1. year와 month가 모두 제공되면 → year/month 사용 (특정 월 조회, 인덱스 최적화)
 * 2. year만 제공되면 → year 사용 (특정 년 조회, 인덱스 최적화)
 * 3. startDate/endDate가 제공되면 → date 사용 (범위 쿼리)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // 현재 사용자 세션 확인
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { bookId } = await params;

    // 가계부 소유권 확인
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.ownerId, authUser.id)))
      .limit(1);

    if (!book) {
      return NextResponse.json(
        { error: "가계부를 찾을 수 없거나 접근 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    // 날짜 파싱 및 검증
    let startDate: DateTime | null = null;
    let endDate: DateTime | null = null;
    let year: number | null = null;
    let month: number | null = null;

    // year/month 파라미터 파싱
    if (yearParam) {
      const parsedYear = parseInt(yearParam, 10);
      if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
        return NextResponse.json(
          { error: "연도는 1900-2100 사이의 숫자여야 합니다." },
          { status: 400 }
        );
      }
      year = parsedYear;
    }

    if (monthParam) {
      const parsedMonth = parseInt(monthParam, 10);
      if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return NextResponse.json(
          { error: "월은 1-12 사이의 숫자여야 합니다." },
          { status: 400 }
        );
      }
      month = parsedMonth;
    }

    // startDate/endDate 파라미터 파싱
    if (startDateParam) {
      try {
        if (!isValidDateString(startDateParam)) {
          return NextResponse.json(
            { error: "시작 날짜는 YYYY-MM-DD 형식이어야 합니다." },
            { status: 400 }
          );
        }
        startDate = DateTime.fromISO(startDateParam);
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "잘못된 시작 날짜 형식입니다.",
          },
          { status: 400 }
        );
      }
    }

    if (endDateParam) {
      try {
        if (!isValidDateString(endDateParam)) {
          return NextResponse.json(
            { error: "종료 날짜는 YYYY-MM-DD 형식이어야 합니다." },
            { status: 400 }
          );
        }
        endDate = DateTime.fromISO(endDateParam);
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "잘못된 종료 날짜 형식입니다.",
          },
          { status: 400 }
        );
      }
    }

    // 지출 합계 조회 조건 구성
    const whereConditions = [eq(expenses.bookId, bookId)];

    // 필터링 우선순위: year/month > startDate/endDate
    if (year !== null && month !== null) {
      whereConditions.push(eq(expenses.year, year));
      whereConditions.push(eq(expenses.month, month));
    } else if (year !== null) {
      whereConditions.push(eq(expenses.year, year));
    } else if (startDate || endDate) {
      if (startDate) {
        whereConditions.push(
          gte(expenses.date, startDate.toFormat("yyyy-MM-dd"))
        );
      }
      if (endDate) {
        // endDate는 포함하지 않도록 < 연산자 사용 (기존 expense API와 일관성 유지)
        whereConditions.push(
          lt(expenses.date, endDate.toFormat("yyyy-MM-dd"))
        );
      }
    }

    // 지출 합계 조회
    const [result] = await db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(and(...whereConditions));

    return NextResponse.json({
      totalAmount: Number(result?.totalAmount || 0),
      count: Number(result?.count || 0),
    });
  } catch (error) {
    console.error("지출 합계 조회 오류:", error);
    return NextResponse.json(
      { error: "지출 합계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

