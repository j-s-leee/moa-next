"use client";

import { useState, useEffect } from "react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from "recharts";
import { useRouter } from "next/navigation";
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

interface Budget {
  id: string;
  bookId: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
    expenseType?: "fixed" | "variable" | "annual" | "one-time" | null;
  };
  period: "monthly" | "yearly";
  amount: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  previousBudgetId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseItem {
  id: string;
  categoryId: string;
  amount: number;
  date: string; // ISO string
}

interface BudgetUsage {
  spent: number;
  percentage: number;
  remaining: number;
}

interface BudgetWithUsage extends Budget {
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
  return budgets.filter((budget) => {
    if (budget.period !== period) return false;

    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);

    if (period === "monthly" && targetMonth) {
      // 월간: 해당 월의 1일 ~ 마지막일
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
      return startDate <= monthEnd && endDate >= monthStart;
    } else {
      // 연간: 해당 년의 1월 1일 ~ 12월 31일
      const yearStart = new Date(targetYear, 0, 1);
      const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);
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
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getFullYear() === year &&
      expenseDate.getMonth() + 1 === month
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
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === year;
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

  const COLORS = ["#ef4444", "#e5e7eb"];

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
  const [bookId, setBookId] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 가계부 ID 및 예산 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 개인 가계부 목록 조회
        const booksResponse = await fetch("/api/book");
        if (!booksResponse.ok) {
          throw new Error("가계부 목록 조회에 실패했습니다.");
        }
        const booksData = await booksResponse.json();
        const personalBook = booksData.books?.[0];

        if (!personalBook) {
          toast.error("가계부를 찾을 수 없습니다.");
          router.push("/book");
          return;
        }

        setBookId(personalBook.id);
        await loadBudgetsAndExpenses(personalBook.id);
      } catch (error) {
        console.error("데이터 로드 오류:", error);
        toast.error(
          error instanceof Error ? error.message : "데이터 로드에 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  // 예산 및 지출 데이터 로드
  const loadBudgetsAndExpenses = async (bookId: string) => {
    try {
      const year = activeTab === "monthly" ? selectedMonth.getFullYear() : selectedYear;
      const month = activeTab === "monthly" ? selectedMonth.getMonth() + 1 : undefined;

      // 예산 목록 조회
      const budgetParams = new URLSearchParams({
        period: activeTab,
        year: year.toString(),
      });
      if (month) {
        budgetParams.append("month", month.toString());
      }

      const budgetsResponse = await fetch(
        `/api/book/${bookId}/budget?${budgetParams.toString()}`
      );
      if (!budgetsResponse.ok) {
        throw new Error("예산 목록 조회에 실패했습니다.");
      }
      const budgetsData = await budgetsResponse.json();
      setBudgets(budgetsData.budgets || []);

      // 지출 내역 조회 (사용량 계산용)
      const startDate = activeTab === "monthly"
        ? new Date(year, month! - 1, 1)
        : new Date(year, 0, 1);
      const endDate = activeTab === "monthly"
        ? new Date(year, month!, 0, 23, 59, 59, 999)
        : new Date(year, 11, 31, 23, 59, 59, 999);

      const expensesResponse = await fetch(
        `/api/book/${bookId}/expense?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!expensesResponse.ok) {
        throw new Error("지출 내역 조회에 실패했습니다.");
      }
      const expensesData = await expensesResponse.json();
      setExpenses(expensesData.expenses || []);
    } catch (error) {
      console.error("데이터 로드 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "데이터 로드에 실패했습니다."
      );
    }
  };

  // 탭 또는 날짜 변경 시 데이터 다시 로드
  useEffect(() => {
    if (bookId) {
      loadBudgetsAndExpenses(bookId);
    }
  }, [bookId, activeTab, selectedMonth, selectedYear]);

  const handleEdit = (budget: BudgetWithUsage) => {
    // TODO: 예산 수정 모달/다이얼로그 구현
    toast.info("예산 수정 기능은 곧 추가될 예정입니다.");
  };

  const handleDelete = async (id: string) => {
    if (!bookId) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/book/${bookId}/budget/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "예산 삭제에 실패했습니다.");
      }

      toast.success("예산이 삭제되었습니다.");
      await loadBudgetsAndExpenses(bookId);
    } catch (error) {
      console.error("예산 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "예산 삭제에 실패했습니다."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = () => {
    router.push("/book/budget/add");
  };

  // 현재 선택된 기간에 적용되는 예산 조회
  const activeBudgets = getActiveBudgets(
    budgets,
    activeTab,
    activeTab === "monthly" ? selectedMonth.getFullYear() : selectedYear,
    activeTab === "monthly" ? selectedMonth.getMonth() + 1 : undefined
  );

  // 예산에 카테고리 정보와 사용량 추가
  const budgetsWithUsage: BudgetWithUsage[] = activeBudgets.map((budget) => {
    const IconComponent = budget.category.icon
      ? (LucideIcons[budget.category.icon as keyof typeof LucideIcons] as LucideIcon)
      : null;

    const usage =
      activeTab === "monthly"
        ? calculateMonthlyBudgetUsage(
            budget,
            expenses,
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1
          )
        : calculateYearlyBudgetUsage(budget, expenses, selectedYear);

    return {
      ...budget,
      categoryName: budget.category.name,
      categoryIcon: IconComponent,
      ...usage,
    };
  });

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
                router.push(`/book/budget/suggest?period=${activeTab}`);
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
                  {/* 예산 목록 */}
                  <div className="space-y-2">
                    {budgetsWithUsage.map((budget) => (
                      <BudgetItem
                        key={budget.id}
                        budget={budget}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isDeleting={deletingId === budget.id}
                      />
                    ))}
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
                  {/* 예산 목록 */}
                  <div className="space-y-2">
                    {budgetsWithUsage.map((budget) => (
                      <BudgetItem
                        key={budget.id}
                        budget={budget}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isDeleting={deletingId === budget.id}
                      />
                    ))}
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
