"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { useExpenses } from "@/lib/react-query/queries/expenses";
import { useBudgets } from "@/lib/react-query/queries/budgets";

export function BudgetVsExpenseSection({
  bookId,
  period,
}: {
  bookId: string | null;
  period: "monthly" | "yearly";
}) {
  const now = DateTime.now();
  
  // 기간별 데이터 준비
  const periods = useMemo(() => {
    if (period === "monthly") {
      // 최근 3개월
      return Array.from({ length: 3 }, (_, i) => {
        const date = now.minus({ months: 2 - i });
        return {
          year: date.year,
          month: date.month,
          label: `${date.year}년 ${date.month}월`,
        };
      });
    } else {
      // 최근 3년
      return Array.from({ length: 3 }, (_, i) => {
        const year = now.year - (2 - i);
        return {
          year,
          month: undefined,
          label: `${year}년`,
        };
      });
    }
  }, [period, now]);

  // 각 기간별 예산과 지출 데이터 가져오기 (개별 Hook 호출)
  // 첫 번째 기간
  const period1 = periods[0];
  const budget1 = useBudgets(bookId, period, period1?.year || now.year, period1?.month);
  const expense1 = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    period1?.year || now.year,
    period1?.month
  );

  // 두 번째 기간
  const period2 = periods[1];
  const budget2 = useBudgets(bookId, period, period2?.year || now.year, period2?.month);
  const expense2 = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    period2?.year || now.year,
    period2?.month
  );

  // 세 번째 기간
  const period3 = periods[2];
  const budget3 = useBudgets(bookId, period, period3?.year || now.year, period3?.month);
  const expense3 = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    period3?.year || now.year,
    period3?.month
  );

  // 차트 데이터 준비
  const chartData = useMemo(() => {
    const data = [];
    
    // 첫 번째 기간
    if (period1) {
      const budgets1 = budget1?.data?.budgets || [];
      const expenses1 = expense1?.data?.expenses || [];
      const totalBudget1 = budgets1.reduce((sum, budget) => sum + budget.amount, 0);
      const totalExpense1 = expenses1.reduce((sum, expense) => sum + expense.amount, 0);
      data.push({
        name: period1.label,
        예산: totalBudget1,
        지출: totalExpense1,
      });
    }

    // 두 번째 기간
    if (period2) {
      const budgets2 = budget2?.data?.budgets || [];
      const expenses2 = expense2?.data?.expenses || [];
      const totalBudget2 = budgets2.reduce((sum, budget) => sum + budget.amount, 0);
      const totalExpense2 = expenses2.reduce((sum, expense) => sum + expense.amount, 0);
      data.push({
        name: period2.label,
        예산: totalBudget2,
        지출: totalExpense2,
      });
    }

    // 세 번째 기간
    if (period3) {
      const budgets3 = budget3?.data?.budgets || [];
      const expenses3 = expense3?.data?.expenses || [];
      const totalBudget3 = budgets3.reduce((sum, budget) => sum + budget.amount, 0);
      const totalExpense3 = expenses3.reduce((sum, expense) => sum + expense.amount, 0);
      data.push({
        name: period3.label,
        예산: totalBudget3,
        지출: totalExpense3,
      });
    }

    return data;
  }, [budget1, expense1, budget2, expense2, budget3, expense3, period1, period2, period3]);

  const isLoading = budget1.isLoading || expense1.isLoading || 
                    budget2.isLoading || expense2.isLoading || 
                    budget3.isLoading || expense3.isLoading;

  if (isLoading) {
    return (
      <Item variant="outline" className="bg-card dark:border-none">
        <ItemHeader>
          <ItemTitle>예산 대비 지출 현황</ItemTitle>
        </ItemHeader>
        <ItemContent>
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </ItemContent>
      </Item>
    );
  }

  const chartConfig: ChartConfig = {
    "예산": {
      label: "예산",
      color: "var(--chart-2)",
    },
    "지출": {
      label: "지출",
      color: "var(--chart-3)",
    },
  };

  return (
    <Item variant="outline" className="bg-card dark:border-none">
      <ItemHeader>
        <ItemTitle>예산 대비 지출 현황</ItemTitle>
      </ItemHeader>
      <ItemContent className="overflow-x-hidden flex flex-col min-h-0">
        <div className="space-y-4 min-w-0 flex-1 flex flex-col">
          <div className="text-sm text-muted-foreground">
            {period === "monthly" ? "최근 3개월" : "최근 3년"} 기간별 총 예산과 총 지출
          </div>
          {chartData.length > 0 ? (
            <div className="w-full min-w-0 overflow-hidden flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer config={chartConfig}>
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} horizontal={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="예산" fill="var(--chart-2)" radius={4} />
                    <Bar dataKey="지출" fill="var(--chart-3)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              데이터가 없습니다.
            </div>
          )}
        </div>
      </ItemContent>
    </Item>
  );
}

