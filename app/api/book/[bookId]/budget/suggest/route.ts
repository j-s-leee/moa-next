import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { budgets, books, categories, expenses } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getToday, getMonthsAgo, getYearsAgo } from "@/lib/utils/date";
import { DateTime } from "luxon";

/**
 * 고정지출 판별 함수
 * 변동계수(CV)가 5% 미만이면 고정지출로 판단
 */
function detectFixedExpense(amounts: number[]): boolean {
  if (amounts.length < 3) {
    return false; // 최소 3개월 데이터 필요
  }

  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  if (mean === 0) {
    return false;
  }

  // 표준편차 계산
  const variance =
    amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    amounts.length;
  const standardDeviation = Math.sqrt(variance);

  // 변동계수(CV) 계산: 표준편차 / 평균
  const coefficientOfVariation = standardDeviation / mean;

  // 변동계수가 5% 미만이면 고정지출로 판단
  return coefficientOfVariation < 0.05;
}

/**
 * 예산 자동 제안 API
 * GET /api/book/[bookId]/budget/suggest?period=monthly|yearly&categoryId=xxx
 *
 * 과거 지출 데이터를 분석하여 예산을 제안합니다.
 *
 * 알고리즘:
 * 1. 최근 3개월(월간) 또는 최근 3년(연간) 지출 데이터 분석
 * 2. 카테고리별 평균 지출 계산
 * 3. 고정지출 판별 (변동계수 5% 미만)
 * 4. 고정지출이고 예산이 이미 설정되어 지출과 예산이 일치하면 제안에서 제외
 * 5. 표준편차를 고려한 안전 마진(10-20%) 추가
 * 6. 제안 금액 반환
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
    const periodParam = searchParams.get("period") as
      | "monthly"
      | "yearly"
      | null;
    const categoryIdParam = searchParams.get("categoryId");

    if (
      !periodParam ||
      (periodParam !== "monthly" && periodParam !== "yearly")
    ) {
      return NextResponse.json(
        { error: "period 파라미터는 monthly 또는 yearly여야 합니다." },
        { status: 400 }
      );
    }

    // 분석 기간 설정
    const endDate = getToday();
    let startDate: DateTime;

    if (periodParam === "monthly") {
      // 최근 3개월 데이터 분석
      startDate = getMonthsAgo(3).startOf("month");
    } else {
      // 최근 3년 데이터 분석
      startDate = getYearsAgo(3).startOf("year");
    }

    // 카테고리별 지출 데이터 조회
    const whereConditions = [
      eq(expenses.bookId, bookId),
      gte(expenses.date, startDate.toFormat("yyyy-MM-dd")),
      lte(expenses.date, endDate.toFormat("yyyy-MM-dd")),
    ];

    if (categoryIdParam) {
      whereConditions.push(eq(expenses.categoryId, categoryIdParam));
    }

    // 카테고리별 지출 집계 (월별/년별 세부 데이터 포함)
    const expenseStats = await db
      .select({
        categoryId: expenses.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          type: categories.type,
          expenseType: categories.expenseType,
        },
        totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
        avgAmount: sql<number>`COALESCE(AVG(${expenses.amount}), 0)`,
        maxAmount: sql<number>`COALESCE(MAX(${expenses.amount}), 0)`,
        minAmount: sql<number>`COALESCE(MIN(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(...whereConditions))
      .groupBy(
        expenses.categoryId,
        categories.id,
        categories.name,
        categories.icon,
        categories.type,
        categories.expenseType
      );

    // 월별/년별 지출 금액 조회 (고정지출 판별용)
    // 월간 예산: 월별 총액 비교
    // 연간 예산: 년별 총액 비교
    const periodExpenses = await db
      .select({
        categoryId: expenses.categoryId,
        amount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(...whereConditions))
      .groupBy(
        expenses.categoryId,
        periodParam === "monthly"
          ? sql`DATE_TRUNC('month', ${expenses.date})`
          : sql`DATE_TRUNC('year', ${expenses.date})`
      );

    // 카테고리별로 월별/년별 지출 총액 그룹화
    const expensesByCategory = new Map<string, number[]>();
    periodExpenses.forEach((expense) => {
      if (!expensesByCategory.has(expense.categoryId)) {
        expensesByCategory.set(expense.categoryId, []);
      }
      expensesByCategory.get(expense.categoryId)!.push(Number(expense.amount));
    });

    // 예산 제안 계산
    const suggestions = expenseStats
      .map((stat) => {
        const totalAmount = Number(stat.totalAmount) || 0;
        const count = Number(stat.count) || 0;
        const avgAmount = Number(stat.avgAmount) || 0;
        const maxAmount = Number(stat.maxAmount) || 0;
        const minAmount = Number(stat.minAmount) || 0;

        if (count === 0) {
          return null;
        }

        // 고정지출 판별
        const categoryExpenses = expensesByCategory.get(stat.categoryId) || [];
        const isFixedExpense = detectFixedExpense(categoryExpenses);

        // 데이터가 충분한지 확인 (최소 2개 이상의 지출 기록 필요)
        if (count < 2) {
          return {
            categoryId: stat.categoryId,
            category: stat.category,
            suggestedAmount: Math.round(avgAmount),
            confidence: "low" as const,
            reason: "데이터가 부족하여 평균값을 기준으로 제안합니다.",
            isFixedExpense: false,
            stats: {
              totalAmount,
              count,
              avgAmount,
              maxAmount,
              minAmount,
            },
          };
        }

        // 제안 알고리즘:
        // 고정지출인 경우: 실제 지출 금액과 동일하게 제안 (안전 마진 없음)
        // 변동지출인 경우:
        //   1. 평균 지출을 기준으로 함
        //   2. 변동성이 큰 경우(최대값과 최소값 차이가 평균의 50% 이상) 안전 마진 20% 추가
        //   3. 변동성이 작은 경우 안전 마진 10% 추가
        const variance = maxAmount - minAmount;
        const varianceRatio = avgAmount > 0 ? variance / avgAmount : 0;

        let suggestedAmount: number;
        let reason: string;

        if (isFixedExpense) {
          // 고정지출: 실제 지출 금액과 동일하게 제안
          suggestedAmount = Math.round(avgAmount);
          reason =
            "고정지출로 판단됩니다. 매월 동일 금액이 지출되므로 실제 지출 금액과 동일하게 제안합니다.";
        } else {
          // 변동지출: 안전 마진 추가
          const safetyMargin = varianceRatio > 0.5 ? 1.2 : 1.1;
          suggestedAmount = Math.round(avgAmount * safetyMargin);
          reason =
            varianceRatio > 0.5
              ? "지출 변동성이 커서 20% 여유를 두고 제안합니다."
              : "평균 지출 기준으로 10% 여유를 두고 제안합니다.";
        }

        // 신뢰도 계산 (데이터 개수와 변동성 기반)
        let confidence: "low" | "medium" | "high" = "medium";
        if (isFixedExpense) {
          // 고정지출은 데이터가 충분하면 높은 신뢰도
          confidence = count >= 3 ? "high" : "medium";
        } else {
          // 변동지출은 기존 로직 유지
          if (count >= 6) {
            confidence = varianceRatio < 0.3 ? "high" : "medium";
          } else if (count >= 3) {
            confidence = "medium";
          } else {
            confidence = "low";
          }
        }

        return {
          categoryId: stat.categoryId,
          category: stat.category,
          suggestedAmount,
          confidence,
          reason,
          isFixedExpense,
          stats: {
            totalAmount,
            count,
            avgAmount,
            maxAmount,
            minAmount,
            variance,
            varianceRatio: Math.round(varianceRatio * 100) / 100,
          },
        };
      })
      .filter((suggestion) => suggestion !== null);

    // 기존 예산이 있는 카테고리 확인
    const existingBudgets = await db
      .select({
        categoryId: budgets.categoryId,
        amount: budgets.amount,
        period: budgets.period,
      })
      .from(budgets)
      .where(and(eq(budgets.bookId, bookId), eq(budgets.period, periodParam)));

    // 기존 예산과 비교하여 제안
    const suggestionsWithComparison = suggestions
      .map((suggestion) => {
        const existingBudget = existingBudgets.find(
          (b) => b.categoryId === suggestion.categoryId
        );

        // 고정지출이고 예산이 이미 설정되어 있고 지출과 예산이 일치하면 제안에서 제외
        if (
          suggestion.isFixedExpense &&
          existingBudget &&
          Math.abs(suggestion.suggestedAmount - existingBudget.amount) < 100 // 100원 이내 차이는 일치로 간주
        ) {
          return null;
        }

        return {
          ...suggestion,
          existingAmount: existingBudget?.amount || null,
          difference: existingBudget?.amount
            ? suggestion.suggestedAmount - existingBudget.amount
            : null,
          differencePercent:
            existingBudget?.amount && existingBudget.amount > 0
              ? Math.round(
                  ((suggestion.suggestedAmount - existingBudget.amount) /
                    existingBudget.amount) *
                    100
                )
              : null,
        };
      })
      .filter((suggestion) => suggestion !== null);

    return NextResponse.json({
      suggestions: suggestionsWithComparison,
      analysisPeriod: {
        startDate: startDate.toFormat("yyyy-MM-dd"),
        endDate: endDate.toFormat("yyyy-MM-dd"),
        period: periodParam,
      },
    });
  } catch (error) {
    console.error("예산 제안 조회 오류:", error);
    return NextResponse.json(
      { error: "예산 제안 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
