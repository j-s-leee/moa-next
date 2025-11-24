import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { expenses, books, categories } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isValidDateString } from "@/lib/utils/date";
import { DateTime } from "luxon";

/**
 * 지출 목록 조회 API
 * GET /api/book/[bookId]/expense?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&categoryId=xxx
 *
 * 특정 가계부의 지출 목록을 조회합니다.
 * 쿼리 파라미터로 기간 및 카테고리 필터링 가능합니다.
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
    const categoryIdParam = searchParams.get("categoryId");

    // 날짜 파싱 및 검증 (YYYY-MM-DD 형식)
    let startDate: DateTime | null = null;
    let endDate: DateTime | null = null;

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

    // 카테고리 ID 검증 (해당 가계부의 카테고리인지 확인)
    if (categoryIdParam) {
      const [category] = await db
        .select()
        .from(categories)
        .where(
          and(eq(categories.id, categoryIdParam), eq(categories.bookId, bookId))
        )
        .limit(1);

      if (!category) {
        return NextResponse.json(
          { error: "카테고리를 찾을 수 없거나 해당 가계부에 속하지 않습니다." },
          { status: 404 }
        );
      }
    }

    // 지출 조회 조건 구성
    const whereConditions = [eq(expenses.bookId, bookId)];

    if (startDate) {
      whereConditions.push(
        gte(expenses.date, startDate.toFormat("yyyy-MM-dd"))
      );
    }

    if (endDate) {
      whereConditions.push(lt(expenses.date, endDate.toFormat("yyyy-MM-dd")));
    }

    if (categoryIdParam) {
      whereConditions.push(eq(expenses.categoryId, categoryIdParam));
    }

    // 지출 목록 조회 (카테고리 정보 포함)
    const expenseList = await db
      .select({
        id: expenses.id,
        bookId: expenses.bookId,
        categoryId: expenses.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          type: categories.type,
        },
        amount: expenses.amount,
        date: expenses.date,
        description: expenses.description,
        userId: expenses.userId,
        budgetId: expenses.budgetId,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(expenses.date), desc(expenses.createdAt));

    return NextResponse.json({
      expenses: expenseList,
    });
  } catch (error) {
    console.error("지출 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "지출 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 지출 추가 API
 * POST /api/book/[bookId]/expense
 *
 * 새로운 지출을 추가합니다.
 * 예산은 자동으로 연결됩니다 (같은 가계부의 같은 카테고리에 대한 예산이 있는 경우).
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
    const { categoryId, amount, date, description } = body;

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

    if (!date) {
      return NextResponse.json(
        { error: "날짜는 필수입니다." },
        { status: 400 }
      );
    }

    let expenseDate: DateTime;
    try {
      if (typeof date !== "string" || !isValidDateString(date)) {
        return NextResponse.json(
          { error: "날짜는 YYYY-MM-DD 형식이어야 합니다." },
          { status: 400 }
        );
      }
      expenseDate = DateTime.fromFormat(date, "yyyy-MM-dd");
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "잘못된 날짜 형식입니다.",
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
          eq(categories.type, "expense") // 지출 카테고리만 허용
        )
      )
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "카테고리를 찾을 수 없거나 해당 가계부에 속하지 않습니다." },
        { status: 404 }
      );
    }

    // 예산 자동 연결 로직
    // 같은 가계부의 같은 카테고리에 대한 예산 찾기
    // 지출 날짜가 포함되는 예산 찾기 (startDate <= expense.date <= endDate)
    const { budgets } = await import("@/lib/db/schema");

    const [activeBudget] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.bookId, bookId),
          eq(budgets.categoryId, categoryId),
          lte(budgets.startDate, expenseDate.toFormat("yyyy-MM-dd")),
          gte(budgets.endDate, expenseDate.toFormat("yyyy-MM-dd"))
        )
      )
      .limit(1);

    const budgetId = activeBudget?.id || null;

    // 지출 생성
    const [newExpense] = await db
      .insert(expenses)
      .values({
        bookId,
        categoryId,
        amount: Math.round(amount), // 소수점 제거
        date: expenseDate.toFormat("yyyy-MM-dd"),
        description: description?.trim() || null,
        userId: authUser.id,
        budgetId,
        updatedAt: new Date(),
      })
      .returning({
        id: expenses.id,
        bookId: expenses.bookId,
        categoryId: expenses.categoryId,
        amount: expenses.amount,
        date: expenses.date,
        description: expenses.description,
        userId: expenses.userId,
        budgetId: expenses.budgetId,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      });

    if (!newExpense) {
      return NextResponse.json(
        { error: "지출 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    // 카테고리 정보 포함하여 반환
    return NextResponse.json(
      {
        ...newExpense,
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
    console.error("지출 추가 오류:", error);

    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "지출 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
