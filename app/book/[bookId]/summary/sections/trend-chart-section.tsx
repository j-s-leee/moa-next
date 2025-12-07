"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { useExpenses, useExpenseSummary } from "@/lib/react-query/queries/expenses";

export function TrendChartSection({
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
  
  // 날짜 범위 계산
  const dateRanges = useMemo(() => {
    if (period === "monthly") {
      // 이번달 (선택된 월)
      const currentMonth = DateTime.fromObject({
        year: selectedMonth.getFullYear(),
        month: selectedMonth.getMonth() + 1,
      });
      const thisMonthStart = currentMonth.startOf("month");
      const thisMonthEnd = currentMonth.endOf("month");
      
      // 지난달
      const lastMonth = currentMonth.minus({ months: 1 });
      const lastMonthStart = lastMonth.startOf("month");
      const lastMonthEnd = lastMonth.endOf("month");
      
      return {
        thisPeriod: {year: currentMonth.year, month: currentMonth.month, startDate: thisMonthStart, endDate: thisMonthEnd },
        lastPeriod: {year: lastMonth.year, month: lastMonth.month, startDate: lastMonthStart, endDate: lastMonthEnd },
      };
    } else {
      // 올해 (선택된 연도)
      const thisYearStart = DateTime.fromObject({ year: selectedYear, month: 1, day: 1 });
      const thisYearEnd = DateTime.fromObject({ year: selectedYear, month: 12, day: 31 }).endOf("year");
      
      // 지난해
      const lastYearStart = DateTime.fromObject({ year: selectedYear - 1, month: 1, day: 1 });
      const lastYearEnd = DateTime.fromObject({ year: selectedYear - 1, month: 12, day: 31 }).endOf("year");
      
      return {
        thisPeriod: {year: selectedYear, startDate: thisYearStart, endDate: thisYearEnd },
        lastPeriod: {year: selectedYear - 1, startDate: lastYearStart, endDate: lastYearEnd },
      };
    }
  }, [period, selectedYear, selectedMonth]);

  // 이번달/올해 지출 데이터 (차트용)
  const { data: thisPeriodExpensesData, isLoading: isLoadingThisPeriod } = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    dateRanges.thisPeriod.year,
    dateRanges.thisPeriod.month
  );

  // 지난달/지난해 지출 데이터 (차트용)
  const { data: lastPeriodExpensesData, isLoading: isLoadingLastPeriod } = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    dateRanges.lastPeriod.year,
    dateRanges.lastPeriod.month
  );

  // 이번 기간 합계 (오늘까지 포함)
  // year/month로 조회하되, 오늘까지의 합계를 위해 endDate 추가
  const thisPeriodEndDate = now.plus({ days: 1 }).startOf("day");
  
  const { data: thisPeriodSummary } = useExpenseSummary(
    bookId,
    null, // startDate
    thisPeriodEndDate, // endDate (오늘까지)
    dateRanges.thisPeriod.year,
    dateRanges.thisPeriod.month
  );

  // 지난 기간 합계 (전체 기간)
  const { data: lastPeriodSummary } = useExpenseSummary(
    bookId,
    null, // startDate
    null, // endDate
    dateRanges.lastPeriod.year,
    dateRanges.lastPeriod.month
  );

  // 비교 계산
  const comparison = useMemo(() => {
    const thisTotal = thisPeriodSummary?.totalAmount || 0;
    const lastTotal = lastPeriodSummary?.totalAmount || 0;
    const difference = thisTotal - lastTotal;
    const isMore = difference > 0;
    const isLess = difference < 0;
    
    return {
      thisTotal,
      lastTotal,
      difference: Math.abs(difference),
      isMore,
      isLess,
    };
  }, [thisPeriodSummary, lastPeriodSummary]);

  // 일별 누적 지출 데이터 준비
  const chartData = useMemo(() => {
    const thisPeriodExpenses = thisPeriodExpensesData?.expenses || [];
    const lastPeriodExpenses = lastPeriodExpensesData?.expenses || [];

    // 이번달/올해 일별 지출 집계
    const thisPeriodDaily = new Map<string, number>();
    thisPeriodExpenses.forEach((expense) => {
      if (expense.date) {
        const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
        const dayOfPeriod = period === "monthly" ? expenseDate.day : expenseDate.ordinal;
        const key = `${dayOfPeriod}`;
        const currentAmount = thisPeriodDaily.get(key) || 0;
        thisPeriodDaily.set(key, currentAmount + expense.amount);
      }
    });

    // 지난달/지난해 일별 지출 집계
    const lastPeriodDaily = new Map<string, number>();
    lastPeriodExpenses.forEach((expense) => {
      if (expense.date) {
        const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
        const dayOfPeriod = period === "monthly" ? expenseDate.day : expenseDate.ordinal;
        const key = `${dayOfPeriod}`;
        const currentAmount = lastPeriodDaily.get(key) || 0;
        lastPeriodDaily.set(key, currentAmount + expense.amount);
      }
    });

    // 최대 일수 계산
    // 이번달/올해: 현재 날짜까지만
    // 지난달/지난해: 월말/연말까지
    const thisPeriodMaxDays = period === "monthly"
      ? Math.min(dateRanges.thisPeriod.endDate.day, now.day)
      : Math.min(dateRanges.thisPeriod.endDate.ordinal, now.ordinal);
    
    const lastPeriodMaxDays = period === "monthly"
      ? dateRanges.lastPeriod.endDate.day
      : dateRanges.lastPeriod.endDate.ordinal;
    
    const maxDays = Math.max(thisPeriodMaxDays, lastPeriodMaxDays);

    // 일별 누적 합계 계산
    let thisPeriodCumulative = 0;
    let lastPeriodCumulative = 0;
    const data = [];

    for (let day = 1; day <= maxDays; day++) {
      const thisDayAmount = day <= thisPeriodMaxDays ? (thisPeriodDaily.get(`${day}`) || 0) : 0;
      const lastDayAmount = lastPeriodDaily.get(`${day}`) || 0;
      
      if (day <= thisPeriodMaxDays) {
        thisPeriodCumulative += thisDayAmount;
      }
      lastPeriodCumulative += lastDayAmount;

      const dateLabel = period === "monthly" 
        ? `${day}일`
        : DateTime.fromObject({ year: selectedYear, month: 1, day: 1 }).plus({ days: day - 1 }).toFormat("MM/dd");

      data.push({
        name: dateLabel,
        day: day,
        이번달: period === "monthly" 
          ? (day <= thisPeriodMaxDays ? thisPeriodCumulative : undefined)
          : (day <= thisPeriodMaxDays ? thisPeriodCumulative : undefined),
        지난달: period === "monthly" ? lastPeriodCumulative : lastPeriodCumulative,
        올해: period === "yearly" 
          ? (day <= thisPeriodMaxDays ? thisPeriodCumulative : undefined)
          : undefined,
        지난해: period === "yearly" ? lastPeriodCumulative : undefined,
      });
    }

    return data;
  }, [thisPeriodExpensesData, lastPeriodExpensesData, dateRanges, period, now, selectedYear]);

  const isLoading = isLoadingThisPeriod || isLoadingLastPeriod;

  if (isLoading) {
    return (
      <Item variant="outline" className="bg-card dark:border-none">
        <ItemHeader>
          <ItemTitle>수입/지출 추이</ItemTitle>
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
    "이번달": {
      label: period === "monthly" ? "이번달" : "올해",
      color: "var(--chart-1)",
    },
    "지난달": {
      label: period === "monthly" ? "지난달" : "지난해",
      color: "var(--chart-2)",
    },
    "올해": {
      label: "올해",
      color: "var(--chart-1)",
    },
    "지난해": {
      label: "지난해",
      color: "var(--chart-2)",
    },
  };

  return (
    <Item variant="outline" className="bg-card dark:border-none h-full">
      <ItemHeader>
        <ItemTitle>오늘까지 <span className="text-blue-600 dark:text-blue-400 font-bold">{comparison.thisTotal.toLocaleString()}원</span> 썼어요</ItemTitle>
      </ItemHeader>
      <ItemContent className="overflow-x-hidden flex flex-col min-h-0">
        <div className="space-y-4 min-w-0 flex-1 flex flex-col">
          {comparison.isMore ? (
            <div className="text-sm text-muted-foreground">
              {period === "monthly" 
                ? `지난달보다 ${comparison.difference.toLocaleString()}원 더 썼어요`
                : `지난해보다 ${comparison.difference.toLocaleString()}원 더 썼어요`}
            </div>
          ) : comparison.isLess ? (
            <div className="text-sm text-muted-foreground">
              {period === "monthly" 
                ? `지난달보다 ${comparison.difference.toLocaleString()}원 덜 썼어요`
                : `지난해보다 ${comparison.difference.toLocaleString()}원 덜 썼어요`}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {period === "monthly" 
                ? `지난달과 같은 금액을 썼어요`
                : `지난해와 같은 금액을 썼어요`}
            </div>
          )}
          {chartData.length > 0 ? (
            <div className="w-full min-w-0 overflow-hidden flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ChartContainer config={chartConfig}>
                  <LineChart data={chartData}>
                    <CartesianGrid horizontal={false} vertical={false} />
                    <XAxis
                      hide
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      hide
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => `${value.toLocaleString()}원`}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line 
                      type="monotone" 
                      dataKey={period === "monthly" ? "이번달" : "올해"}
                      stroke="var(--chart-1)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={period === "monthly" ? "지난달" : "지난해"}
                      stroke="var(--chart-3)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
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

