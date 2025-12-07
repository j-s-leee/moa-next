"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  Loader2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps, RadialBarChart, RadialBar, PolarGrid, PolarRadiusAxis } from "recharts";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBudgets, useExpenses, useDeleteBudget, type ExpenseItem as QueryExpenseItem, type Budget } from "@/lib/react-query/queries";
import { DateTime } from "luxon";

// ExpenseItem은 쿼리 훅에서 import한 타입 사용
type ExpenseItem = Pick<QueryExpenseItem, "id" | "categoryId" | "amount" | "date">;

interface BudgetUsage {
  spent: number;
  percentage: number;
  remaining: number;
}

interface BudgetWithUsage extends Omit<Budget, 'category'> {
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
    expenseType?: "fixed" | "variable" | "annual" | "one-time" | null;
  }; // filter로 null 제외했으므로 항상 존재
  categoryName: string;
  categoryIcon: LucideIcon | null;
  spent: number;
  percentage: number;
  remaining: number;
}

// 현재 월/년도에 적용되는 예산 찾기
function getActiveBudgets(
  budgets: Budget[],
  period: "monthly" | "yearly",
  targetYear: number,
  targetMonth?: number
): Budget[] {
  const { DateTime } = require('luxon');
  
  return budgets.filter((budget) => {
    if (budget.period !== period) return false;

    const startDate = DateTime.fromISO(budget.startDate, { zone: 'utc' });
    const endDate = DateTime.fromISO(budget.endDate, { zone: 'utc' });

    if (period === "monthly" && targetMonth) {
      // 월간: 해당 월의 1일 ~ 마지막일
      const monthStart = DateTime.utc(targetYear, targetMonth, 1);
      const monthEnd = monthStart.endOf('month');
      return startDate <= monthEnd && endDate >= monthStart;
    } else {
      // 연간: 해당 년의 1월 1일 ~ 12월 31일
      const yearStart = DateTime.utc(targetYear, 1, 1);
      const yearEnd = DateTime.utc(targetYear, 12, 31);
      return startDate <= yearEnd && endDate >= yearStart;
    }
  });
}

// 월간 예산 사용량 계산
function calculateMonthlyBudgetUsage(
  budget: Budget,
  expenses: ExpenseItem[],
  year: number,
  month: number
): BudgetUsage {
  const { DateTime } = require('luxon');
  
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = DateTime.fromISO(expense.date, { zone: 'utc' });
    return (
      expenseDate.year === year &&
      expenseDate.month === month
    );
  });

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    spent,
    percentage: Math.round((spent / budget.amount) * 100),
    remaining: budget.amount - spent,
  };
}

// 연간 예산 사용량 계산
function calculateYearlyBudgetUsage(
  budget: Budget,
  expenses: ExpenseItem[],
  year: number
): BudgetUsage {
  const { DateTime } = require('luxon');
  
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = DateTime.fromISO(expense.date, { zone: 'utc' });
    return expenseDate.year === year;
  });

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    spent,
    percentage: Math.round((spent / budget.amount) * 100),
    remaining: budget.amount - spent,
  };
}

function DonutChart({ percentage }: { percentage: number }) {
  const data = [
    { name: "사용", value: percentage },
    { name: "남은", value: 100 - percentage },
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

function BudgetItem({
  budget,
  onEdit,
  onDelete,
  isDeleting,
}: {
  budget: BudgetWithUsage;
  onEdit: (budget: BudgetWithUsage) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const percentage = Math.min(budget.percentage, 100);
  const isFixedExpense = budget.category.expenseType === "fixed";
  // 고정지출인 경우: 정확히 100% 사용하는 것이 정상이므로 초과로 간주하지 않음
  // 변동지출인 경우: 100% 초과 시에만 초과로 간주
  const isOverBudget = !isFixedExpense && budget.spent > budget.amount;
  // 고정지출인 경우 경고 표시하지 않음
  const isWarning = !isFixedExpense && percentage >= 80 && percentage < 100;
  const isCritical = !isFixedExpense && percentage >= 100;
  const Icon = budget.categoryIcon;

  // 경고 레벨에 따른 색상 결정
  // 고정지출인 경우 경고 색상 표시하지 않음
  const getWarningColor = () => {
    if (isFixedExpense) return "";
    if (isCritical) return "text-red-600 dark:text-red-400";
    if (isWarning) return "text-orange-600 dark:text-orange-400";
    return "";
  };

  const getWarningBadge = () => {
    // 고정지출인 경우 경고 표시하지 않음
    if (isFixedExpense) {
      return null;
    }
    if (isCritical) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          초과
        </Badge>
      );
    }
    if (isWarning) {
      return (
        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          경고
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="relative flex items-center justify-center">
        <DonutChart percentage={percentage} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-semibold ${getWarningColor()}`}
          >
            {percentage}%
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <span className="text-sm">{budget.category.icon || "📦"}</span>
          )}
          <div className="font-medium">{budget.categoryName}</div>
          {isFixedExpense && (
            <Badge variant="outline" className="text-xs">
              고정지출
            </Badge>
          )}
          {getWarningBadge()}
        </div>
        <div className="text-sm text-muted-foreground">
          예산: {budget.amount.toLocaleString()}원
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          사용: {budget.spent.toLocaleString()}원 / 남은: {budget.remaining.toLocaleString()}원
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(budget)}>
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">수정</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">삭제</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>예산 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말 이 예산을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(budget.id)}>
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function MonthSelector({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);

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
}: {
  selectedYear: number;
  onYearChange: (year: number) => void;
}) {
  const [open, setOpen] = useState(false);

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

export default function BudgetPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;
  
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // 날짜 범위 계산
  const year = activeTab === "monthly" ? selectedMonth.getFullYear() : selectedYear;
  const month = activeTab === "monthly" ? selectedMonth.getMonth() + 1 : undefined;
  
  const startDate = activeTab === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 })
    : DateTime.fromObject({ year, month: 1, day: 1 });
  const endDate = activeTab === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 }).endOf("month")
    : DateTime.fromObject({ year, month: 12, day: 31 }).endOf("year");
  
  // 월간/연간 예산 모두 조회
  const { data: monthlyBudgetsData, isLoading: isLoadingMonthlyBudgets } = useBudgets(
    bookId,
    "monthly",
    year,
    month
  );
  const { data: yearlyBudgetsData, isLoading: isLoadingYearlyBudgets } = useBudgets(
    bookId,
    "yearly",
    year
  );
  
  // 지출 목록 조회 (월간/연간 모두 필요)
  const monthlyStartDate = activeTab === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 })
    : DateTime.fromObject({ year, month: 1, day: 1 });
  const monthlyEndDate = activeTab === "monthly"
    ? DateTime.fromObject({ year, month: month!, day: 1 }).endOf("month")
    : DateTime.fromObject({ year, month: 12, day: 31 }).endOf("year");
  const yearlyStartDate = DateTime.fromObject({ year, month: 1, day: 1 });
  const yearlyEndDate = DateTime.fromObject({ year, month: 12, day: 31 }).endOf("year");
  
  const { data: monthlyExpensesData, isLoading: isLoadingMonthlyExpenses } = useExpenses(
    bookId,
    monthlyStartDate,
    monthlyEndDate
  );
  const { data: yearlyExpensesData, isLoading: isLoadingYearlyExpenses } = useExpenses(
    bookId,
    yearlyStartDate,
    yearlyEndDate
  );
  
  const monthlyBudgets = monthlyBudgetsData?.budgets || [];
  const yearlyBudgets = yearlyBudgetsData?.budgets || [];
  const monthlyExpenses = monthlyExpensesData?.expenses || [];
  const yearlyExpenses = yearlyExpensesData?.expenses || [];
  const isLoading = isLoadingMonthlyBudgets || isLoadingYearlyBudgets || 
                    isLoadingMonthlyExpenses || isLoadingYearlyExpenses;
  
  // 예산 삭제
  const deleteBudget = useDeleteBudget();

  const handleEdit = (budget: BudgetWithUsage) => {
    router.push(`/book/${bookId}/budgets/${budget.id}/edit`);
  };

  const handleDelete = (id: string) => {
    if (!bookId) return;
    deleteBudget.mutate({ bookId, budgetId: id });
  };

  const handleAdd = () => {
    router.push(`/book/${bookId}/budgets/add`);
  };

  // 현재 선택된 기간에 적용되는 예산 조회 (월간/연간 모두)
  const activeMonthlyBudgets = getActiveBudgets(
    monthlyBudgets,
    "monthly",
    year,
    month
  );
  const activeYearlyBudgets = getActiveBudgets(
    yearlyBudgets,
    "yearly",
    year
  );

  // 카테고리별로 그룹화하여 월간/연간 예산 함께 표시
  const budgetsByCategory = useMemo(() => {
    const categoryMap = new Map<string, {
      category: Budget['category'];
      monthly: BudgetWithUsage | null;
      yearly: BudgetWithUsage | null;
    }>();

    // 월간 예산 처리
    activeMonthlyBudgets
      .filter((budget) => budget.category !== null)
      .forEach((budget) => {
        if (!budget.category) return;
        
        const IconComponent = budget.category.icon
          ? (LucideIcons[budget.category.icon as keyof typeof LucideIcons] as LucideIcon)
          : null;

        const usage = calculateMonthlyBudgetUsage(
          budget,
          monthlyExpenses,
          year,
          month!
        );

        const existing = categoryMap.get(budget.categoryId) || {
          category: budget.category,
          monthly: null,
          yearly: null,
        };
        
        categoryMap.set(budget.categoryId, {
          ...existing,
          monthly: {
            ...budget,
            category: budget.category, // 타입 가드로 이미 null이 아님을 확인했음
            categoryName: budget.category.name,
            categoryIcon: IconComponent,
            ...usage,
          },
        });
      });

    // 연간 예산 처리
    activeYearlyBudgets
      .filter((budget) => budget.category !== null)
      .forEach((budget) => {
        if (!budget.category) return;
        
        const IconComponent = budget.category.icon
          ? (LucideIcons[budget.category.icon as keyof typeof LucideIcons] as LucideIcon)
          : null;

        const usage = calculateYearlyBudgetUsage(
          budget,
          yearlyExpenses,
          year
        );

        const existing = categoryMap.get(budget.categoryId) || {
          category: budget.category,
          monthly: null,
          yearly: null,
        };
        
        categoryMap.set(budget.categoryId, {
          ...existing,
          yearly: {
            ...budget,
            category: budget.category, // 타입 가드로 이미 null이 아님을 확인했음
            categoryName: budget.category.name,
            categoryIcon: IconComponent,
            ...usage,
          },
        });
      });

    return Array.from(categoryMap.values());
  }, [activeMonthlyBudgets, activeYearlyBudgets, monthlyExpenses, yearlyExpenses, year, month]);

  // 현재 활성 탭에 해당하는 예산만 필터링 (차트용)
  const budgetsWithUsage: BudgetWithUsage[] = budgetsByCategory
    .map((item: { category: Budget['category']; monthly: BudgetWithUsage | null; yearly: BudgetWithUsage | null }) => {
      const activeBudget = activeTab === "monthly" ? item.monthly : item.yearly;
      return activeBudget;
    })
    .filter((budget: BudgetWithUsage | null): budget is BudgetWithUsage => budget !== null);

  // 예산 대비 지출 차트 데이터 준비
  const chartData = budgetsWithUsage.map((budget) => ({
    name: budget.categoryName,
    예산: budget.amount,
    지출: budget.spent,
    남은: Math.max(0, budget.remaining),
  }));

  // 예산 초과 알림 (페이지 로드 시 한 번만)
  // 고정지출은 제외
  useEffect(() => {
    if (!isLoading && budgetsWithUsage.length > 0) {
      const overBudgets = budgetsWithUsage.filter(
        (b) => b.spent > b.amount && b.category.expenseType !== "fixed"
      );
      const warningBudgets = budgetsWithUsage.filter(
        (b) =>
          b.percentage >= 80 &&
          b.percentage < 100 &&
          b.category.expenseType !== "fixed"
      );

      if (overBudgets.length > 0) {
        toast.warning(
          `${overBudgets.length}개의 예산이 초과되었습니다.`,
          {
            description: overBudgets.map((b) => b.categoryName).join(", "),
          }
        );
      } else if (warningBudgets.length > 0) {
        toast.info(
          `${warningBudgets.length}개의 예산이 80% 이상 사용되었습니다.`,
          {
            description: warningBudgets.map((b) => b.categoryName).join(", "),
          }
        );
      }
    }
  }, [budgetsWithUsage, isLoading]);

  const handleBack = () => {
    // 컨텍스트 메뉴를 통해 직접 접근한 경우를 대비해 부모 라우트로 이동
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/book");
    }
  };

  return (
    <AppLayout
      title="예산 관리"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!bookId) return;
              try {
                const response = await fetch(
                  `/api/book/${bookId}/budget/suggest?period=${activeTab}`
                );
                if (!response.ok) throw new Error("예산 제안 조회 실패");
                const data = await response.json();
                router.push(`/book/${bookId}/budgets/suggest?period=${activeTab}`);
              } catch (error) {
                toast.error("예산 제안을 불러오는데 실패했습니다.");
              }
            }}
          >
            예산 제안
          </Button>
          <Button variant="ghost" size="icon" onClick={handleAdd}>
            <Plus className="size-4" />
            <span className="sr-only">추가</span>
          </Button>
        </div>
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "monthly" | "yearly")}
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
            />
          ) : (
            <YearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          )}
        </div>

        <TabsContent value="monthly">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {budgetsWithUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  예산이 없습니다.
                </div>
              ) : (
                <>
                  {/* 예산 대비 지출 차트 */}
                  {budgetsWithUsage.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>예산 대비 지출 현황</CardTitle>
                        <CardDescription>
                          {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월 예산 대비 지출
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value: number) => `${value.toLocaleString()}원`}
                            />
                            <Legend />
                            <Bar dataKey="예산" fill="#8884d8" />
                            <Bar dataKey="지출" fill="#82ca9d" />
                            <Bar dataKey="남은" fill="#ffc658" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                  {/* 예산 목록 (카테고리별로 월간/연간 함께 표시) */}
                  <div className="space-y-4">
                    {budgetsByCategory.map((item: { category: Budget['category']; monthly: BudgetWithUsage | null; yearly: BudgetWithUsage | null }) => {
                      const hasMonthly = item.monthly !== null;
                      const hasYearly = item.yearly !== null;
                      
                      if (!hasMonthly && !hasYearly) return null;
                      
                      return (
                        <div key={item.category?.id || Math.random()} className="space-y-2">
                          {/* 카테고리 헤더 */}
                          <div className="flex items-center gap-2 px-2">
                            {item.category?.icon && (
                              <span className="text-sm">{item.category.icon}</span>
                            )}
                            <div className="font-medium text-sm">{item.category?.name}</div>
                            <div className="flex items-center gap-1 ml-auto">
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
                          </div>
                          
                          {/* 월간 예산 */}
                          {item.monthly && (
                            <div className="pl-4 border-l-2 border-muted">
                              <BudgetItem
                                key={item.monthly.id}
                                budget={item.monthly}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isDeleting={deleteBudget.isPending && deleteBudget.variables?.budgetId === item.monthly.id}
                              />
                            </div>
                          )}
                          
                          {/* 연간 예산 */}
                          {item.yearly && (
                            <div className="pl-4 border-l-2 border-muted">
                              <BudgetItem
                                key={item.yearly.id}
                                budget={item.yearly}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isDeleting={deleteBudget.isPending && deleteBudget.variables?.budgetId === item.yearly.id}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="yearly">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {budgetsWithUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  예산이 없습니다.
                </div>
              ) : (
                <>
                  {/* 예산 대비 지출 차트 */}
                  {budgetsWithUsage.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>예산 대비 지출 현황</CardTitle>
                        <CardDescription>
                          {selectedYear}년 예산 대비 지출
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value: number) => `${value.toLocaleString()}원`}
                            />
                            <Legend />
                            <Bar dataKey="예산" fill="#8884d8" />
                            <Bar dataKey="지출" fill="#82ca9d" />
                            <Bar dataKey="남은" fill="#ffc658" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                  {/* 예산 목록 (카테고리별로 월간/연간 함께 표시) */}
                  <div className="space-y-4">
                    {budgetsByCategory.map((item: { category: Budget['category']; monthly: BudgetWithUsage | null; yearly: BudgetWithUsage | null }) => {
                      const hasMonthly = item.monthly !== null;
                      const hasYearly = item.yearly !== null;
                      
                      if (!hasMonthly && !hasYearly) return null;
                      
                      return (
                        <div key={item.category?.id || Math.random()} className="space-y-2">
                          {/* 카테고리 헤더 */}
                          <div className="flex items-center gap-2 px-2">
                            {item.category?.icon && (
                              <span className="text-sm">{item.category.icon}</span>
                            )}
                            <div className="font-medium text-sm">{item.category?.name}</div>
                            <div className="flex items-center gap-1 ml-auto">
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
                          </div>
                          
                          {/* 월간 예산 */}
                          {item.monthly && (
                            <div className="pl-4 border-l-2 border-muted">
                              <BudgetItem
                                key={item.monthly.id}
                                budget={item.monthly}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isDeleting={deleteBudget.isPending && deleteBudget.variables?.budgetId === item.monthly.id}
                              />
                            </div>
                          )}
                          
                          {/* 연간 예산 */}
                          {item.yearly && (
                            <div className="pl-4 border-l-2 border-muted">
                              <BudgetItem
                                key={item.yearly.id}
                                budget={item.yearly}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isDeleting={deleteBudget.isPending && deleteBudget.variables?.budgetId === item.yearly.id}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
