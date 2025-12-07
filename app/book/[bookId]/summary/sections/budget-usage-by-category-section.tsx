"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { useExpenses } from "@/lib/react-query/queries/expenses";
import { useBudgets } from "@/lib/react-query/queries/budgets";
import { BudgetUsageItem } from "../components/budget-usage-item";
import { getCategoryColor, calculateBudgetUsage, calculateYearlyBudgetCumulativeUsage } from "../utils";

export function BudgetUsageByCategorySection({
  bookId,
  period,
  selectedYear,
  selectedMonth,
}: {
  bookId: string | null;
  period: "monthly" | "yearly";
  selectedYear: number;
  selectedMonth: Date;
}) {
  const now = DateTime.now();
  const year = period === "monthly" ? selectedMonth.getFullYear() : selectedYear;
  const month = period === "monthly" ? selectedMonth.getMonth() + 1 : undefined;

  // 현재 기간 예산 데이터 조회
  const { data: currentBudgetsData, isLoading: isLoadingCurrentBudgets } = useBudgets(
    bookId,
    period,
    year,
    month
  );

  // 다른 기간 예산 데이터 조회 (월간 탭에서만 연간 예산 조회)
  const { data: otherBudgetsData, isLoading: isLoadingOtherBudgets } = useBudgets(
    bookId,
    "yearly",
    year,
    period === "monthly" ? undefined : undefined
  );

  // 지출 데이터 조회
  const { data: expensesData, isLoading: isLoadingExpenses } = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    year,
    month
  );

  // 연간 누적 지출 데이터 조회 (월간 탭에서 연간 예산용)
  const { data: yearlyExpensesData } = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    year,
    undefined // 연간 데이터는 month 없이
  );

  const currentBudgets = currentBudgetsData?.budgets || [];
  const otherBudgets = otherBudgetsData?.budgets || [];
  const expenses = expensesData?.expenses || [];
  const yearlyExpenses = yearlyExpensesData?.expenses || [];

  // 현재 기간 예산별 사용량 계산
  const currentBudgetsWithUsage = useMemo(() => {
    return currentBudgets
      .filter((budget) => budget.category !== null)
      .map((budget, index) => {
        const usage = calculateBudgetUsage(budget, expenses, period, year, month);
        return {
          ...budget,
          categoryName: budget.category!.name,
          categoryIcon: budget.category!.icon,
          categoryColor: getCategoryColor(budget.category!.name, index),
          periodLabel: period === "monthly" ? "월간" : "연간",
          ...usage,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [currentBudgets, expenses, period, year, month]);

  // 다른 기간 예산별 누적 사용량 계산 (월간 탭에서만 연간 예산)
  const otherBudgetsWithUsage = useMemo(() => {
    if (period === "monthly") {
      // 월간 탭: 연간 예산의 누적 사용량
      return otherBudgets
        .filter((budget) => budget.category !== null)
        .map((budget, index) => {
          const usage = calculateYearlyBudgetCumulativeUsage(budget, yearlyExpenses, year, month);
          return {
            ...budget,
            categoryName: budget.category!.name,
            categoryIcon: budget.category!.icon,
            categoryColor: getCategoryColor(budget.category!.name, index),
            periodLabel: "연간",
            ...usage,
          };
        })
        .sort((a, b) => b.percentage - a.percentage);
    }
    return [];
  }, [otherBudgets, yearlyExpenses, period, year, month]);

  const isLoading = isLoadingCurrentBudgets || (period === "monthly" && isLoadingOtherBudgets) || isLoadingExpenses;

  if (isLoading) {
    return (
      <Item variant="outline" className="bg-card dark:border-none">
        <ItemHeader>
          <ItemTitle>예산별 사용량</ItemTitle>
        </ItemHeader>
        <ItemContent>
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </ItemContent>
      </Item>
    );
  }

  if (currentBudgetsWithUsage.length === 0 && (period !== "monthly" || otherBudgetsWithUsage.length === 0)) {
    return (
      <Item variant="outline" className="bg-card dark:border-none">
        <ItemHeader>
          <ItemTitle>예산별 사용량</ItemTitle>
        </ItemHeader>
        <ItemContent>
          <div className="text-center py-8 text-muted-foreground">
            설정된 예산이 없습니다.
          </div>
        </ItemContent>
      </Item>
    );
  }

  return (
    <div className="space-y-4">
      {/* 현재 기간 예산 */}
      {currentBudgetsWithUsage.length > 0 && (
        <Item variant="outline" className="bg-card dark:border-none">
          <ItemHeader>
            <ItemTitle>{period === "monthly" ? "월간" : "연간"} 예산별 사용량</ItemTitle>
          </ItemHeader>
          <ItemContent className="overflow-x-hidden">
            <div className="space-y-3 min-w-0 md:space-y-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentBudgetsWithUsage.map((budget) => (
                <BudgetUsageItem
                  key={budget.id}
                  categoryName={budget.categoryName}
                  categoryIcon={budget.categoryIcon}
                  categoryColor={budget.categoryColor}
                  spent={budget.spent}
                  amount={budget.amount}
                  percentage={budget.percentage}
                  remaining={budget.remaining}
                />
              ))}
            </div>
          </ItemContent>
        </Item>
      )}

      {/* 월간 탭에서만 연간 예산 누적 사용량 */}
      {period === "monthly" && otherBudgetsWithUsage.length > 0 && (
        <Item variant="outline" className="bg-card dark:border-none">
          <ItemHeader>
            <ItemTitle>연간 예산별 누적 사용량</ItemTitle>
          </ItemHeader>
          <ItemContent className="overflow-x-hidden">
            <div className="space-y-3 min-w-0 md:space-y-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {otherBudgetsWithUsage.map((budget) => (
                <BudgetUsageItem
                  key={budget.id}
                  categoryName={budget.categoryName}
                  categoryIcon={budget.categoryIcon}
                  categoryColor={budget.categoryColor}
                  spent={budget.spent}
                  amount={budget.amount}
                  percentage={budget.percentage}
                  remaining={budget.remaining}
                />
              ))}
            </div>
          </ItemContent>
        </Item>
      )}
    </div>
  );
}

