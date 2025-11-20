"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import CalendarPricing from "@/components/ui/calendar-pricing";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronDown,
  UtensilsCrossed,
  ShoppingCart,
  Coffee,
  Home,
  Car,
  CreditCard,
  Smartphone,
  Wallet,
  Plus,
  ArrowUpDown,
  Filter,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";

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

  // 현재 날짜 기준 전년 1월 ~ 후년 12월까지 생성
  const generateMonthList = () => {
    const months = [];

    // 전년 1월 ~ 12월
    for (let month = 1; month <= 12; month++) {
      months.push({
        year: nowYear - 1,
        month,
        label: `${nowYear - 1}년 ${month}월`,
        isCurrentMonth: false,
      });
    }

    // 현재년 1월 ~ 12월
    for (let month = 1; month <= 12; month++) {
      const isThisMonth = month === nowMonth;
      months.push({
        year: nowYear,
        month,
        label: `${nowYear}년 ${month}월`,
        isCurrentMonth: isThisMonth,
      });
    }

    // 후년 1월 ~ 12월
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
            {isCurrentMonth && <Badge variant="secondary">이번달</Badge>}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>년도 및 월 선택</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <div className="space-y-1">
            {monthList.map((item, index) => {
              const isSelected =
                item.year === currentYear && item.month === currentMonth;
              return (
                <button
                  key={`${item.year}-${item.month}`}
                  onClick={() => handleMonthSelect(item.year, item.month)}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isCurrentMonth && (
                    <Badge
                      variant={isSelected ? "outline" : "secondary"}
                      className={isSelected ? "bg-primary-foreground/10" : ""}
                    >
                      이번달
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface ExpenseItem {
  id: string;
  date: Date;
  category: {
    name: string;
    icon: LucideIcon;
  };
  paymentMethod: string;
  time: string;
  amount: number;
  type: "expense" | "income";
}

const categoryIcons: Record<string, LucideIcon> = {
  식비: UtensilsCrossed,
  쇼핑: ShoppingCart,
  카페: Coffee,
  주거: Home,
  교통: Car,
};

const paymentMethods = [
  "신용카드",
  "체크카드",
  "현금",
  "계좌이체",
  "모바일페이",
];

// 샘플 데이터 생성 함수
function generateExpenseItems(
  count: number = 30,
  selectedMonth?: Date
): ExpenseItem[] {
  const categories = Object.keys(categoryIcons);
  const items: ExpenseItem[] = [];
  const now = selectedMonth || new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < count; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const date = new Date(year, month, day);
    const categoryName =
      categories[Math.floor(Math.random() * categories.length)];
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
    const amount = Math.floor(Math.random() * 100000) + 1000;
    const type = Math.random() > 0.7 ? "income" : "expense"; // 30% 확률로 수입

    items.push({
      id: `expense-${i}`,
      date,
      category: {
        name: categoryName,
        icon: categoryIcons[categoryName],
      },
      paymentMethod:
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      time,
      amount,
      type,
    });
  }

  return items.sort((a, b) => {
    // 날짜순 정렬 (최신순)
    const dateDiff = b.date.getTime() - a.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    // 같은 날짜면 시간순 정렬
    const [aHour, aMinute] = a.time.split(":").map(Number);
    const [bHour, bMinute] = b.time.split(":").map(Number);
    if (aHour !== bHour) return bHour - aHour;
    return bMinute - aMinute;
  });
}

// 날짜별로 그룹화하는 함수
function groupByDate(items: ExpenseItem[]): Map<string, ExpenseItem[]> {
  const grouped = new Map<string, ExpenseItem[]>();

  items.forEach((item) => {
    const dateKey = item.date.toISOString().split("T")[0]; // YYYY-MM-DD 형식
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  });

  return grouped;
}

// 날짜별 수입/지출 합계 계산
function calculateDailyTotals(items: ExpenseItem[]): {
  income: number;
  expense: number;
} {
  return items.reduce(
    (totals, item) => {
      if (item.type === "income") {
        totals.income += item.amount;
      } else {
        totals.expense += item.amount;
      }
      return totals;
    },
    { income: 0, expense: 0 }
  );
}

// 날짜 포맷팅 함수
function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

// 월별 총 수입/지출 계산
function calculateMonthlyTotals(selectedMonth: Date): {
  income: number;
  expense: number;
} {
  const expenses = generateExpenseItems(30, selectedMonth);
  return calculateDailyTotals(expenses);
}

function MonthlySummaryCard({ selectedMonth }: { selectedMonth: Date }) {
  const totals = calculateMonthlyTotals(selectedMonth);

  return (
    <div className="p-4 bg-accent/50 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground mb-1">총 수입</p>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          +{totals.income.toLocaleString()}원
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground mb-1">총 지출</p>
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          -{totals.expense.toLocaleString()}원
        </p>
      </div>
    </div>
  );
}

function DailyExpenseList({ selectedMonth }: { selectedMonth: Date }) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const expenses = generateExpenseItems(30, selectedMonth);

  // 필터링
  const filteredExpenses = expenses.filter((expense) => {
    if (categoryFilter !== "all" && expense.category.name !== categoryFilter) {
      return false;
    }
    if (typeFilter !== "all" && expense.type !== typeFilter) {
      return false;
    }
    if (
      paymentMethodFilter !== "all" &&
      expense.paymentMethod !== paymentMethodFilter
    ) {
      return false;
    }
    return true;
  });

  // 정렬
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "date-desc") {
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      const [aHour, aMinute] = a.time.split(":").map(Number);
      const [bHour, bMinute] = b.time.split(":").map(Number);
      if (aHour !== bHour) return bHour - aHour;
      return bMinute - aMinute;
    } else if (sortBy === "date-asc") {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      const [aHour, aMinute] = a.time.split(":").map(Number);
      const [bHour, bMinute] = b.time.split(":").map(Number);
      if (aHour !== bHour) return aHour - bHour;
      return aMinute - bMinute;
    } else if (sortBy === "expense-amount-desc") {
      // 지출만 정렬, 수입은 뒤로
      if (a.type === "expense" && b.type === "expense") {
        return b.amount - a.amount;
      }
      if (a.type === "expense") return -1;
      if (b.type === "expense") return 1;
      // 둘 다 수입이면 날짜순
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      const [aHour, aMinute] = a.time.split(":").map(Number);
      const [bHour, bMinute] = b.time.split(":").map(Number);
      if (aHour !== bHour) return bHour - aHour;
      return bMinute - aMinute;
    } else if (sortBy === "expense-amount-asc") {
      // 지출만 정렬, 수입은 뒤로
      if (a.type === "expense" && b.type === "expense") {
        return a.amount - b.amount;
      }
      if (a.type === "expense") return -1;
      if (b.type === "expense") return 1;
      // 둘 다 수입이면 날짜순
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      const [aHour, aMinute] = a.time.split(":").map(Number);
      const [bHour, bMinute] = b.time.split(":").map(Number);
      if (aHour !== bHour) return bHour - aHour;
      return bMinute - aMinute;
    } else if (sortBy === "income-amount-desc") {
      // 수입만 정렬, 지출은 뒤로
      if (a.type === "income" && b.type === "income") {
        return b.amount - a.amount;
      }
      if (a.type === "income") return -1;
      if (b.type === "income") return 1;
      // 둘 다 지출이면 날짜순
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      const [aHour, aMinute] = a.time.split(":").map(Number);
      const [bHour, bMinute] = b.time.split(":").map(Number);
      if (aHour !== bHour) return bHour - aHour;
      return bMinute - aMinute;
    } else if (sortBy === "income-amount-asc") {
      // 수입만 정렬, 지출은 뒤로
      if (a.type === "income" && b.type === "income") {
        return a.amount - b.amount;
      }
      if (a.type === "income") return -1;
      if (b.type === "income") return 1;
      // 둘 다 지출이면 날짜순
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      const [aHour, aMinute] = a.time.split(":").map(Number);
      const [bHour, bMinute] = b.time.split(":").map(Number);
      if (aHour !== bHour) return bHour - aHour;
      return bMinute - aMinute;
    }
    return 0;
  });

  const groupedByDate = groupByDate(sortedExpenses);

  // 날짜순 정렬 (정렬 옵션에 따라)
  const sortedDates = Array.from(groupedByDate.keys()).sort((a, b) => {
    if (sortBy.startsWith("date-")) {
      return sortBy === "date-desc"
        ? new Date(b).getTime() - new Date(a).getTime()
        : new Date(a).getTime() - new Date(b).getTime();
    }
    // 금액 정렬일 때는 날짜는 최신순 유지
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // 날짜 그룹 내에서도 금액 정렬 적용
  if (
    sortBy.startsWith("expense-amount-") ||
    sortBy.startsWith("income-amount-")
  ) {
    sortedDates.forEach((dateKey) => {
      const dateItems = groupedByDate.get(dateKey)!;
      dateItems.sort((a, b) => {
        if (sortBy === "expense-amount-desc") {
          if (a.type === "expense" && b.type === "expense") {
            return b.amount - a.amount;
          }
          if (a.type === "expense") return -1;
          if (b.type === "expense") return 1;
          return 0;
        } else if (sortBy === "expense-amount-asc") {
          if (a.type === "expense" && b.type === "expense") {
            return a.amount - b.amount;
          }
          if (a.type === "expense") return -1;
          if (b.type === "expense") return 1;
          return 0;
        } else if (sortBy === "income-amount-desc") {
          if (a.type === "income" && b.type === "income") {
            return b.amount - a.amount;
          }
          if (a.type === "income") return -1;
          if (b.type === "income") return 1;
          return 0;
        } else if (sortBy === "income-amount-asc") {
          if (a.type === "income" && b.type === "income") {
            return a.amount - b.amount;
          }
          if (a.type === "income") return -1;
          if (b.type === "income") return 1;
          return 0;
        }
        return 0;
      });
    });
  }

  const categories = Object.keys(categoryIcons);

  // 필터 텍스트 변환 함수
  const getFilterText = (value: string) => {
    switch (value) {
      case "all":
        return "전체";
      case "income":
        return "수입";
      case "expense":
        return "지출";
      default:
        return "전체";
    }
  };

  // 정렬 텍스트 변환 함수
  const getSortText = (value: string) => {
    switch (value) {
      case "date-desc":
        return "날짜 최신순";
      case "date-asc":
        return "날짜 오래된순";
      default:
        return "날짜 최신순";
    }
  };

  return (
    <div className="space-y-4">
      {/* 필터 및 정렬 UI */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {getFilterText(typeFilter)} · {getSortText(sortBy)}
              </span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>필터 및 정렬</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">유형</h3>
                <ButtonGroup aria-label="유형" className="w-full">
                  <Button
                    variant={typeFilter === "all" ? "default" : "outline"}
                    onClick={() => setTypeFilter("all")}
                    className="flex-1"
                  >
                    전체
                  </Button>
                  <Button
                    variant={typeFilter === "income" ? "default" : "outline"}
                    onClick={() => setTypeFilter("income")}
                    className="flex-1"
                  >
                    수입
                  </Button>
                  <Button
                    variant={typeFilter === "expense" ? "default" : "outline"}
                    onClick={() => setTypeFilter("expense")}
                    className="flex-1"
                  >
                    지출
                  </Button>
                </ButtonGroup>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">정렬</h3>
                <ButtonGroup aria-label="정렬" className="w-full">
                  <Button
                    variant={sortBy === "date-desc" ? "default" : "outline"}
                    onClick={() => setSortBy("date-desc")}
                    className="flex-1"
                  >
                    날짜 최신순
                  </Button>
                  <Button
                    variant={sortBy === "date-asc" ? "default" : "outline"}
                    onClick={() => setSortBy("date-asc")}
                    className="flex-1"
                  >
                    날짜 오래된순
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* 필터링된 결과가 없을 때 */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          필터 조건에 맞는 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dateItems = groupedByDate.get(dateKey)!;
            const totals = calculateDailyTotals(dateItems);
            const date = new Date(dateKey);

            return (
              <div key={dateKey} className="space-y-1">
                {/* 날짜 헤더와 합계 */}
                <div className="flex items-center justify-between p-2">
                  <div className="font-semibold text-sm">
                    {formatDate(date)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        +{totals.income.toLocaleString()}원
                      </span>
                    </div>
                    <Separator orientation="vertical" className="" />
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -{totals.expense.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* 해당 날짜의 거래 내역 */}
                <div className="space-y-2">
                  {dateItems.map((expense) => {
                    const Icon = expense.category.icon;
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-accent/50 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {expense.category.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {expense.paymentMethod}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {expense.time}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm ${
                              expense.type === "income"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {expense.type === "income" ? "+" : "-"}
                            {expense.amount.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DateExpenseDrawer({
  open,
  onOpenChange,
  selectedDate,
  selectedMonth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedMonth: Date;
}) {
  if (!selectedDate) return null;

  const allExpenses = generateExpenseItems(30, selectedMonth);
  const dateKey = selectedDate.toISOString().split("T")[0];
  const dateExpenses = allExpenses.filter(
    (expense) => expense.date.toISOString().split("T")[0] === dateKey
  );
  const totals = calculateDailyTotals(dateExpenses);

  // 시간순 정렬
  const sortedExpenses = [...dateExpenses].sort((a, b) => {
    const [aHour, aMinute] = a.time.split(":").map(Number);
    const [bHour, bMinute] = b.time.split(":").map(Number);
    if (aHour !== bHour) return bHour - aHour;
    return bMinute - aMinute;
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            {formatDate(selectedDate)}
            <div className="flex items-center gap-2 text-sm pt-2">
              <div className="flex items-center gap-1">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{totals.income.toLocaleString()}원
                </span>
              </div>
              <Separator orientation="vertical" />
              <div className="flex items-center gap-1">
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{totals.expense.toLocaleString()}원
                </span>
              </div>
            </div>
          </DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[70vh] px-4 pb-4">
          <div className="space-y-2 pt-2">
            {sortedExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                해당 날짜에 거래 내역이 없습니다.
              </div>
            ) : (
              sortedExpenses.map((expense) => {
                const Icon = expense.category.icon;
                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {expense.category.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {expense.paymentMethod}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {expense.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm ${
                          expense.type === "income"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {expense.type === "income" ? "+" : "-"}
                        {expense.amount.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <Link href="/book/add">
              <button className="w-full flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">내역 추가</span>
                  </div>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function BookPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedCalendarDate(date);
    setDrawerOpen(true);
  };

  return (
    <AppLayout
      breadcrumbs={[{ label: "홈", href: "/home" }, { label: "가계부" }]}
    >
      <Tabs defaultValue="daily">
        <div className="flex items-center justify-between mb-4">
          <MonthSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          <TabsList>
            <TabsTrigger value="daily">일별</TabsTrigger>
            <TabsTrigger value="calendar">캘린더</TabsTrigger>
          </TabsList>
        </div>

        <MonthlySummaryCard selectedMonth={selectedDate} />

        <TabsContent value="daily">
          <DailyExpenseList selectedMonth={selectedDate} />
        </TabsContent>
        <TabsContent value="calendar">
          <CalendarPricing
            month={selectedDate}
            onDateSelect={handleCalendarDateSelect}
          />
        </TabsContent>
      </Tabs>

      <DateExpenseDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedDate={selectedCalendarDate}
        selectedMonth={selectedDate}
      />

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
