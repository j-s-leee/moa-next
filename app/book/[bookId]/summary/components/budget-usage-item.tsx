"use client";

import { Badge } from "@/components/ui/badge";
import { CategoryDonutChart } from "../../category/spending-overview/category-donut-chart";

export function BudgetUsageItem({
  categoryName,
  categoryIcon,
  categoryColor,
  spent,
  amount,
  percentage,
  remaining,
}: {
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string;
  spent: number;
  amount: number;
  percentage: number;
  remaining: number;
}) {
  const isOver = percentage > 100;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="shrink-0">
        <CategoryDonutChart
          percentage={percentage}
          color={categoryColor}
          icon={categoryIcon || "📦"}
          isOverBudget={isOver}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium text-sm truncate">{categoryName}</div>
          <div className="text-xs">{remaining.toLocaleString()}원 남음</div>
          {isOver && (
            <Badge variant="destructive" className="text-xs">
              초과
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {spent.toLocaleString()}원 / {amount.toLocaleString()}원
        </div>
        <div className="text-xs text-muted-foreground">
          {percentage}% 사용
        </div>
      </div>
    </div>
  );
}

