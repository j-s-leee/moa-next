"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { useBudgets } from "@/lib/react-query/queries/budgets";
import { useExpenses } from "@/lib/react-query/queries/expenses";
import { calculateBudgetUsage, calculateYearlyBudgetCumulativeUsage } from "../../summary/utils";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CategoryExpense {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  amount: number;
  count: number;
}

interface CategoryExpensesSectionProps {
  categoryExpensesList: CategoryExpense[];
  bookId: string | null;
  period: "monthly" | "yearly";
  selectedYear: number;
  selectedMonth: Date;
  expenses: any[];
}

export function CategoryExpensesSection({
  categoryExpensesList,
  bookId,
  period,
  selectedYear,
  selectedMonth,
  expenses,
}: CategoryExpensesSectionProps) {
  const router = useRouter();
  const year = period === "monthly" ? selectedMonth.getFullYear() : selectedYear;
  const month = period === "monthly" ? selectedMonth.getMonth() + 1 : undefined;

  // 현재 기간 예산 데이터 조회
  const { data: currentBudgetsData } = useBudgets(bookId, period, year, month);

  // 연간 예산 데이터 조회 (월간 탭에서 연간 예산용)
  const { data: yearlyBudgetsData } = useBudgets(bookId, "yearly", year);

  // 월간 예산 데이터 조회 (연간 탭에서 월간 예산용)
  const { data: monthlyBudgetsData } = useBudgets(bookId, "monthly", year);

  // 연간 누적 지출 데이터 조회 (월간 탭에서 연간 예산용)
  const { data: yearlyExpensesData } = useExpenses(bookId, null, null, year, undefined);

  const currentBudgets = currentBudgetsData?.budgets || [];
  const yearlyBudgets = yearlyBudgetsData?.budgets || [];
  const monthlyBudgets = monthlyBudgetsData?.budgets || [];
  const yearlyExpenses = yearlyExpensesData?.expenses || [];

  // 카테고리별 예산 정보 매핑 (여러 예산을 배열로 저장)
  const categoryBudgetsMap = useMemo(() => {
    const map = new Map<string, any[]>();

    // 현재 기간 예산
    currentBudgets.forEach((budget) => {
      if (budget.categoryId) {
        const usage = calculateBudgetUsage(budget, expenses, period, year, month);
        if (!map.has(budget.categoryId)) {
          map.set(budget.categoryId, []);
        }
        map.get(budget.categoryId)!.push({
          ...budget,
          ...usage,
          periodLabel: period === "monthly" ? "월간" : "연간",
        });
      }
    });

    // 월간 탭에서 연간 예산도 표시
    if (period === "monthly") {
      yearlyBudgets.forEach((budget) => {
        if (budget.categoryId) {
          const existingBudgets = map.get(budget.categoryId) || [];
          // 이미 연간 예산이 있는지 확인
          const hasYearly = existingBudgets.some((b) => b.periodLabel === "연간");
          if (!hasYearly) {
            const usage = calculateYearlyBudgetCumulativeUsage(
              budget,
              yearlyExpenses,
              year,
              month
            );
            if (!map.has(budget.categoryId)) {
              map.set(budget.categoryId, []);
            }
            map.get(budget.categoryId)!.push({
              ...budget,
              ...usage,
              periodLabel: "연간",
            });
          }
        }
      });
    }

    // 연간 탭에서 월간 예산도 표시
    if (period === "yearly") {
      monthlyBudgets.forEach((budget) => {
        if (budget.categoryId) {
          const existingBudgets = map.get(budget.categoryId) || [];
          // 이미 월간 예산이 있는지 확인
          const hasMonthly = existingBudgets.some((b) => b.periodLabel === "월간");
          if (!hasMonthly) {
            // 연간 탭에서는 월간 예산의 사용량 계산이 필요 없으므로 기본 정보만 저장
            if (!map.has(budget.categoryId)) {
              map.set(budget.categoryId, []);
            }
            map.get(budget.categoryId)!.push({
              ...budget,
              periodLabel: "월간",
            });
          }
        }
      });
    }

    return map;
  }, [currentBudgets, yearlyBudgets, monthlyBudgets, expenses, yearlyExpenses, period, year, month]);

  const handleCategoryClick = (categoryId: string) => {
    if (!bookId) return;
    if (period === "monthly") {
      router.push(`/book/${bookId}/category/${categoryId}?year=${year}&month=${month}`);
    } else {
      router.push(`/book/${bookId}/category/${categoryId}?year=${year}`);
    }
  };

  // 예산이 있는 카테고리와 없는 카테고리 분리
  const categoriesWithBudget = useMemo(() => {
    return categoryExpensesList.filter((category) => {
      const budgets = categoryBudgetsMap.get(category.id) || [];
      return budgets.length > 0;
    });
  }, [categoryExpensesList, categoryBudgetsMap]);

  const categoriesWithoutBudget = useMemo(() => {
    return categoryExpensesList.filter((category) => {
      const budgets = categoryBudgetsMap.get(category.id) || [];
      return budgets.length === 0;
    });
  }, [categoryExpensesList, categoryBudgetsMap]);

  // 카테고리 아이템 렌더링 함수
  const renderCategoryItem = (category: CategoryExpense) => {
    const budgets = categoryBudgetsMap.get(category.id) || [];
    const IconComponent = category.icon
      ? ((LucideIcons as any)[category.icon] as LucideIcon) || null
      : null;
    const categoryColor = category.color;

    return (
      <div
        key={category.id}
        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        onClick={() => handleCategoryClick(category.id)}
      >
        <div className="shrink-0">
          <div
            className="size-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: categoryColor }}
          >
            {IconComponent ? (
              <IconComponent className="h-5 w-5 text-white" />
            ) : (
              <span className="text-lg">{category.icon || "📦"}</span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between md:flex-col md:items-start md:gap-1">
          <div className="font-medium text-sm truncate flex items-center gap-1.5">
            <span>{category.name}</span>
            {budgets.length > 0 && (
              <div className="flex items-center gap-1">
                {budgets.map((budget, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {budget.periodLabel}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="text-xs font-semibold text-foreground flex items-center">
            {category.amount.toLocaleString()}원
          </div>
        </div>
      </div>
    );
  };

  if (categoryExpensesList.length === 0) {
    return (
      <Item variant="outline" className="bg-card dark:border-none">
        <ItemHeader>
          <ItemTitle>카테고리별 지출</ItemTitle>
        </ItemHeader>
        <ItemContent>
          <div className="text-center py-8 text-muted-foreground">
            지출 내역이 없습니다.
          </div>
        </ItemContent>
      </Item>
    );
  }

  return (
    <>
      {/* 예산이 있는 카테고리 */}
      {categoriesWithBudget.length > 0 && (
        <Item variant="outline" className="bg-card dark:border-none">
          <ItemHeader>
            <ItemTitle>카테고리별 지출</ItemTitle>
          </ItemHeader>
          <ItemContent className="overflow-x-hidden">
            <div className="space-y-3 min-w-0 md:space-y-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoriesWithBudget.map((category) =>
                renderCategoryItem(category)
              )}
            </div>
          </ItemContent>
        </Item>
      )}

      {/* 예산이 없는 카테고리 */}
      {categoriesWithoutBudget.length > 0 && (
        <Item variant="outline" className="bg-card dark:border-none">
          <ItemHeader>
            <ItemTitle>예산 미설정 카테고리</ItemTitle>
          </ItemHeader>
          <ItemContent className="overflow-x-hidden">
            <div className="space-y-3 min-w-0 md:space-y-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoriesWithoutBudget.map((category) =>
                renderCategoryItem(category)
              )}
            </div>
          </ItemContent>
        </Item>
      )}
    </>
  );
}

