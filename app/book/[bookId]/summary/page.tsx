"use client";

import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { DateTime } from "luxon";
import { useExpenses, useExpenseSummary, type ExpenseItem } from "@/lib/react-query/queries/expenses";
import { useIncomes, type IncomeItem } from "@/lib/react-query/queries/incomes";
import { useCategories } from "@/lib/react-query/queries/categories";
import { useBudgets, type Budget } from "@/lib/react-query/queries/budgets";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CategorySpendingOverview } from "../category/spending-overview/category-spending-overview";
import { CategoryDonutChart } from "../category/spending-overview/category-donut-chart";

// 카테고리별 색상 매핑 함수 (CSS 변수 사용)
function getCategoryColor(categoryName: string, index: number = 0): string {
  // chart-1부터 chart-5까지 순환 사용
  const chartColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  
  const colorIndex = index % chartColors.length;
  return chartColors[colorIndex];
}

function SummaryCard({
  title,
  amount,
  icon: Icon,
  trend,
  subtitle,
}: {
  title: string;
  amount: number;
  icon?: React.ElementType;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  isExpenseCard?: boolean;
}) {

  return (
    <Item variant="outline" className="bg-card dark:border-none">
      <ItemHeader>
        <ItemTitle>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          {title}
        </ItemTitle>
      </ItemHeader>
      <ItemContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold">{amount.toLocaleString()}원</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </ItemContent>
    </Item>
  );
}

interface InfoRow {
  label: string;
  amount: number;
}

function InfoCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon?: React.ElementType;
  rows: InfoRow[];
}) {
  return (
    <Item variant="outline" className="bg-card dark:border-none">
      <ItemHeader>
        <ItemTitle>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          {title}
        </ItemTitle>
      </ItemHeader>
      <ItemContent>
        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="font-semibold">{row.amount.toLocaleString()}원</p>
            </div>
          ))}
        </div>
      </ItemContent>
    </Item>
  );
}

function RecurringExpenseCard({
  recurringExpensesData,
}: {
  recurringExpensesData: {
    scheduled: { amount: number; date: Date }[];
    completed: { amount: number; date: Date }[];
  };
}) {
  const scheduledCount = recurringExpensesData.scheduled.length;
  const completedCount = recurringExpensesData.completed.length;
  const scheduledAmount = recurringExpensesData.scheduled.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const completedAmount = recurringExpensesData.completed.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const rows: InfoRow[] = [
    {
      label: `예정 ${scheduledCount}건`,
      amount: scheduledAmount,
    },
    {
      label: `완료 ${completedCount}건`,
      amount: completedAmount,
    },
  ];

  return <InfoCard title="정기지출" rows={rows} />;
}

interface CategoryExpense {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
}

function CategoryExpenseSection({
  categoryExpensesList,
  totalExpense,
  bookId,
  selectedMonth,
  selectedYear,
  activeTab,
}: {
  categoryExpensesList: CategoryExpense[];
  totalExpense: number;
  bookId: string | null;
  selectedMonth: Date;
  selectedYear: number;
  activeTab: "monthly" | "yearly";
}) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    if (!bookId) {
      toast.error("가계부를 선택해주세요.");
      return;
    }
    const year = activeTab === "monthly" ? selectedMonth.getFullYear() : selectedYear;
    if (activeTab === "monthly") {
      const month = selectedMonth.getMonth() + 1;
      router.push(`/book/${bookId}/category/${categoryId}?year=${year}&month=${month}`);
    } else {
      router.push(`/book/${bookId}/category/${categoryId}?year=${year}`);
    }
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

          {/* 카테고리별 리스트 */}
          <div className="space-y-2">
            {categoryExpensesList.map((category) => {
              const percentage =
                totalExpense > 0
                  ? (category.amount / totalExpense) * 100
                  : 0;
              const isSelected = selectedCategoryId === category.id;
              const isDimmed = selectedCategoryId !== null && !isSelected;
              
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
                    <div
                      className="size-10 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-lg">{category.icon || "📦"}</span>
                      </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.count}건
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
        </div>
      </ItemContent>
    </Item>
    </TooltipProvider>
  );
}

function MonthSelector({
  selectedDate,
  onDateChange,
  bookId,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  bookId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1;
  const isCurrentMonth = currentYear === nowYear && currentMonth === nowMonth;

  const generateMonthList = () => {
    const months = [];

    for (let month = 1; month <= 12; month++) {
      months.push({
        year: nowYear - 1,
        month,
        label: `${nowYear - 1}년 ${month}월`,
        isCurrentMonth: false,
      });
    }

    for (let month = 1; month <= 12; month++) {
      const isThisMonth = month === nowMonth;
      months.push({
        year: nowYear,
        month,
        label: `${nowYear}년 ${month}월`,
        isCurrentMonth: isThisMonth,
      });
    }

    for (let month = 1; month <= 12; month++) {
      months.push({
        year: nowYear + 1,
        month,
        label: `${nowYear + 1}년 ${month}월`,
        isCurrentMonth: false,
      });
    }

    return months;
  };

  const monthList = generateMonthList();

  const handleMonthSelect = (year: number, month: number) => {
    const newDate = new Date(year, month - 1, 1);
    onDateChange(newDate);
    router.push(`/book/${bookId}/summary?year=${year}&month=${month}`);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span className="flex items-center gap-2">
            {currentYear}년 {currentMonth}월
            {isCurrentMonth && (
              <Badge variant="secondary" className="text-xs">
                이번달
              </Badge>
            )}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>월 선택</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <div className="space-y-1 pt-2">
            {monthList.map((item) => (
              <button
                key={`${item.year}-${item.month}`}
                onClick={() => handleMonthSelect(item.year, item.month)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <span>{item.label}</span>
                {item.isCurrentMonth && (
                  <Badge variant="secondary" className="text-xs">
                    이번달
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function YearSelector({
  selectedYear,
  onYearChange,
  bookId,
}: {
  selectedYear: number;
  onYearChange: (year: number) => void;
  bookId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const now = new Date();
  const nowYear = now.getFullYear();
  const isCurrentYear = selectedYear === nowYear;

  const generateYearList = () => {
    const years = [];
    for (let year = nowYear - 1; year <= nowYear + 1; year++) {
      years.push({
        year,
        label: `${year}년`,
        isCurrentYear: year === nowYear,
      });
    }
    return years;
  };

  const yearList = generateYearList();

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    router.push(`/book/${bookId}/summary?year=${year}`);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span className="flex items-center gap-2">
            {selectedYear}년
            {isCurrentYear && (
              <Badge variant="secondary" className="text-xs">
                올해
              </Badge>
            )}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>연도 선택</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <div className="space-y-1 pt-2">
            {yearList.map((item) => (
              <button
                key={item.year}
                onClick={() => handleYearSelect(item.year)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <span>{item.label}</span>
                {item.isCurrentYear && (
                  <Badge variant="secondary" className="text-xs">
                    올해
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TrendChartSection({
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

function BudgetVsExpenseSection({
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
  const startDate1 = period1 ? (period === "monthly"
    ? DateTime.fromObject({ year: period1.year, month: period1.month!, day: 1 })
    : DateTime.fromObject({ year: period1.year, month: 1, day: 1 })) : now;
  const endDate1 = period1 ? (period === "monthly"
    ? DateTime.fromObject({ year: period1.year, month: period1.month!, day: 1 }).endOf("month")
    : DateTime.fromObject({ year: period1.year, month: 12, day: 31 }).endOf("year")) : now;
  const expense1 = useExpenses(bookId, startDate1, endDate1);

  // 두 번째 기간
  const period2 = periods[1];
  const budget2 = useBudgets(bookId, period, period2?.year || now.year, period2?.month);
  const startDate2 = period2 ? (period === "monthly"
    ? DateTime.fromObject({ year: period2.year, month: period2.month!, day: 1 })
    : DateTime.fromObject({ year: period2.year, month: 1, day: 1 })) : now;
  const endDate2 = period2 ? (period === "monthly"
    ? DateTime.fromObject({ year: period2.year, month: period2.month!, day: 1 }).endOf("month")
    : DateTime.fromObject({ year: period2.year, month: 12, day: 31 }).endOf("year")) : now;
  const expense2 = useExpenses(bookId, startDate2, endDate2);

  // 세 번째 기간
  const period3 = periods[2];
  const budget3 = useBudgets(bookId, period, period3?.year || now.year, period3?.month);
  const startDate3 = period3 ? (period === "monthly"
    ? DateTime.fromObject({ year: period3.year, month: period3.month!, day: 1 })
    : DateTime.fromObject({ year: period3.year, month: 1, day: 1 })) : now;
  const endDate3 = period3 ? (period === "monthly"
    ? DateTime.fromObject({ year: period3.year, month: period3.month!, day: 1 }).endOf("month")
    : DateTime.fromObject({ year: period3.year, month: 12, day: 31 }).endOf("year")) : now;
  const expense3 = useExpenses(bookId, startDate3, endDate3);

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

// 예산별 사용량 계산 함수
function calculateBudgetUsage(
  budget: Budget,
  expenses: ExpenseItem[],
  period: "monthly" | "yearly",
  year: number,
  month?: number
): { spent: number; percentage: number; remaining: number } {
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
    
    if (period === "monthly" && month) {
      return expenseDate.year === year && expenseDate.month === month;
    } else {
      return expenseDate.year === year;
    }
  });

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

  return {
    spent,
    percentage: Math.min(percentage, 100),
    remaining: Math.max(0, budget.amount - spent),
  };
}

// 연간 예산의 누적 사용량 계산 (해당 연도의 1월부터 현재까지)
function calculateYearlyBudgetCumulativeUsage(
  budget: Budget,
  expenses: ExpenseItem[],
  year: number,
  currentMonth?: number
): { spent: number; percentage: number; remaining: number } {
  const now = DateTime.now();
  const targetYear = year;
  const endMonth = currentMonth || now.month;
  
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
    return expenseDate.year === targetYear && expenseDate.month <= endMonth;
  });

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

  return {
    spent,
    percentage: Math.min(percentage, 100),
    remaining: Math.max(0, budget.amount - spent),
  };
}

// 월간 예산의 누적 사용량 계산 (해당 연도의 각 월별 월간 예산에 대한 누적)
function calculateMonthlyBudgetCumulativeUsage(
  monthlyBudgets: Budget[],
  expenses: ExpenseItem[],
  year: number,
  currentMonth?: number
): Map<string, { spent: number; percentage: number; remaining: number; budgetAmount: number }> {
  const now = DateTime.now();
  const targetYear = year;
  const endMonth = currentMonth || now.month;
  
  const result = new Map<string, { spent: number; percentage: number; remaining: number; budgetAmount: number }>();
  
  // 각 카테고리별로 월간 예산 합계 계산
  const categoryBudgetMap = new Map<string, number>();
  monthlyBudgets.forEach((budget) => {
    if (budget.categoryId) {
      const current = categoryBudgetMap.get(budget.categoryId) || 0;
      categoryBudgetMap.set(budget.categoryId, current + budget.amount);
    }
  });
  
  // 각 카테고리별로 해당 연도의 1월부터 현재까지의 누적 지출 계산
  categoryBudgetMap.forEach((totalBudgetAmount, categoryId) => {
    const budgetExpenses = expenses.filter((expense) => {
      if (expense.categoryId !== categoryId) return false;
      const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
      return expenseDate.year === targetYear && expenseDate.month <= endMonth;
    });
    
    const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = totalBudgetAmount > 0 ? Math.round((spent / totalBudgetAmount) * 100) : 0;
    
    result.set(categoryId, {
      spent,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(0, totalBudgetAmount - spent),
      budgetAmount: totalBudgetAmount,
    });
  });
  
  return result;
}

// 도넛 차트 컴포넌트
function DonutChart({ percentage }: { percentage: number }) {
  const data = [
    { name: "사용", value: Math.min(percentage, 100) },
    { name: "남은", value: Math.max(0, 100 - percentage) },
  ];

  const COLORS = ["var(--chart-2)", "var(--muted)"];

  return (
    <ResponsiveContainer width={60} height={60}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={22}
          outerRadius={30}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

// 예산별 사용량 아이템 컴포넌트
function BudgetUsageItem({
  categoryName,
  categoryIcon,
  categoryColor,
  spent,
  amount,
  percentage,
  remaining,
  periodLabel,
}: {
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string;
  spent: number;
  amount: number;
  percentage: number;
  remaining: number;
  periodLabel: string;
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
          {/* <Badge variant="secondary" className="text-xs">
            {periodLabel}
          </Badge> */}
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

// 예산별 사용량 섹션
function BudgetUsageByCategorySection({
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
  const startDate = period === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 })
    : DateTime.fromObject({ year, month: 1, day: 1 });
  const endDate = period === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 }).endOf("month")
    : DateTime.fromObject({ year, month: 12, day: 31 }).endOf("year");

  const { data: expensesData, isLoading: isLoadingExpenses } = useExpenses(
    bookId,
    startDate,
    endDate
  );

  // 연간 누적 지출 데이터 조회 (월간 탭에서 연간 예산용)
  const yearlyStartDate = DateTime.fromObject({ year, month: 1, day: 1 });
  const yearlyEndDate = DateTime.fromObject({ year, month: 12, day: 31 }).endOf("year");
  const { data: yearlyExpensesData } = useExpenses(
    bookId,
    yearlyStartDate,
    yearlyEndDate
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
                  periodLabel={budget.periodLabel}
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
                  periodLabel={budget.periodLabel}
                />
              ))}
            </div>
          </ItemContent>
        </Item>
      )}
    </div>
  );
}

// 예산이 없는 카테고리 목록 섹션
function CategoriesWithoutBudgetSection({
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

// 카테고리별 지출 + 예산 사용량 결합 섹션
function CategoryExpenseWithBudgetSection({
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
                          <DonutChart percentage={budgetPercentage} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                isOver
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              )}
                            >
                              {budgetPercentage}%
                            </span>
                          </div>
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

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;
  
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  
  // URL 쿼리 파라미터에서 year, month 가져오기
  const urlYear = searchParams.get("year");
  const urlMonth = searchParams.get("month");
  
  // 초기 날짜 설정
  const now = new Date();
  const initialYear = urlYear ? parseInt(urlYear, 10) : now.getFullYear();
  const initialMonth = urlMonth ? parseInt(urlMonth, 10) : now.getMonth() + 1;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date(initialYear, initialMonth - 1, 1));
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // URL 파라미터 변경 시 상태 업데이트
  useEffect(() => {
    if (urlYear) {
      const year = parseInt(urlYear, 10);
      setSelectedYear(year);
      if (urlMonth) {
        const month = parseInt(urlMonth, 10);
        setSelectedMonth(new Date(year, month - 1, 1));
        setActiveTab("monthly");
      } else {
        setActiveTab("yearly");
      }
    }
  }, [urlYear, urlMonth]);

  // 날짜 범위 계산
  const year = activeTab === "monthly" ? selectedMonth.getFullYear() : selectedYear;
  const month = activeTab === "monthly" ? selectedMonth.getMonth() + 1 : undefined;

  const startDate = activeTab === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 })
    : DateTime.fromObject({ year, month: 1, day: 1 });
  const endDate = activeTab === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 }).endOf("month")
    : DateTime.fromObject({ year, month: 12, day: 31 }).endOf("year");

  // 실제 데이터 가져오기
  const { data: expensesData } = useExpenses(bookId, startDate, endDate);
  const { data: incomesData } = useIncomes(bookId, startDate, endDate);
  const { data: categoriesData } = useCategories(bookId);
  const { data: budgetsData } = useBudgets(bookId, activeTab, year, month);

  const expenses = expensesData?.expenses || [];
  const incomes = incomesData?.incomes || [];
  const categories = categoriesData?.categories || [];
  const budgets = budgetsData?.budgets || [];

  // 카테고리별 지출 집계
  const categoryExpensesList = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }>();

    // 카테고리 기본 정보 설정
    categories.forEach((category, index) => {
      if (category.type === "expense") {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          icon: category.icon || "📦",
          color: getCategoryColor(category.name, index),
          amount: 0,
          count: 0,
        });
      }
    });

    // 지출 데이터 집계
    let dynamicIndex = categories.filter(c => c.type === "expense").length;
    expenses.forEach((expense) => {
      // expense.category가 있으면 사용, 없으면 categoryId로 찾기
      const categoryId = expense.category?.id || expense.categoryId;
      const category = categoryMap.get(categoryId);
      
      if (category) {
        category.amount += expense.amount;
        category.count += 1;
      } else {
        // 카테고리가 없는 경우 expense.category 정보 사용 또는 기본 카테고리 생성
        const categoryName = expense.category?.name || "기타";
        const categoryIcon = expense.category?.icon || "📦";
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            icon: categoryIcon,
            color: getCategoryColor(categoryName, dynamicIndex),
            amount: 0,
            count: 0,
          });
          dynamicIndex++;
        }
        const newCategory = categoryMap.get(categoryId)!;
        newCategory.amount += expense.amount;
        newCategory.count += 1;
      }
    });

    const sortedCategories = Array.from(categoryMap.values())
      .filter((cat) => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // 정렬 후 색상 재할당 (금액 순으로 정렬된 순서에 맞춰)
    return sortedCategories.map((cat, index) => ({
      ...cat,
      color: getCategoryColor(cat.name, index),
    }));
  }, [expenses, categories]);

  // 반복 수입을 해당 기간의 실제 발생 금액으로 계산하는 함수
  const calculateRecurringIncomeAmount = useMemo(() => {
    return (income: IncomeItem, periodStart: DateTime, periodEnd: DateTime): number => {
      if (!income.period || !income.startDate) {
        return 0;
      }

      const startDate = DateTime.fromISO(income.startDate, { zone: "utc" });
      const endDate = income.endDate
        ? DateTime.fromISO(income.endDate, { zone: "utc" })
        : null;

      // 시작일이 기간 종료일 이후이거나, 종료일이 기간 시작일 이전이면 0
      if (startDate > periodEnd || (endDate && endDate < periodStart)) {
        return 0;
      }

      let occurrences = 0;

      if (income.period === "monthly") {
        // 월간 수입: 기간 내의 각 월에 발생
        const startDay = startDate.day;
        let currentMonth = periodStart.startOf("month");
        
        while (currentMonth <= periodEnd) {
          // 해당 월의 발생일 계산 (시작일의 일자 사용)
          const occurrenceDate = DateTime.utc(
            currentMonth.year,
            currentMonth.month,
            Math.min(startDay, currentMonth.endOf("month").day) // 월의 마지막 일을 초과하지 않도록
          );
          
          // 시작일 이후이고 기간 내에 있는지 확인
          if (occurrenceDate >= startDate && occurrenceDate >= periodStart && occurrenceDate <= periodEnd) {
            // 종료일이 있으면 확인
            if (!endDate || occurrenceDate <= endDate) {
              occurrences++;
            }
          }
          
          currentMonth = currentMonth.plus({ months: 1 });
        }
      } else if (income.period === "yearly") {
        // 연간 수입: 기간 내의 각 연도에 발생
        const startMonth = startDate.month;
        const startDay = startDate.day;
        let currentYear = periodStart.year;
        
        while (currentYear <= periodEnd.year) {
          // 해당 연도의 발생일 계산
          const occurrenceDate = DateTime.utc(currentYear, startMonth, startDay);
          
          // 시작일 이후이고 기간 내에 있는지 확인
          if (occurrenceDate >= startDate && occurrenceDate >= periodStart && occurrenceDate <= periodEnd) {
            // 종료일이 있으면 확인
            if (!endDate || occurrenceDate <= endDate) {
              occurrences++;
            }
          }
          
          currentYear++;
        }
      }

      return income.amount * occurrences;
    };
  }, []);

  // 총 수입 계산 (단일 거래 + 반복 수입)
  const totalIncome = useMemo(() => {
    let sum = 0;

    incomes.forEach((income) => {
      if (income.date) {
        // 단일 거래 수입: 기간 내의 date를 가진 수입
        const incomeDate = DateTime.fromISO(income.date, { zone: "utc" });
        if (incomeDate >= startDate && incomeDate <= endDate) {
          sum += income.amount;
        }
      } else if (income.period && income.startDate) {
        // 반복 수입: 해당 기간에 실제 발생한 금액 계산
        sum += calculateRecurringIncomeAmount(income, startDate, endDate);
      }
    });

    return sum;
  }, [incomes, startDate, endDate, calculateRecurringIncomeAmount]);

  // 예정 수입 계산 (반복 수입 중 아직 발생하지 않은 부분)
  const scheduledIncome = useMemo(() => {
    const now = DateTime.now();
    let sum = 0;

    incomes.forEach((income) => {
      if (income.period && income.startDate) {
        // 반복 수입 중 아직 발생하지 않은 부분 계산
        const futureStart = now < startDate ? startDate : now;
        const futureAmount = calculateRecurringIncomeAmount(income, futureStart, endDate);
        sum += futureAmount;
      }
    });

    return sum;
  }, [incomes, startDate, endDate, calculateRecurringIncomeAmount]);

  // 예산 금액 계산
  const budgetAmount = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.amount, 0);
  }, [budgets]);

  // 총 지출 계산
  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (value: string) => {
    const newTab = value as "monthly" | "yearly";
    setActiveTab(newTab);
    
    if (newTab === "monthly") {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      router.push(`/book/${bookId}/summary?year=${year}&month=${month}`);
    } else {
      router.push(`/book/${bookId}/summary?year=${selectedYear}`);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "홈", href: "/home" }]}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="monthly">월간</TabsTrigger>
            <TabsTrigger value="yearly">연간</TabsTrigger>
          </TabsList>
          {activeTab === "monthly" ? (
            <MonthSelector
              selectedDate={selectedMonth}
              onDateChange={setSelectedMonth}
              bookId={bookId}
            />
          ) : (
            <YearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              bookId={bookId}
            />
          )}
        </div>

        <TabsContent value="monthly">
          <div className="space-y-4">
            {/* 총 수입, 총 지출, 카테고리별 지출 분포 */}
            {/* 모바일: 총 수입/총 지출 2열, md 이상: 3열 */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              <SummaryCard
                title="총 수입"
                amount={totalIncome - scheduledIncome}
                trend="up"
                subtitle={`예정: ${scheduledIncome.toLocaleString()}원`}
              />
              <SummaryCard
                title="총 지출"
                amount={totalExpense}
                trend="down"
                subtitle={`예산: ${budgetAmount.toLocaleString()}원`}
              />
              <div className="col-span-2 md:col-span-1">
                <CategorySpendingOverview categories={categoryExpensesList.map(cat => ({
                  name: cat.name,
                  spent: cat.amount,
                  color: cat.color,
                }))} />
              </div>
            </div>

            <div className="space-y-4 grid gap-4 md:grid-cols-2">
            {/* 수입/지출 추이 그래프 */}
            <TrendChartSection
              bookId={bookId}
              period="monthly"
              selectedYear={selectedMonth.getFullYear()}
              selectedMonth={selectedMonth}
            />
            
            {/* 예산 대비 지출 현황 */}
            <BudgetVsExpenseSection
              bookId={bookId}
              period="monthly"
            />
            </div>
            
            {/* 예산별 사용량 */}
            <BudgetUsageByCategorySection
              bookId={bookId}
              period="monthly"
              selectedYear={selectedMonth.getFullYear()}
              selectedMonth={selectedMonth}
              />
            
            {/* 예산 미설정 카테고리 */}
            <CategoriesWithoutBudgetSection
              categoryExpensesList={categoryExpensesList}
              bookId={bookId}
              selectedMonth={selectedMonth}
              selectedYear={selectedMonth.getFullYear()}
              activeTab="monthly"
              />
              </div>


        </TabsContent>

        <TabsContent value="yearly">
          <div className="space-y-4">
            {/* 총 수입, 총 지출, 카테고리별 지출 분포 */}
            {/* 모바일: 총 수입/총 지출 2열, md 이상: 3열 */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              <SummaryCard
                title="총 수입"
                amount={totalIncome}
                trend="up"
                subtitle={`예정: ${scheduledIncome.toLocaleString()}원`}
              />
              <SummaryCard
                title="총 지출"
                amount={totalExpense}
                trend="down"
                subtitle={`예산: ${budgetAmount.toLocaleString()}원`}
              />
              <div className="col-span-2 md:col-span-1">
                <CategorySpendingOverview categories={categoryExpensesList.map(cat => ({
                  name: cat.name,
                  spent: cat.amount,
                  color: cat.color,
                }))} />
              </div>
            </div>
            <div className="space-y-4 grid gap-4 md:grid-cols-2">
            {/* 수입/지출 추이 그래프 */}
            <TrendChartSection
              bookId={bookId}
              period="yearly"
              selectedYear={selectedYear}
              selectedMonth={new Date(selectedYear, 0, 1)}
            />

            {/* 예산 대비 지출 현황 */}
            <BudgetVsExpenseSection
              bookId={bookId}
              period="yearly"
            />
            </div>
            
            {/* 예산별 사용량 */}
            <BudgetUsageByCategorySection
              bookId={bookId}
              period="yearly"
              selectedYear={selectedYear}
              selectedMonth={new Date(selectedYear, 0, 1)}
            />
            
            {/* 예산 미설정 카테고리 */}
            <CategoriesWithoutBudgetSection
              categoryExpensesList={categoryExpensesList}
              bookId={bookId}
              selectedMonth={new Date(selectedYear, 0, 1)}
              selectedYear={selectedYear}
              activeTab="yearly"
            />

          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Link href={`/book/${bookId}/expenses/add`}>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">내역 추가</span>
        </Button>
      </Link>
    </AppLayout>
  );
}

