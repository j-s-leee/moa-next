"use client";

import { useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, ShoppingCart, Coffee, Home, Car } from "lucide-react";

// 카테고리 데이터 (실제로는 카테고리 관리에서 가져와야 함)
const expenseCategories: { id: string; name: string; icon: LucideIcon }[] = [
  { id: "1", name: "식비", icon: UtensilsCrossed },
  { id: "2", name: "쇼핑", icon: ShoppingCart },
  { id: "3", name: "카페", icon: Coffee },
  { id: "4", name: "주거", icon: Home },
  { id: "5", name: "교통", icon: Car },
];

interface Budget {
  id: string;
  categoryId: string;
  type: "monthly" | "yearly";
  amount: number;
  isRecurring: boolean;
  year?: number;
  month?: number;
  startYear?: number;
  startMonth?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 예산 사용량 계산용 (실제로는 지출 내역에서 계산해야 함)
interface BudgetUsage {
  budgetId: string;
  spent: number;
  percentage: number;
  remaining: number;
}

interface BudgetWithUsage extends Budget {
  categoryName: string;
  categoryIcon: LucideIcon;
  spent: number;
  percentage: number;
  remaining: number;
}

// 초기 예산 데이터 (실제로는 DB에서 가져와야 함)
const initialBudgets: Budget[] = [
  {
    id: "1",
    categoryId: "1",
    type: "monthly",
    amount: 500000,
    isRecurring: true,
    startYear: 2024,
    startMonth: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    categoryId: "5",
    type: "monthly",
    amount: 200000,
    isRecurring: true,
    startYear: 2024,
    startMonth: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    categoryId: "2",
    type: "yearly",
    amount: 3600000,
    isRecurring: true,
    startYear: 2024,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// 가짜 지출 데이터 (실제로는 지출 내역에서 가져와야 함)
const mockExpenses: { categoryId: string; amount: number; date: Date }[] = [
  { categoryId: "1", amount: 320000, date: new Date(2024, 0, 15) },
  { categoryId: "5", amount: 150000, date: new Date(2024, 0, 20) },
  { categoryId: "2", amount: 450000, date: new Date(2024, 0, 10) },
];

// 현재 월/년도에 적용되는 예산 찾기
function getActiveBudgets(
  budgets: Budget[],
  type: "monthly" | "yearly",
  targetYear: number,
  targetMonth?: number
): Budget[] {
  return budgets.filter((budget) => {
    if (budget.type !== type) return false;

    if (budget.isRecurring) {
      // 반복 예산: 시작일 이후면 모두 적용
      if (budget.type === "monthly") {
        if (!budget.startYear || !budget.startMonth) return false;
        const startDate = new Date(budget.startYear, budget.startMonth - 1);
        const targetDate = new Date(targetYear, (targetMonth || 1) - 1);
        return targetDate >= startDate;
      } else {
        // 연간 반복
        if (!budget.startYear) return false;
        return targetYear >= budget.startYear;
      }
    } else {
      // 비반복 예산: 정확히 일치하는 경우만
      if (budget.type === "monthly") {
        return budget.year === targetYear && budget.month === targetMonth;
      } else {
        return budget.year === targetYear;
      }
    }
  });
}

// 월간 예산 사용량 계산
function calculateMonthlyBudgetUsage(
  budget: Budget,
  expenses: { categoryId: string; amount: number; date: Date }[],
  year: number,
  month: number
): BudgetUsage {
  const budgetExpenses = expenses.filter(
    (expense) =>
      expense.categoryId === budget.categoryId &&
      expense.date.getFullYear() === year &&
      expense.date.getMonth() + 1 === month
  );

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    budgetId: budget.id,
    spent,
    percentage: Math.round((spent / budget.amount) * 100),
    remaining: budget.amount - spent,
  };
}

// 연간 예산 사용량 계산
function calculateYearlyBudgetUsage(
  budget: Budget,
  expenses: { categoryId: string; amount: number; date: Date }[],
  year: number
): BudgetUsage {
  const budgetExpenses = expenses.filter(
    (expense) =>
      expense.categoryId === budget.categoryId &&
      expense.date.getFullYear() === year
  );

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    budgetId: budget.id,
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
}: {
  budget: BudgetWithUsage;
  onEdit: (budget: BudgetWithUsage) => void;
  onDelete: (id: string) => void;
}) {
  const percentage = Math.min(budget.percentage, 100);
  const isOverBudget = budget.spent > budget.amount;
  const Icon = budget.categoryIcon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="relative flex items-center justify-center">
        <DonutChart percentage={percentage} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-semibold ${
              isOverBudget ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{budget.categoryName}</div>
        </div>
        <div className="text-sm text-muted-foreground">
          {budget.amount.toLocaleString()}원
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(budget)}>
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">수정</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(budget.id)}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">삭제</span>
        </Button>
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
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleEdit = (budget: BudgetWithUsage) => {
    // TODO: 예산 수정 모달/다이얼로그 구현
    console.log("수정", budget);
  };

  const handleDelete = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
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
    const category = expenseCategories.find((c) => c.id === budget.categoryId);
    const usage =
      activeTab === "monthly"
        ? calculateMonthlyBudgetUsage(
            budget,
            mockExpenses,
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1
          )
        : calculateYearlyBudgetUsage(budget, mockExpenses, selectedYear);

    return {
      ...budget,
      categoryName: category?.name || "알 수 없음",
      categoryIcon: category?.icon || Home,
      ...usage,
    };
  });

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
        <Button variant="ghost" size="icon" onClick={handleAdd}>
          <Plus className="size-4" />
          <span className="sr-only">추가</span>
        </Button>
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
          <div className="space-y-2">
            {budgetsWithUsage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                예산이 없습니다.
              </div>
            ) : (
              budgetsWithUsage.map((budget) => (
                <BudgetItem
                  key={budget.id}
                  budget={budget}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="yearly">
          <div className="space-y-2">
            {budgetsWithUsage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                예산이 없습니다.
              </div>
            ) : (
              budgetsWithUsage.map((budget) => (
                <BudgetItem
                  key={budget.id}
                  budget={budget}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
