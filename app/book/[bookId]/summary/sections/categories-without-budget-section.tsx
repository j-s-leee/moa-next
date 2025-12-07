"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { useBudgets } from "@/lib/react-query/queries/budgets";
import { toast } from "sonner";

interface CategoryExpense {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
}

export function CategoriesWithoutBudgetSection({
  categoryExpensesList,
  bookId,
  selectedMonth,
  selectedYear,
  activeTab,
}: {
  categoryExpensesList: CategoryExpense[];
  bookId: string | null;
  selectedMonth: Date;
  selectedYear: number;
  activeTab: "monthly" | "yearly";
}) {
  const router = useRouter();
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

  // 예산이 없는 카테고리 필터링
  const categoriesWithoutBudget = useMemo(() => {
    const budgetCategoryIds = new Set<string>();
    
    // 월간/연간 예산 모두에 있는 카테고리 ID 수집
    monthlyBudgets.forEach((budget) => {
      if (budget.categoryId) {
        budgetCategoryIds.add(budget.categoryId);
      }
    });
    yearlyBudgets.forEach((budget) => {
      if (budget.categoryId) {
        budgetCategoryIds.add(budget.categoryId);
      }
    });

    // 지출은 있지만 예산이 없는 카테고리만 필터링
    return categoryExpensesList.filter(
      (category) => !budgetCategoryIds.has(category.id)
    );
  }, [categoryExpensesList, monthlyBudgets, yearlyBudgets]);

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

  const handleSetBudget = () => {
    if (!bookId) {
      toast.error("가계부를 선택해주세요.");
      return;
    }
    router.push(`/book/${bookId}/budgets`);
  };

  if (categoriesWithoutBudget.length === 0) {
    return null;
  }

  return (
    <Item variant="outline" className="bg-card dark:border-none">
      <ItemHeader>
        <ItemTitle>
          예산 미설정 카테고리
        </ItemTitle>
      </ItemHeader>
      <ItemContent>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            지출이 있지만 예산이 설정되지 않은 카테고리입니다. 예산을 설정하여 지출을 관리해보세요.
          </p>
          <div className="space-y-3 min-w-0 md:space-y-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoriesWithoutBudget.map((category) => {
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="size-10 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-lg">{category.icon || "📦"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.count}건
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {category.amount.toLocaleString()}원
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/30"
              onClick={handleSetBudget}
            >
              예산 설정하러 가기
            </Button>
          </div>
        </div>
      </ItemContent>
    </Item>
  );
}

