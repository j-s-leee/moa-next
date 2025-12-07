"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { CategoryDonutChart } from "../../category/spending-overview/category-donut-chart";
import { useBudgets, type Budget } from "@/lib/react-query/queries/budgets";
import { type ExpenseItem } from "@/lib/react-query/queries/expenses";
import { toast } from "sonner";
import { calculateBudgetUsage } from "../utils";

interface CategoryExpense {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
}

export function CategoryExpenseWithBudgetSection({
  categoryExpensesList,
  totalExpense,
  bookId,
  selectedMonth,
  selectedYear,
  activeTab,
  expenses,
}: {
  categoryExpensesList: CategoryExpense[];
  totalExpense: number;
  bookId: string | null;
  selectedMonth: Date;
  selectedYear: number;
  activeTab: "monthly" | "yearly";
  expenses: ExpenseItem[];
}) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const year = activeTab === "monthly" ? selectedMonth.getFullYear() : selectedYear;
  const month = activeTab === "monthly" ? selectedMonth.getMonth() + 1 : undefined;

  // 월간/연간 예산 모두 조회
  const { data: monthlyBudgetsData } = useBudgets(
    bookId,
    "monthly",
    year,
    month
  );
  const { data: yearlyBudgetsData } = useBudgets(
    bookId,
    "yearly",
    year
  );

  const monthlyBudgets = monthlyBudgetsData?.budgets || [];
  const yearlyBudgets = yearlyBudgetsData?.budgets || [];

  // 카테고리별 예산 매핑 (월간/연간 모두 포함)
  const budgetMap = useMemo(() => {
    const map = new Map<string, {
      monthly: (Budget & { usage: { spent: number; percentage: number; remaining: number } }) | null;
      yearly: (Budget & { usage: { spent: number; percentage: number; remaining: number } }) | null;
    }>();
    
    // 월간 예산 처리
    monthlyBudgets
      .filter((budget) => budget.category !== null)
      .forEach((budget) => {
        const usage = calculateBudgetUsage(budget, expenses, "monthly", year, month);
        const existing = map.get(budget.categoryId) || { monthly: null, yearly: null };
        map.set(budget.categoryId, {
          ...existing,
          monthly: {
            ...budget,
            usage,
          },
        });
      });
    
    // 연간 예산 처리
    yearlyBudgets
      .filter((budget) => budget.category !== null)
      .forEach((budget) => {
        const usage = calculateBudgetUsage(budget, expenses, "yearly", year);
        const existing = map.get(budget.categoryId) || { monthly: null, yearly: null };
        map.set(budget.categoryId, {
          ...existing,
          yearly: {
            ...budget,
            usage,
          },
        });
      });
    
    return map;
  }, [monthlyBudgets, yearlyBudgets, expenses, year, month]);

  // 카테고리별 지출에 예산 정보 추가
  const categoriesWithBudget = useMemo(() => {
    return categoryExpensesList.map((category) => {
      const budgets = budgetMap.get(category.id) || { monthly: null, yearly: null };
      const hasBudget = budgets.monthly !== null || budgets.yearly !== null;
      
      // 현재 활성 탭에 해당하는 예산 우선 표시
      const activeBudget = activeTab === "monthly" ? budgets.monthly : budgets.yearly;
      
      return {
        ...category,
        budgets,
        hasBudget,
        activeBudget: activeBudget ? {
          amount: activeBudget.amount,
          period: activeBudget.period,
          ...activeBudget.usage,
        } : null,
      };
    });
  }, [categoryExpensesList, budgetMap, activeTab]);

  const handleCategoryClick = (categoryId: string) => {
    if (!bookId) {
      toast.error("가계부를 선택해주세요.");
      return;
    }
    if (activeTab === "monthly") {
      router.push(`/book/${bookId}/category/${categoryId}?year=${year}&month=${month}`);
    } else {
      router.push(`/book/${bookId}/category/${categoryId}?year=${year}`);
    }
  };

  const handleViewAll = () => {
    if (!bookId) {
      toast.error("가계부를 선택해주세요.");
      return;
    }
    router.push(`/book/${bookId}/budgets`);
  };

  return (
    <TooltipProvider>
      <Item variant="outline" className="bg-card dark:border-none">
        <ItemHeader>
          <ItemTitle>
            카테고리별 지출
          </ItemTitle>
        </ItemHeader>
        <ItemContent>
          <div className="space-y-4">
            {/* CSS 기반 가로 막대 */}
            {categoryExpensesList.length > 0 && totalExpense > 0 && (
              <div className="w-full py-4">
                <div className="relative w-full h-8 rounded-md overflow-hidden bg-muted">
                  <div className="flex h-full">
                    {categoryExpensesList.map((category, index) => {
                      const percentage =
                        totalExpense > 0
                          ? (category.amount / totalExpense) * 100
                          : 0;
                      const isFirst = index === 0;
                      const isLast = index === categoryExpensesList.length - 1;
                      const isSelected = selectedCategoryId === category.id;
                      
                      return (
                        <Tooltip key={category.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="h-full transition-all cursor-pointer group relative"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: category.color,
                                opacity: selectedCategoryId === null || isSelected ? 1 : 0.3,
                                borderTopLeftRadius: isFirst ? "0.375rem" : "0",
                                borderBottomLeftRadius: isFirst ? "0.375rem" : "0",
                                borderTopRightRadius: isLast ? "0.375rem" : "0",
                                borderBottomRightRadius: isLast ? "0.375rem" : "0",
                              }}
                              onMouseEnter={() => setSelectedCategoryId(category.id)}
                              onMouseLeave={() => setSelectedCategoryId(null)}
                              onClick={() => setSelectedCategoryId(isSelected ? null : category.id)}
                            >
                              {percentage > 5 && (
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  {percentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <p className="font-semibold">{category.name}</p>
                              <p className="text-xs">
                                {category.amount.toLocaleString()}원 ({percentage.toFixed(1)}%)
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 카테고리별 리스트 (예산 정보 포함) */}
            <div className="space-y-2">
              {categoriesWithBudget.map((category) => {
                const percentage =
                  totalExpense > 0
                    ? (category.amount / totalExpense) * 100
                    : 0;
                const isSelected = selectedCategoryId === category.id;
                const isDimmed = selectedCategoryId !== null && !isSelected;
                const hasBudget = category.hasBudget;
                const activeBudget = category.activeBudget;
                const budgetPercentage = activeBudget?.percentage || 0;
                const isOver = budgetPercentage > 100;
                const hasMonthly = category.budgets.monthly !== null;
                const hasYearly = category.budgets.yearly !== null;
                
                return (
                  <div
                    key={category.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer",
                      isDimmed ? "opacity-30" : "hover:bg-accent/50",
                      isSelected && "bg-accent"
                    )}
                    onMouseEnter={() => setSelectedCategoryId(category.id)}
                    onMouseLeave={() => setSelectedCategoryId(null)}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {hasBudget && activeBudget ? (
                        <div className="relative flex items-center justify-center shrink-0">
                          <CategoryDonutChart
                            percentage={budgetPercentage}
                            color={category.color}
                            icon={category.icon || "📦"}
                            isOverBudget={isOver}
                          />
                        </div>
                      ) : (
                        <div
                          className="size-10 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: category.color }}
                        >
                          <span className="text-lg">{category.icon || "📦"}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {hasBudget && activeBudget && (
                              <span className="text-sm">{category.icon || "📦"}</span>
                            )}
                            <p className="text-sm font-medium truncate">{category.name}</p>
                            {hasBudget && activeBudget && isOver && (
                              <Badge variant="destructive" className="text-xs">
                                초과
                              </Badge>
                            )}
                            {/* 예산 기간 표시 */}
                            {hasBudget && (
                              <div className="flex items-center gap-1">
                                {hasMonthly && (
                                  <Badge variant="secondary" className="text-xs">
                                    월간
                                  </Badge>
                                )}
                                {hasYearly && (
                                  <Badge variant="secondary" className="text-xs">
                                    연간
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {category.count}건
                            {hasBudget && activeBudget && (
                              <span className="ml-2">
                                예산: {activeBudget.amount.toLocaleString()}원 ({activeBudget.period === "monthly" ? "월간" : "연간"})
                              </span>
                            )}
                            {!hasBudget && (
                              <span className="ml-2 text-orange-500">
                                예산 미설정
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {category.amount.toLocaleString()}원
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 전체보기 버튼 */}
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleViewAll}
              >
                전체보기
              </Button>
            </div>
          </div>
        </ItemContent>
      </Item>
    </TooltipProvider>
  );
}

