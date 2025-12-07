import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { incomes, books, categories } from "@/lib/db/schema";
import {
  eq,
  and,
  gte,
  lte,
  lt,
  desc,
  or,
  isNull,
  isNotNull,
} from "drizzle-orm";
import { NextResponse } from "next/server";
import { isValidDateString, extractYearMonthDayFromDateTime } from "@/lib/utils/date";
import { DateTime } from "luxon";

/**
 * 수입 목록 조회 API
 * GET /api/book/[bookId]/income?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&year=YYYY&month=MM&incomeType=actual|transfer
 *
 * 특정 가계부의 수입 목록을 조회합니다.
 * 쿼리 파라미터로 기간 및 수입 타입 필터링 가능합니다.
 * 
 * 필터링 우선순위:
 * 1. year와 month가 모두 제공되면 → year/month 사용 (단일 거래만, 인덱스 최적화)
 * 2. year만 제공되면 → year 사용 (단일 거래만, 인덱스 최적화)
 * 3. startDate/endDate가 제공되면 → date 또는 startDate/endDate 사용 (범위 쿼리)
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
    const incomeTypeParam = searchParams.get("incomeType");

    // 날짜 파싱 및 검증 (YYYY-MM-DD 형식)
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

    // 수입 타입 검증
    if (
      incomeTypeParam &&
      incomeTypeParam !== "actual" &&
      incomeTypeParam !== "transfer"
    ) {
      return NextResponse.json(
        { error: "수입 타입은 actual 또는 transfer여야 합니다." },
        { status: 400 }
      );
    }

    // 수입 조회 조건 구성
    const whereConditions = [eq(incomes.bookId, bookId)];

    // 기간 필터링: year/month 우선, 그 다음 startDate/endDate
    // year와 month가 모두 제공되면 단일 거래에 대해 year/month 사용 (인덱스 최적화)
    if (year !== null && month !== null) {
      // 단일 거래만 필터링 (year/month는 단일 거래에만 사용)
      const singleTransactionCondition = and(
        isNotNull(incomes.date), // date가 있어야 단일 거래
        eq(incomes.year, year),
        eq(incomes.month, month)
      )!;
      
      // 반복 수입은 startDate/endDate 범위로 필터링 (기존 로직)
      let recurringIncomeCondition = null;
      if (startDate || endDate) {
        if (startDate && endDate) {
          const endDateCheck = or(
            gte(incomes.endDate, startDate.toFormat("yyyy-MM-dd")),
            isNull(incomes.endDate)
          )!;
          recurringIncomeCondition = and(
            isNotNull(incomes.period), // period가 있으면 반복 수입
            lt(incomes.startDate, endDate.toFormat("yyyy-MM-dd")),
            endDateCheck
          )!;
        } else if (startDate) {
          const endDateCheck = or(
            gte(incomes.endDate, startDate.toFormat("yyyy-MM-dd")),
            isNull(incomes.endDate)
          )!;
          recurringIncomeCondition = and(
            isNotNull(incomes.period),
            endDateCheck
          )!;
        } else if (endDate) {
          recurringIncomeCondition = and(
            isNotNull(incomes.period),
            lt(incomes.startDate, endDate.toFormat("yyyy-MM-dd"))
          )!;
        }
      }
      
      if (recurringIncomeCondition) {
        whereConditions.push(
          or(singleTransactionCondition, recurringIncomeCondition)!
        );
      } else {
        whereConditions.push(singleTransactionCondition);
      }
    } else if (year !== null) {
      // year만 제공되면 단일 거래에 대해 year 사용 (인덱스 최적화)
      const singleTransactionCondition = and(
        isNotNull(incomes.date),
        eq(incomes.year, year)
      )!;
      
      // 반복 수입은 startDate/endDate 범위로 필터링
      let recurringIncomeCondition = null;
      if (startDate || endDate) {
        if (startDate && endDate) {
          const endDateCheck = or(
            gte(incomes.endDate, startDate.toFormat("yyyy-MM-dd")),
            isNull(incomes.endDate)
          )!;
          recurringIncomeCondition = and(
            isNotNull(incomes.period),
            lt(incomes.startDate, endDate.toFormat("yyyy-MM-dd")),
            endDateCheck
          )!;
        } else if (startDate) {
          const endDateCheck = or(
            gte(incomes.endDate, startDate.toFormat("yyyy-MM-dd")),
            isNull(incomes.endDate)
          )!;
          recurringIncomeCondition = and(
            isNotNull(incomes.period),
            endDateCheck
          )!;
        } else if (endDate) {
          recurringIncomeCondition = and(
            isNotNull(incomes.period),
            lt(incomes.startDate, endDate.toFormat("yyyy-MM-dd"))
          )!;
        }
      }
      
      if (recurringIncomeCondition) {
        whereConditions.push(
          or(singleTransactionCondition, recurringIncomeCondition)!
        );
      } else {
        whereConditions.push(singleTransactionCondition);
      }
    } else if (startDate || endDate) {
      // 기존 방식: startDate/endDate 범위 쿼리
      if (startDate && endDate) {
        // 두 날짜 모두 있는 경우:
        // 1. 단일 거래: date가 기간 내에 있는 경우
        // 2. 반복 수입: 기간이 겹치는 경우
        const endDateCheck = or(
          gte(incomes.endDate, startDate.toFormat("yyyy-MM-dd")),
          isNull(incomes.endDate)
        )!;
        const singleTransactionCondition = and(
          isNull(incomes.period), // period가 null이면 단일 거래
          gte(incomes.date, startDate.toFormat("yyyy-MM-dd")),
          lt(incomes.date, endDate.toFormat("yyyy-MM-dd"))
        )!;
        const recurringIncomeCondition = and(
          isNotNull(incomes.period), // period가 있으면 반복 수입
          lt(incomes.startDate, endDate.toFormat("yyyy-MM-dd")),
          endDateCheck
        )!;
        whereConditions.push(
          or(singleTransactionCondition, recurringIncomeCondition)!
        );
      } else if (startDate) {
        // startDate만 있는 경우
        const endDateCheck = or(
          gte(incomes.startDate, startDate.toFormat("yyyy-MM-dd")),
          isNull(incomes.endDate)
        )!;
        const singleTransactionCondition = and(
          isNull(incomes.period),
          gte(incomes.date, startDate.toFormat("yyyy-MM-dd"))
        )!;
        const recurringIncomeCondition = and(
          isNotNull(incomes.period),
          endDateCheck
        )!;
        whereConditions.push(
          or(singleTransactionCondition, recurringIncomeCondition)!
        );
      } else if (endDate) {
        // endDate만 있는 경우
        const singleTransactionCondition = and(
          isNull(incomes.period),
          lt(incomes.date, endDate.toFormat("yyyy-MM-dd"))
        )!;
        const recurringIncomeCondition = and(
          isNotNull(incomes.period),
          lt(incomes.startDate, endDate.toFormat("yyyy-MM-dd"))
        )!;
        whereConditions.push(
          or(singleTransactionCondition, recurringIncomeCondition)!
        );
      }
    }

    if (incomeTypeParam) {
      whereConditions.push(
        eq(incomes.incomeType, incomeTypeParam as "actual" | "transfer")
      );
    }

    // 수입 목록 조회 (카테고리 정보 포함)
    // categoryId가 null일 수 있으므로 조건부 조인
    const incomeList = await db
      .select({
        id: incomes.id,
        bookId: incomes.bookId,
        categoryId: incomes.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          type: categories.type,
        },
        amount: incomes.amount,
        date: incomes.date, // 단일 거래 날짜 추가
        period: incomes.period,
        source: incomes.source,
        incomeType: incomes.incomeType,
        transferredFromBookId: incomes.transferredFromBookId,
        startDate: incomes.startDate,
        endDate: incomes.endDate,
        createdAt: incomes.createdAt,
        updatedAt: incomes.updatedAt,
      })
      .from(incomes)
      .leftJoin(categories, eq(incomes.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(incomes.startDate), desc(incomes.createdAt));

    return NextResponse.json({
      incomes: incomeList,
    });
  } catch (error) {
    console.error("수입 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "수입 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 수입 추가 API
 * POST /api/book/[bookId]/income
 *
 * 새로운 수입을 추가합니다.
 */
export async function POST(
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

    // 요청 본문 파싱
    const body = await request.json();
    const {
      categoryId,
      amount,
      date,
      period,
      source,
      incomeType,
      startDate,
      endDate,
      transferredFromBookId,
    } = body;

    // 유효성 검사
    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "카테고리는 필수입니다." },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "금액은 0보다 큰 숫자여야 합니다." },
        { status: 400 }
      );
    }

    // 단일 거래 vs 반복 수입 구분
    const isSingleTransaction = !!date && !period && !startDate;
    const isRecurringIncome = !!period && !!startDate && !date;

    if (!isSingleTransaction && !isRecurringIncome) {
      return NextResponse.json(
        {
          error:
            "단일 거래(date) 또는 반복 수입(period, startDate) 중 하나를 선택해야 합니다.",
        },
        { status: 400 }
      );
    }

    // 카테고리 확인 (해당 가계부에 속하는지)
    const [category] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.bookId, bookId),
          eq(categories.type, "income") // 수입 카테고리만 허용
        )
      )
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "카테고리를 찾을 수 없거나 해당 가계부에 속하지 않습니다." },
        { status: 404 }
      );
    }

    const finalIncomeType = incomeType || "actual";
    if (finalIncomeType !== "actual" && finalIncomeType !== "transfer") {
      return NextResponse.json(
        { error: "수입 타입은 actual 또는 transfer여야 합니다." },
        { status: 400 }
      );
    }

    // 단일 거래인 경우
    let incomeDate: string | null = null;
    let incomeYear: number | null = null;
    let incomeMonth: number | null = null;
    let incomeDay: number | null = null;
    if (isSingleTransaction) {
      try {
        if (typeof date !== "string" || !isValidDateString(date)) {
          return NextResponse.json(
            { error: "날짜는 YYYY-MM-DD 형식이어야 합니다." },
            { status: 400 }
          );
        }
        const dateTime = DateTime.fromISO(date);
        if (!dateTime.isValid) {
          return NextResponse.json(
            { error: "잘못된 날짜 형식입니다." },
            { status: 400 }
          );
        }
        incomeDate = dateTime.toFormat("yyyy-MM-dd");
        // year/month/day 추출
        const { year, month, day } = extractYearMonthDayFromDateTime(dateTime);
        incomeYear = year;
        incomeMonth = month;
        incomeDay = day;
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "잘못된 날짜 형식입니다.",
          },
          { status: 400 }
        );
      }
    }

    // 반복 수입인 경우
    let incomeStartDate: string | null = null;
    let incomeEndDate: string | null = null;
    if (isRecurringIncome) {
      if (!period || (period !== "monthly" && period !== "yearly")) {
        return NextResponse.json(
          { error: "반복 수입인 경우 기간(monthly 또는 yearly)은 필수입니다." },
          { status: 400 }
        );
      }

      if (!startDate) {
        return NextResponse.json(
          { error: "반복 수입인 경우 시작 날짜는 필수입니다." },
          { status: 400 }
        );
      }

      try {
        if (typeof startDate !== "string" || !isValidDateString(startDate)) {
          return NextResponse.json(
            { error: "시작 날짜는 YYYY-MM-DD 형식이어야 합니다." },
            { status: 400 }
          );
        }
        const startDateTime = DateTime.fromISO(startDate);
        if (!startDateTime.isValid) {
          return NextResponse.json(
            { error: "잘못된 시작 날짜 형식입니다." },
            { status: 400 }
          );
        }
        incomeStartDate = startDateTime.toFormat("yyyy-MM-dd");
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

      if (endDate) {
        try {
          if (typeof endDate !== "string" || !isValidDateString(endDate)) {
            return NextResponse.json(
              { error: "종료 날짜는 YYYY-MM-DD 형식이어야 합니다." },
              { status: 400 }
            );
          }
          const endDateTime = DateTime.fromISO(endDate);
          if (!endDateTime.isValid) {
            return NextResponse.json(
              { error: "잘못된 종료 날짜 형식입니다." },
              { status: 400 }
            );
          }
          incomeEndDate = endDateTime.toFormat("yyyy-MM-dd");

          // 날짜 비교
          if (endDateTime < DateTime.fromISO(incomeStartDate!)) {
            return NextResponse.json(
              { error: "종료 날짜는 시작 날짜보다 빠를 수 없습니다." },
              { status: 400 }
            );
          }
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
    }

    // 이체인 경우 출처 가계부 확인
    if (finalIncomeType === "transfer" && transferredFromBookId) {
      const [transferredFromBook] = await db
        .select()
        .from(books)
        .where(
          and(
            eq(books.id, transferredFromBookId),
            eq(books.ownerId, authUser.id)
          )
        )
        .limit(1);

      if (!transferredFromBook) {
        return NextResponse.json(
          { error: "출처 가계부를 찾을 수 없거나 접근 권한이 없습니다." },
          { status: 404 }
        );
      }
    }

    // 수입 생성
    const [newIncome] = await db
      .insert(incomes)
      .values({
        bookId,
        categoryId,
        amount: Math.round(amount), // 소수점 제거
        date: incomeDate, // 단일 거래 날짜 (nullable, YYYY-MM-DD 형식)
        year: incomeYear, // 단일 거래 연도 (nullable, date가 있을 때만)
        month: incomeMonth, // 단일 거래 월 (nullable, date가 있을 때만)
        day: incomeDay, // 단일 거래 일 (nullable, date가 있을 때만)
        period: isRecurringIncome ? period : null, // 반복 주기 (nullable)
        source: source?.trim() || null, // 선택사항
        incomeType: finalIncomeType,
        transferredFromBookId:
          finalIncomeType === "transfer" ? transferredFromBookId || null : null,
        startDate: incomeStartDate, // 반복 수입 시작일 (nullable, YYYY-MM-DD 형식)
        endDate: incomeEndDate, // 반복 수입 종료일 (nullable, YYYY-MM-DD 형식)
        updatedAt: new Date(),
      })
      .returning({
        id: incomes.id,
        bookId: incomes.bookId,
        categoryId: incomes.categoryId,
        amount: incomes.amount,
        date: incomes.date,
        period: incomes.period,
        source: incomes.source,
        incomeType: incomes.incomeType,
        transferredFromBookId: incomes.transferredFromBookId,
        startDate: incomes.startDate,
        endDate: incomes.endDate,
        createdAt: incomes.createdAt,
        updatedAt: incomes.updatedAt,
      });

    if (!newIncome) {
      return NextResponse.json(
        { error: "수입 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    // 카테고리 정보 포함하여 반환
    return NextResponse.json(
      {
        ...newIncome,
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          type: category.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("수입 추가 오류:", error);

    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "수입 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
