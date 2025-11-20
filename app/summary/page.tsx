"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  TrendingUp,
  TrendingDown,
  Repeat,
  CircleDot,
  PiggyBank,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";

// 가짜 데이터 생성 함수 (실제로는 API에서 가져와야 함)
function generateExpenseData(selectedDate: Date, type: "monthly" | "yearly") {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // 지출 내역 생성
  const expenses = [];
  const incomes = [];

  // 예정 수입 (정기 수입 예정 금액)
  let scheduledIncome = 0;

  // 예산 금액 (해당 기간의 예산 합계)
  let budgetAmount = 0;

  if (type === "monthly") {
    // 월간 데이터
    const recurringExpenses = [
      { amount: 500000, name: "식비" },
      { amount: 200000, name: "교통비" },
      { amount: 100000, name: "카페" },
    ];

    // 비정기 지출 (랜덤)
    for (let i = 0; i < 15; i++) {
      expenses.push({
        amount: Math.floor(Math.random() * 200000) + 10000,
        isRecurring: false,
        date: new Date(
          currentYear,
          currentMonth,
          Math.floor(Math.random() * 28) + 1
        ),
      });
    }

    // 정기 지출 추가
    recurringExpenses.forEach((expense) => {
      expenses.push({
        amount: expense.amount,
        isRecurring: true,
        date: new Date(currentYear, currentMonth, 1),
      });
    });

    // 수입
    incomes.push({
      amount: 3000000,
      date: new Date(currentYear, currentMonth, 1),
    });
    incomes.push({
      amount: 500000,
      date: new Date(currentYear, currentMonth, 15),
    });

    // 예정 수입 (정기 수입 예정 금액)
    scheduledIncome = 3500000; // 급여 + 용돈

    // 예산 금액 (해당 월의 예산 합계)
    budgetAmount = 800000; // 식비 + 교통비 + 카페
  } else {
    // 연간 데이터
    const recurringExpenses = [
      { amount: 500000, name: "식비" },
      { amount: 200000, name: "교통비" },
      { amount: 100000, name: "카페" },
    ];

    // 연간 비정기 지출 (각 월마다)
    for (let month = 0; month < 12; month++) {
      for (let i = 0; i < 15; i++) {
        expenses.push({
          amount: Math.floor(Math.random() * 200000) + 10000,
          isRecurring: false,
          date: new Date(
            currentYear,
            month,
            Math.floor(Math.random() * 28) + 1
          ),
        });
      }

      // 정기 지출 추가 (각 월마다)
      recurringExpenses.forEach((expense) => {
        expenses.push({
          amount: expense.amount,
          isRecurring: true,
          date: new Date(currentYear, month, 1),
        });
      });
    }

    // 연간 수입 (각 월마다)
    for (let month = 0; month < 12; month++) {
      incomes.push({
        amount: 3000000,
        date: new Date(currentYear, month, 1),
      });
      incomes.push({
        amount: 500000,
        date: new Date(currentYear, month, 15),
      });
    }

    // 예정 수입 (연간 정기 수입 예정 금액)
    scheduledIncome = 3500000 * 12; // 월간 예정 수입 * 12

    // 예산 금액 (연간 예산 합계)
    budgetAmount = 800000 * 12; // 월간 예산 * 12
  }

  // 정기지출 데이터 (예정/완료 구분용)
  const recurringExpensesData = {
    scheduled: [] as { amount: number; date: Date }[],
    completed: [] as { amount: number; date: Date }[],
  };

  const now = new Date();
  const nowDate = now.getDate();
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();

  if (type === "monthly") {
    // 월간: 현재 월의 정기지출만
    const recurringExpenses = [
      { amount: 500000, name: "식비", day: 1 },
      { amount: 200000, name: "교통비", day: 5 },
      { amount: 100000, name: "카페", day: 10 },
    ];

    recurringExpenses.forEach((expense) => {
      const expenseDate = new Date(nowYear, nowMonth, expense.day);
      if (expense.day < nowDate) {
        // 이미 지난 날짜 = 완료
        recurringExpensesData.completed.push({
          amount: expense.amount,
          date: expenseDate,
        });
      } else {
        // 아직 안 지난 날짜 = 예정
        recurringExpensesData.scheduled.push({
          amount: expense.amount,
          date: expenseDate,
        });
      }
    });
  } else {
    // 연간: 현재 연도의 모든 정기지출
    const recurringExpenses = [
      { amount: 500000, name: "식비", day: 1 },
      { amount: 200000, name: "교통비", day: 5 },
      { amount: 100000, name: "카페", day: 10 },
    ];

    for (let month = 0; month < 12; month++) {
      recurringExpenses.forEach((expense) => {
        const expenseDate = new Date(nowYear, month, expense.day);
        const isPastMonth = month < nowMonth;
        const isCurrentMonthAndPast =
          month === nowMonth && expense.day < nowDate;

        if (isPastMonth || isCurrentMonthAndPast) {
          // 이미 지난 날짜 = 완료
          recurringExpensesData.completed.push({
            amount: expense.amount,
            date: expenseDate,
          });
        } else {
          // 아직 안 지난 날짜 = 예정
          recurringExpensesData.scheduled.push({
            amount: expense.amount,
            date: expenseDate,
          });
        }
      });
    }
  }

  return {
    expenses,
    incomes,
    scheduledIncome,
    budgetAmount,
    recurringExpensesData,
  };
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
  const getTrendColor = () => {
    if (trend === "up") return "text-blue-600 dark:text-blue-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

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

export default function Page() {
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const {
    expenses,
    incomes,
    scheduledIncome,
    budgetAmount,
    recurringExpensesData,
  } = useMemo(
    () =>
      generateExpenseData(
        activeTab === "monthly" ? selectedMonth : new Date(selectedYear, 0, 1),
        activeTab
      ),
    [activeTab, selectedMonth, selectedYear]
  );

  // 총 수입 계산
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  // 총 지출 계산
  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // 정기 지출 계산
  const recurringExpense = expenses
    .filter((expense) => expense.isRecurring)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // 비정기 지출 계산
  const nonRecurringExpense = expenses
    .filter((expense) => !expense.isRecurring)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // 저축 계산 (총 수입 - 총 지출)
  const savings = totalIncome - totalExpense;

  return (
    <AppLayout breadcrumbs={[{ label: "홈", href: "/home" }]}>
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
          <div className="space-y-4">
            {/* 총 수입과 총 지출을 한 로우에 2열로 배치 */}
            <div className="grid gap-4 grid-cols-2">
              <SummaryCard
                title="총 수입"
                amount={totalIncome}
                trend="up"
                subtitle={`예정: ${scheduledIncome.toLocaleString()}원`}
              />
              <SummaryCard
                title="총 지출"
                amount={-totalExpense}
                trend="down"
                subtitle={`예산: ${budgetAmount.toLocaleString()}원`}
              />
            </div>
            {/* 나머지 카드들 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <RecurringExpenseCard
                recurringExpensesData={recurringExpensesData}
              />
              <InfoCard
                title="비정기지출"
                rows={[
                  {
                    label: `지출 예산`,
                    amount: budgetAmount,
                  },
                  {
                    label: `잔액`,
                    amount: budgetAmount - totalExpense,
                  },
                ]}
              />
              <InfoCard
                title="저축"
                rows={[
                  {
                    label: `저축 금액`,
                    amount: savings,
                  },
                ]}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="yearly">
          <div className="space-y-4">
            {/* 총 수입과 총 지출을 한 로우에 2열로 배치 */}
            <div className="grid gap-4 grid-cols-2">
              <SummaryCard
                title="총 수입"
                amount={totalIncome}
                icon={TrendingUp}
                trend="up"
                subtitle={`예정: ${scheduledIncome.toLocaleString()}원`}
              />
              <SummaryCard
                title="총 지출"
                amount={-totalExpense}
                icon={TrendingDown}
                trend="down"
                subtitle={`예산: ${budgetAmount.toLocaleString()}원`}
              />
            </div>
            {/* 나머지 카드들 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <RecurringExpenseCard
                recurringExpensesData={recurringExpensesData}
              />
              <InfoCard
                title="비정기지출"
                rows={[
                  {
                    label: `지출 예산`,
                    amount: budgetAmount,
                  },
                  {
                    label: `잔액`,
                    amount: budgetAmount - totalExpense,
                  },
                ]}
              />
              <InfoCard
                title="저축"
                rows={[
                  {
                    label: `저축 금액`,
                    amount: savings,
                  },
                ]}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Link href="/book/add">
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
