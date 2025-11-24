"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { AppLayout } from "@/components/app-layout";
import { ExpenseCalendar } from "@/components/ui/expense-calendar";
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
  Plus,
  ArrowUpDown,
  Loader2,
  Edit2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

function MonthSelector({
  selectedDate,
  onDateChange,
}: {
  selectedDate: DateTime;
  onDateChange: (date: DateTime) => void;
}) {
  const [open, setOpen] = useState(false);

  const now = DateTime.now();
  const nowYear = now.year;
  const nowMonth = now.month;

  const currentYear = selectedDate.year;
  const currentMonth = selectedDate.month;
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
    const newDate = DateTime.fromObject({ year, month, day: 1 });
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

// API 응답 타입 정의
interface ExpenseItem {
  id: string;
  bookId: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
  };
  amount: number;
  date: string; // ISO string
  description: string | null;
  userId: string;
  budgetId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IncomeItem {
  id: string;
  bookId: string;
  categoryId: string | null; // nullable로 변경
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
  } | null; // nullable로 변경
  amount: number;
  date: string | null; // 단일 거래 날짜 (ISO string, nullable)
  period: "monthly" | "yearly" | null; // 반복 주기 (nullable)
  source: string | null;
  incomeType: "actual" | "transfer";
  transferredFromBookId: string | null;
  startDate: string | null; // 반복 수입 시작 날짜 (ISO string, nullable)
  endDate: string | null; // 반복 수입 종료 날짜 (ISO string, nullable)
  createdAt: string;
  updatedAt: string;
}

// 아이콘 동적 로드 헬퍼
function getIconComponent(iconName: string | null): LucideIcon | null {
  if (!iconName) return null;
  return ((LucideIcons as any)[iconName] as LucideIcon) || null;
}

// 통합된 거래 아이템 타입 (지출 + 단일 거래 수입)
type TransactionItem = ExpenseItem | (IncomeItem & { date: string });

// 반복 수입을 해당 기간의 실제 발생 날짜로 변환
function getRecurringIncomeDates(
  income: IncomeItem,
  targetMonth: DateTime
): Array<{ date: DateTime; income: IncomeItem }> {
  if (!income.period || !income.startDate) {
    return [];
  }

  const results: Array<{ date: DateTime; income: IncomeItem }> = [];
  const startDate = DateTime.fromISO(income.startDate, { zone: "utc" });
  const endDate = income.endDate
    ? DateTime.fromISO(income.endDate, { zone: "utc" })
    : null;
  const targetDateTime = targetMonth;
  const targetYear = targetDateTime.year;
  const targetMonthNum = targetDateTime.month;

  // 시작일의 일자 추출 (예: 1월 1일이면 1일)
  const startDay = startDate.day;

  if (income.period === "monthly") {
    // 월간 수입: 매월 시작일의 일자에 발생
    const monthStart = DateTime.utc(targetYear, targetMonthNum, 1);
    const monthEnd = monthStart.endOf("month");

    // 시작일이 해당 월 내에 있는지 확인
    if (startDate <= monthEnd) {
      // 해당 월의 발생일 계산
      const occurrenceDate = DateTime.utc(targetYear, targetMonthNum, startDay);

      // 종료일이 있으면 확인
      if (endDate && occurrenceDate > endDate) {
        return [];
      }

      // 시작일 이후인지 확인
      if (occurrenceDate >= startDate && occurrenceDate <= monthEnd) {
        results.push({ date: occurrenceDate, income });
      }
    }
  } else if (income.period === "yearly") {
    // 연간 수입: 매년 시작일의 월/일에 발생
    // 해당 월에만 표시되어야 함
    const startMonth = startDate.month;
    const startDay = startDate.day;

    // 시작일의 월이 선택된 월과 일치하는지 확인
    if (startMonth === targetMonthNum) {
      const monthStart = DateTime.utc(targetYear, targetMonthNum, 1);
      const monthEnd = monthStart.endOf("month");

      const occurrenceDate = DateTime.utc(targetYear, startMonth, startDay);

      // 종료일이 있으면 확인
      if (endDate && occurrenceDate > endDate) {
        return [];
      }

      // 시작일 이후인지 확인
      if (occurrenceDate >= startDate && occurrenceDate <= monthEnd) {
        results.push({ date: occurrenceDate, income });
      }
    }
  }

  return results;
}

// 날짜별로 그룹화하는 함수 (지출과 단일 거래 수입 + 반복 수입 통합)
function groupByDate(
  expenses: ExpenseItem[],
  incomes: IncomeItem[],
  targetMonth: DateTime
): Map<string, TransactionItem[]> {
  const grouped = new Map<string, TransactionItem[]>();

  // 지출 추가
  expenses.forEach((item) => {
    const dateTime = DateTime.fromISO(item.date, { zone: "utc" });
    const dateKey = dateTime.toFormat("yyyy-MM-dd"); // YYYY-MM-DD 형식
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  });

  // 수입 추가 (단일 거래 + 반복 수입)
  incomes.forEach((item) => {
    if (item.date) {
      // 단일 거래 수입
      const dateTime = DateTime.fromISO(item.date, { zone: "utc" });
      const dateKey = dateTime.toFormat("yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(item as TransactionItem);
    } else if (item.period && item.startDate) {
      // 반복 수입: 해당 기간의 실제 발생 날짜로 변환
      const occurrences = getRecurringIncomeDates(item, targetMonth);
      occurrences.forEach(({ date, income }) => {
        const dateTime = date;
        const dateKey = dateTime.toFormat("yyyy-MM-dd");
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        // 반복 수입을 표시하기 위해 임시로 date를 추가한 객체 생성
        grouped.get(dateKey)!.push({
          ...income,
          date: dateTime.toFormat("yyyy-MM-dd"),
        } as TransactionItem);
      });
    }
  });

  return grouped;
}

// 날짜별 수입/지출 합계 계산 (통합된 거래 아이템)
function calculateDailyTotals(items: TransactionItem[]): {
  income: number;
  expense: number;
} {
  return items.reduce(
    (totals, item) => {
      // ExpenseItem인 경우
      if ("userId" in item && "budgetId" in item) {
        if (item.category.type === "income") {
          totals.income += item.amount;
        } else {
          totals.expense += item.amount;
        }
      } else {
        // IncomeItem인 경우 (단일 거래)
        totals.income += item.amount;
      }
      return totals;
    },
    { income: 0, expense: 0 }
  );
}

// 날짜 포맷팅 함수
function formatDate(date: DateTime): string {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.weekday % 7];
  return `${date.month}월 ${date.day}일 (${weekday})`;
}

function MonthlySummaryCard({
  expenses,
  incomes,
  selectedMonth,
}: {
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
  selectedMonth: DateTime;
}) {
  // 단일 거래 수입 필터링
  const singleTransactionIncomes = incomes.filter((income) => income.date);

  // 반복 수입 중 해당 월에 발생하는 수입 계산
  let recurringIncomeTotal = 0;
  incomes.forEach((income) => {
    if (income.period && income.startDate) {
      // 반복 수입인 경우 해당 월에 발생하는지 확인
      const occurrences = getRecurringIncomeDates(income, selectedMonth);
      if (occurrences.length > 0) {
        // 해당 월에 발생하는 반복 수입 금액 추가
        recurringIncomeTotal += income.amount * occurrences.length;
      }
    }
  });

  // 단일 거래 수입 합계 계산
  const singleIncomeTotal = singleTransactionIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  // 총 수입 = 단일 거래 수입 + 반복 수입
  const totalIncome = singleIncomeTotal + recurringIncomeTotal;

  // 지출 합계 계산
  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <div className="p-4 bg-accent/50 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground mb-1">총 수입</p>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          +{totalIncome.toLocaleString()}원
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground mb-1">총 지출</p>
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          -{totalExpense.toLocaleString()}원
        </p>
      </div>
    </div>
  );
}

function DailyExpenseList({
  selectedMonth,
  expenses,
  incomes,
  isLoading,
  bookId,
  onExpenseUpdate,
  onIncomeUpdate,
  typeFilter,
  sortBy,
  onFilterChange,
  onSortChange,
}: {
  selectedMonth: DateTime;
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
  isLoading: boolean;
  bookId: string | null;
  onExpenseUpdate: (bookId: string) => void;
  onIncomeUpdate: (bookId: string) => void;
  typeFilter: string;
  sortBy: string;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);

  const handleDelete = async (expenseId: string) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    setDeletingId(expenseId);

    try {
      const response = await fetch(`/api/book/${bookId}/expense/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "지출 삭제에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      // 응답이 성공이면 (200-299 범위) - 응답 본문이 없을 수도 있음
      try {
        await response.json();
      } catch {
        // 응답 본문이 없거나 파싱 실패해도 성공으로 처리
      }

      toast.success("지출이 삭제되었습니다.");
      if (bookId) {
        onExpenseUpdate(bookId);
      }
    } catch (error) {
      console.error("지출 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "지출 삭제에 실패했습니다."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    setDeletingIncomeId(incomeId);

    try {
      const response = await fetch(`/api/book/${bookId}/income/${incomeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "수입 삭제에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      toast.success("수입이 삭제되었습니다.");
      if (bookId) {
        onIncomeUpdate(bookId);
      }
    } catch (error) {
      console.error("수입 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "수입 삭제에 실패했습니다."
      );
    } finally {
      setDeletingIncomeId(null);
    }
  };

  // 날짜별로 그룹화 (지출 + 단일 거래 수입 + 반복 수입)
  const allGroupedByDate = groupByDate(expenses, incomes, selectedMonth);

  // 그룹화된 데이터를 평탄화하여 모든 거래 아이템 배열 생성
  const allTransactions: TransactionItem[] = [];
  allGroupedByDate.forEach((items) => {
    allTransactions.push(...items);
  });

  // 필터링
  const filteredTransactions = allTransactions.filter((item) => {
    if (typeFilter === "all") return true;

    // ExpenseItem인 경우
    if ("userId" in item && "budgetId" in item) {
      return item.category.type === typeFilter;
    }

    // IncomeItem인 경우 (단일 거래 수입)
    return typeFilter === "income";
  });

  // 정렬
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // 날짜 추출
    const getDate = (item: TransactionItem): Date => {
      if ("userId" in item && "budgetId" in item) {
        return new Date(item.date);
      } else {
        return new Date((item as IncomeItem).date!);
      }
    };

    const aDate = getDate(a).getTime();
    const bDate = getDate(b).getTime();

    // 타입 추출
    const getType = (item: TransactionItem): "expense" | "income" => {
      if ("userId" in item && "budgetId" in item) {
        return item.category.type;
      } else {
        return "income";
      }
    };

    const aType = getType(a);
    const bType = getType(b);

    if (sortBy === "date-desc") {
      const dateDiff = bDate - aDate;
      if (dateDiff !== 0) return dateDiff;
      const aCreated = "createdAt" in a ? new Date(a.createdAt).getTime() : 0;
      const bCreated = "createdAt" in b ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    } else if (sortBy === "date-asc") {
      const dateDiff = aDate - bDate;
      if (dateDiff !== 0) return dateDiff;
      const aCreated = "createdAt" in a ? new Date(a.createdAt).getTime() : 0;
      const bCreated = "createdAt" in b ? new Date(b.createdAt).getTime() : 0;
      return aCreated - bCreated;
    } else if (sortBy === "expense-amount-desc") {
      // 지출만 정렬, 수입은 뒤로
      if (aType === "expense" && bType === "expense") {
        return b.amount - a.amount;
      }
      if (aType === "expense") return -1;
      if (bType === "expense") return 1;
      // 둘 다 수입이면 날짜순
      return bDate - aDate;
    } else if (sortBy === "expense-amount-asc") {
      // 지출만 정렬, 수입은 뒤로
      if (aType === "expense" && bType === "expense") {
        return a.amount - b.amount;
      }
      if (aType === "expense") return -1;
      if (bType === "expense") return 1;
      // 둘 다 수입이면 날짜순
      return bDate - aDate;
    } else if (sortBy === "income-amount-desc") {
      // 수입만 정렬, 지출은 뒤로
      if (aType === "income" && bType === "income") {
        return b.amount - a.amount;
      }
      if (aType === "income") return -1;
      if (bType === "income") return 1;
      // 둘 다 지출이면 날짜순
      return bDate - aDate;
    } else if (sortBy === "income-amount-asc") {
      // 수입만 정렬, 지출은 뒤로
      if (aType === "income" && bType === "income") {
        return a.amount - b.amount;
      }
      if (aType === "income") return -1;
      if (bType === "income") return 1;
      // 둘 다 지출이면 날짜순
      return bDate - aDate;
    }
    return 0;
  });

  // 지출과 수입 분리
  const filteredExpenses = sortedTransactions.filter(
    (item) => "userId" in item && "budgetId" in item
  ) as ExpenseItem[];
  const filteredIncomes = sortedTransactions.filter(
    (item) => !("userId" in item && "budgetId" in item)
  ) as IncomeItem[];

  const groupedByDate = groupByDate(
    filteredExpenses,
    filteredIncomes,
    selectedMonth
  );

  // 날짜순 정렬 (정렬 옵션에 따라)
  const sortedDates = Array.from(groupedByDate.keys()).sort((a, b) => {
    const dateA = DateTime.fromISO(a, { zone: "utc" });
    const dateB = DateTime.fromISO(b, { zone: "utc" });

    if (sortBy.startsWith("date-")) {
      return sortBy === "date-desc"
        ? dateB.toMillis() - dateA.toMillis()
        : dateA.toMillis() - dateB.toMillis();
    }
    // 금액 정렬일 때는 날짜는 최신순 유지
    return dateB.toMillis() - dateA.toMillis();
  });

  // 날짜 그룹 내에서도 금액 정렬 적용
  if (
    sortBy.startsWith("expense-amount-") ||
    sortBy.startsWith("income-amount-")
  ) {
    sortedDates.forEach((dateKey) => {
      const dateItems = groupedByDate.get(dateKey)!;
      dateItems.sort((a, b) => {
        const getType = (item: TransactionItem): "expense" | "income" => {
          if ("userId" in item && "budgetId" in item) {
            return item.category.type;
          } else {
            return "income";
          }
        };

        const aType = getType(a);
        const bType = getType(b);

        if (sortBy === "expense-amount-desc") {
          if (aType === "expense" && bType === "expense") {
            return b.amount - a.amount;
          }
          if (aType === "expense") return -1;
          if (bType === "expense") return 1;
          return 0;
        } else if (sortBy === "expense-amount-asc") {
          if (aType === "expense" && bType === "expense") {
            return a.amount - b.amount;
          }
          if (aType === "expense") return -1;
          if (bType === "expense") return 1;
          return 0;
        } else if (sortBy === "income-amount-desc") {
          if (aType === "income" && bType === "income") {
            return b.amount - a.amount;
          }
          if (aType === "income") return -1;
          if (bType === "income") return 1;
          return 0;
        } else if (sortBy === "income-amount-asc") {
          if (aType === "income" && bType === "income") {
            return a.amount - b.amount;
          }
          if (aType === "income") return -1;
          if (bType === "income") return 1;
          return 0;
        }
        return 0;
      });
    });
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                    onClick={() => onFilterChange("all")}
                    className="flex-1"
                  >
                    전체
                  </Button>
                  <Button
                    variant={typeFilter === "income" ? "default" : "outline"}
                    onClick={() => onFilterChange("income")}
                    className="flex-1"
                  >
                    수입
                  </Button>
                  <Button
                    variant={typeFilter === "expense" ? "default" : "outline"}
                    onClick={() => onFilterChange("expense")}
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
                    onClick={() => onSortChange("date-desc")}
                    className="flex-1"
                  >
                    날짜 최신순
                  </Button>
                  <Button
                    variant={sortBy === "date-asc" ? "default" : "outline"}
                    onClick={() => onSortChange("date-asc")}
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
            const date = DateTime.fromFormat(dateKey, "yyyy-MM-dd");

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
                  {dateItems.map((item) => {
                    // ExpenseItem인지 IncomeItem인지 확인
                    const isExpense = "userId" in item && "budgetId" in item;
                    const expense = isExpense ? (item as ExpenseItem) : null;
                    const income = !isExpense ? (item as IncomeItem) : null;

                    if (expense) {
                      // 지출 아이템 렌더링
                      const IconComponent = getIconComponent(
                        expense.category.icon
                      );
                      const isDeleting = deletingId === expense.id;

                      return (
                        <div
                          key={expense.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-accent/50 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
                            {IconComponent ? (
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <span className="text-lg">
                                {expense.category.icon || "📦"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">
                                {expense.category.name}
                              </span>
                              {expense.description && (
                                <span className="text-sm text-muted-foreground">
                                  {expense.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div
                                className={`text-sm ${
                                  expense.category.type === "income"
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {expense.category.type === "income" ? "+" : "-"}
                                {expense.amount.toLocaleString()}원
                              </div>
                            </div>
                            {expense.category.type === "expense" && bookId && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreVertical className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">메뉴</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/book/edit/${expense.id}`}>
                                      <Edit2 className="mr-2 h-4 w-4" />
                                      수정
                                    </Link>
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        삭제
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          지출 삭제
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          정말로 이 지출을 삭제하시겠습니까?
                                          <br />이 작업은 되돌릴 수 없습니다.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          취소
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDelete(expense.id)
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          삭제
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      );
                    } else if (income) {
                      // 수입 아이템 렌더링 (단일 거래 + 반복 수입)

                      const IconComponent = income.category
                        ? getIconComponent(income.category.icon)
                        : null;

                      const categoryName =
                        income.category?.name || income.source || "수입";
                      const categoryIcon = income.category?.icon || "💰";
                      const isDeletingIncome = deletingIncomeId === income.id;

                      return (
                        <div
                          key={income.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-accent/50 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
                            {IconComponent ? (
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <span className="text-lg">{categoryIcon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {categoryName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {income.source && (
                                <span className="text-sm text-muted-foreground">
                                  {income.source}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                +{income.amount.toLocaleString()}원
                              </div>
                            </div>
                            {bookId && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={isDeletingIncome}
                                  >
                                    {isDeletingIncome ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreVertical className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">메뉴</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/book/edit/${income.id}?type=income`}
                                    >
                                      <Edit2 className="mr-2 h-4 w-4" />
                                      수정
                                    </Link>
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        삭제
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          수입 삭제
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          정말로 이 수입을 삭제하시겠습니까?
                                          <br />이 작업은 되돌릴 수 없습니다.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          취소
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteIncome(income.id)
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          삭제
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
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

function IncomeList({
  selectedMonth,
  incomes,
  isLoading,
  bookId,
  onIncomeUpdate,
}: {
  selectedMonth: Date;
  incomes: IncomeItem[];
  isLoading: boolean;
  bookId: string | null;
  onIncomeUpdate: (bookId: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (incomeId: string) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    setDeletingId(incomeId);

    try {
      const response = await fetch(`/api/book/${bookId}/income/${incomeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "수입 삭제에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      toast.success("수입이 삭제되었습니다.");
      if (bookId) {
        onIncomeUpdate(bookId);
      }
    } catch (error) {
      console.error("수입 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "수입 삭제에 실패했습니다."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // 반복 수입만 필터링 (period와 startDate가 있는 경우만)
  const recurringIncomes = incomes.filter(
    (income) => income.period && income.startDate
  );

  // 정렬 (시작일 기준 최신순)
  const sortedIncomes = [...recurringIncomes].sort((a, b) => {
    const aDate = new Date(a.startDate!).getTime();
    const bDate = new Date(b.startDate!).getTime();
    return bDate - aDate;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sortedIncomes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        수입 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedIncomes.map((income) => {
        // 반복 수입만 표시 (period와 startDate가 있는 경우만)
        if (!income.period || !income.startDate) return null;

        const startDate = new Date(income.startDate!);
        const endDate = income.endDate ? new Date(income.endDate) : null;
        const isDeleting = deletingId === income.id;
        const IconComponent = income.category
          ? getIconComponent(income.category.icon)
          : null;
        const categoryName = income.category?.name || income.source || "수입";
        const categoryIcon = income.category?.icon || "💰";

        return (
          <div
            key={income.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-accent/50 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent">
              {IconComponent ? (
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              ) : (
                <span className="text-lg">{categoryIcon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{categoryName}</span>
                <Badge variant="secondary" className="text-xs">
                  {income.period === "monthly" ? "월간" : "연간"}
                </Badge>
                {income.incomeType === "transfer" && (
                  <Badge variant="outline" className="text-xs">
                    이체
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {startDate.toLocaleDateString("ko-KR")}
                {endDate && ` ~ ${endDate.toLocaleDateString("ko-KR")}`}
                {!endDate && " ~ 무기한"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  +{income.amount.toLocaleString()}원
                </div>
              </div>
              {bookId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                      <span className="sr-only">메뉴</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/book/edit/${income.id}?type=income`}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        수정
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>수입 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 이 수입을 삭제하시겠습니까?
                            <br />이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(income.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DateExpenseDrawer({
  open,
  onOpenChange,
  selectedDate,
  expenses,
  incomes,
  bookId,
  onExpenseUpdate,
  onIncomeUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: DateTime | null;
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
  bookId: string | null;
  onExpenseUpdate: (bookId: string) => void;
  onIncomeUpdate: (bookId: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);

  if (!selectedDate) return null;

  const dateKey = selectedDate.toFormat("yyyy-MM-dd");
  const selectedMonth = new Date(selectedDate.year, selectedDate.month, 1);

  // 해당 날짜의 지출 필터링
  const dateExpenses = expenses.filter(
    (expense) => new Date(expense.date).toISOString().split("T")[0] === dateKey
  );

  // 해당 날짜의 수입 필터링 (단일 거래 + 반복 수입)
  const dateIncomes: TransactionItem[] = [];

  incomes.forEach((income) => {
    if (income.date) {
      // 단일 거래 수입
      console.log("income.date, dateKey", income.date, dateKey);
      if (income.date === dateKey) {
        dateIncomes.push(income as TransactionItem);
      }
    } else if (income.period && income.startDate) {
      // 반복 수입: 해당 날짜에 발생하는지 확인
      const occurrences = getRecurringIncomeDates(income, selectedDate);
      const hasOccurrence = occurrences.some(
        ({ date }) => date.toFormat("yyyy-MM-dd") === dateKey
      );
      if (hasOccurrence) {
        // 반복 수입을 표시하기 위해 임시로 date를 추가한 객체 생성
        dateIncomes.push({
          ...income,
          date: dateKey,
        } as TransactionItem);
      }
    }
  });

  // 지출과 수입 통합
  const allTransactions: TransactionItem[] = [...dateExpenses, ...dateIncomes];

  const totals = calculateDailyTotals(allTransactions);

  // 시간순 정렬
  const sortedTransactions = [...allTransactions].sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return bDate - aDate;
  });

  const handleDelete = async (expenseId: string) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    setDeletingId(expenseId);

    try {
      const response = await fetch(`/api/book/${bookId}/expense/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "지출 삭제에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      // 응답이 성공이면 (200-299 범위) - 응답 본문이 없을 수도 있음
      try {
        await response.json();
      } catch {
        // 응답 본문이 없거나 파싱 실패해도 성공으로 처리
      }

      toast.success("지출이 삭제되었습니다.");
      if (bookId) {
        onExpenseUpdate(bookId);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("지출 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "지출 삭제에 실패했습니다."
      );
    } finally {
      setDeletingId(null);
    }
  };

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
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                해당 날짜에 거래 내역이 없습니다.
              </div>
            ) : (
              sortedTransactions.map((transaction) => {
                // ExpenseItem인지 IncomeItem인지 확인
                const isExpense =
                  "userId" in transaction && "budgetId" in transaction;
                const expense = isExpense ? (transaction as ExpenseItem) : null;
                const income = !isExpense ? (transaction as IncomeItem) : null;

                if (expense) {
                  // 지출 아이템 렌더링
                  const IconComponent = getIconComponent(expense.category.icon);
                  const expenseDate = new Date(expense.date);
                  const timeStr = expenseDate.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isDeleting = deletingId === expense.id;

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                        {IconComponent ? (
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <span className="text-lg">
                            {expense.category.icon || "📦"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {expense.category.name}
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {timeStr}
                          </div>
                          {expense.description && (
                            <span className="text-sm text-muted-foreground">
                              {expense.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div
                            className={`text-sm ${
                              expense.category.type === "income"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {expense.category.type === "income" ? "+" : "-"}
                            {expense.amount.toLocaleString()}원
                          </div>
                        </div>
                        {expense.category.type === "expense" && bookId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                                <span className="sr-only">메뉴</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/book/edit/${expense.id}`}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  수정
                                </Link>
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    삭제
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      지출 삭제
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      정말로 이 지출을 삭제하시겠습니까?
                                      <br />이 작업은 되돌릴 수 없습니다.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(expense.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      삭제
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                } else if (income) {
                  // 수입 아이템 렌더링
                  const incomeDate = new Date(income.date!);
                  const timeStr = incomeDate.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isDeleting = deletingIncomeId === income.id;

                  const IconComponent = income.category
                    ? getIconComponent(income.category.icon)
                    : null;
                  const categoryName =
                    income.category?.name || income.source || "수입";
                  const categoryIcon = income.category?.icon || "💰";

                  const handleIncomeDelete = async () => {
                    if (!bookId) {
                      toast.error("가계부를 찾을 수 없습니다.");
                      return;
                    }

                    setDeletingIncomeId(income.id);

                    try {
                      const response = await fetch(
                        `/api/book/${bookId}/income/${income.id}`,
                        {
                          method: "DELETE",
                        }
                      );

                      if (!response.ok) {
                        let errorMessage = "수입 삭제에 실패했습니다.";
                        try {
                          const errorData = await response.json();
                          errorMessage = errorData.error || errorMessage;
                        } catch {
                          // JSON 파싱 실패 시 기본 메시지 사용
                        }
                        throw new Error(errorMessage);
                      }

                      toast.success("수입이 삭제되었습니다.");
                      if (bookId) {
                        onIncomeUpdate(bookId);
                      }
                      onOpenChange(false);
                    } catch (error) {
                      console.error("수입 삭제 오류:", error);
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "수입 삭제에 실패했습니다."
                      );
                    } finally {
                      setDeletingIncomeId(null);
                    }
                  };

                  return (
                    <div
                      key={income.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                        {IconComponent ? (
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <span className="text-lg">{categoryIcon}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{categoryName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {timeStr}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            +{income.amount.toLocaleString()}원
                          </div>
                        </div>
                        {bookId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                                <span className="sr-only">메뉴</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/book/edit/${income.id}?type=income`}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  수정
                                </Link>
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    삭제
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      수입 삭제
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      정말로 이 수입을 삭제하시겠습니까?
                                      <br />이 작업은 되돌릴 수 없습니다.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleIncomeDelete}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      삭제
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })
            )}
            <Link
              href={`/book/add?date=${selectedDate.toFormat("yyyy-MM-dd")}`}
            >
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 초기값 읽기
  const getInitialView = () => {
    const view = searchParams.get("view");
    return view === "calendar" ? "calendar" : "daily";
  };

  const getInitialSort = () => {
    const sort = searchParams.get("sort");
    const validSorts = [
      "date-desc",
      "date-asc",
      "expense-amount-desc",
      "expense-amount-asc",
      "income-amount-desc",
      "income-amount-asc",
    ];
    return validSorts.includes(sort || "") ? sort || "date-desc" : "date-desc";
  };

  const getInitialFilter = () => {
    const filter = searchParams.get("filter");
    const validFilters = ["all", "income", "expense"];
    return validFilters.includes(filter || "") ? filter || "all" : "all";
  };

  const getInitialDate = () => {
    const month = searchParams.get("month");
    if (!month) {
      return DateTime.now();
    } else {
      return DateTime.fromFormat(month, "yyyy-MM", { zone: "utc" });
    }
  };

  // 수입 탭 제거로 인해 activeType 제거됨
  const [activeView, setActiveView] = useState<string>(getInitialView());
  const [selectedDate, setSelectedDate] = useState<DateTime>(getInitialDate());
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    getInitialFilter() as "all" | "income" | "expense"
  );
  const [sortBy, setSortBy] = useState<string>(getInitialSort());
  const [selectedCalendarDate, setSelectedCalendarDate] =
    useState<DateTime | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bookId, setBookId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // URL 파라미터 업데이트 함수
  const updateURLParams = useCallback(
    (updates: {
      type?: string;
      view?: string;
      sort?: string;
      filter?: string;
      month?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      // 수입 탭 제거로 인해 type 파라미터 제거

      if (updates.view !== undefined) {
        if (updates.view === "daily") {
          params.delete("view");
        } else {
          params.set("view", updates.view);
        }
      }

      if (updates.sort !== undefined) {
        if (updates.sort === "date-desc") {
          params.delete("sort");
        } else {
          params.set("sort", updates.sort);
        }
      }

      if (updates.filter !== undefined) {
        if (updates.filter === "all") {
          params.delete("filter");
        } else {
          params.set("filter", updates.filter);
        }
      }

      if (updates.month !== undefined) {
        if (updates.month === DateTime.now().toFormat("yyyy-MM")) {
          params.delete("month");
        } else {
          params.set("month", updates.month);
        }
      }

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  // 수입 탭 제거로 인해 handleTypeChange 제거

  const handleViewChange = (view: string) => {
    setActiveView(view);
    updateURLParams({ view });
  };

  const handleFilterChange = (filter: string) => {
    setTypeFilter(filter as "all" | "income" | "expense");
    updateURLParams({ filter });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateURLParams({ sort });
  };

  const handleDateChange = (date: DateTime) => {
    setSelectedDate(date);
    const monthStr = date.toFormat("yyyy-MM");
    updateURLParams({ month: monthStr });
  };

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    const type = searchParams.get("type");
    const view = searchParams.get("view");
    const sort = searchParams.get("sort");
    const filter = searchParams.get("filter");
    const month = searchParams.get("month");

    // 수입 탭 제거로 인해 type 파라미터 처리 제거

    if (view === "calendar" || view === "daily") {
      setActiveView(view);
    }

    if (sort) {
      const validSorts = [
        "date-desc",
        "date-asc",
        "expense-amount-desc",
        "expense-amount-asc",
        "income-amount-desc",
        "income-amount-asc",
      ];
      if (validSorts.includes(sort)) {
        setSortBy(sort);
      }
    } else {
      setSortBy("date-desc");
    }

    if (filter) {
      const validFilters = ["all", "income", "expense"];
      if (validFilters.includes(filter)) {
        setTypeFilter(filter as "all" | "income" | "expense");
      }
    } else {
      setTypeFilter("all");
    }
  }, [searchParams]);

  // 가계부 ID 및 지출 목록 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 개인 가계부 목록 조회
        const booksResponse = await fetch("/api/book");
        if (!booksResponse.ok) {
          throw new Error("가계부 목록 조회에 실패했습니다.");
        }
        const booksData = await booksResponse.json();
        const personalBook = booksData.books?.[0]; // 첫 번째 개인 가계부 사용

        if (!personalBook) {
          toast.error("가계부를 찾을 수 없습니다.");
          return;
        }

        setBookId(personalBook.id);
        await loadExpenses(personalBook.id);
        await loadIncomes(personalBook.id);
      } catch (error) {
        console.error("데이터 로드 오류:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 선택된 월이 변경될 때 지출/수입 목록 다시 로드
  useEffect(() => {
    if (bookId) {
      loadExpenses(bookId);
      loadIncomes(bookId);
    }
  }, [selectedDate, bookId]);

  const loadExpenses = async (id: string) => {
    try {
      const startDate = selectedDate.startOf("month");
      const endDate = startDate.plus({ month: 1 });

      const response = await fetch(
        `/api/book/${id}/expense?startDate=${startDate.toISODate()}&endDate=${endDate.toISODate()}`
      );

      if (!response.ok) {
        throw new Error("지출 목록 조회에 실패했습니다.");
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("지출 목록 로드 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "지출 목록을 불러오는데 실패했습니다."
      );
    }
  };

  const loadIncomes = async (id: string) => {
    try {
      const startDate = selectedDate;
      const endDate = startDate.plus({ month: 1 });

      const response = await fetch(
        `/api/book/${id}/income?startDate=${startDate.toISODate()}&endDate=${endDate.toISODate()}`
      );

      if (!response.ok) {
        throw new Error("수입 목록 조회에 실패했습니다.");
      }

      const data = await response.json();
      setIncomes(data.incomes || []);
    } catch (error) {
      console.error("수입 목록 로드 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "수입 목록을 불러오는데 실패했습니다."
      );
    }
  };

  const handleCalendarDateSelect = (date: DateTime) => {
    setSelectedCalendarDate(date);
    setDrawerOpen(true);
  };

  return (
    <AppLayout
      breadcrumbs={[{ label: "홈", href: "/home" }, { label: "가계부" }]}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <MonthSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          <Tabs value={activeView} onValueChange={handleViewChange}>
            <TabsList>
              <TabsTrigger value="daily">일별</TabsTrigger>
              <TabsTrigger value="calendar">캘린더</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <MonthlySummaryCard
          expenses={expenses}
          incomes={incomes}
          selectedMonth={selectedDate}
        />
        <Tabs value={activeView} onValueChange={handleViewChange}>
          <TabsContent value="daily">
            <DailyExpenseList
              selectedMonth={selectedDate}
              expenses={expenses}
              incomes={incomes}
              isLoading={isLoading}
              bookId={bookId}
              onExpenseUpdate={loadExpenses}
              onIncomeUpdate={loadIncomes}
              typeFilter={typeFilter}
              sortBy={sortBy}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
            />
          </TabsContent>
          <TabsContent value="calendar">
            <div className="space-y-4">
              {/* 필터 및 정렬 UI */}
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {typeFilter === "all"
                          ? "전체"
                          : typeFilter === "income"
                          ? "수입"
                          : "지출"}
                      </span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>필터</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">유형</h3>
                        <ButtonGroup aria-label="유형" className="w-full">
                          <Button
                            variant={
                              typeFilter === "all" ? "default" : "outline"
                            }
                            onClick={() => handleFilterChange("all")}
                            className="flex-1"
                          >
                            전체
                          </Button>
                          <Button
                            variant={
                              typeFilter === "income" ? "default" : "outline"
                            }
                            onClick={() => handleFilterChange("income")}
                            className="flex-1"
                          >
                            수입
                          </Button>
                          <Button
                            variant={
                              typeFilter === "expense" ? "default" : "outline"
                            }
                            onClick={() => handleFilterChange("expense")}
                            className="flex-1"
                          >
                            지출
                          </Button>
                        </ButtonGroup>
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
              <ExpenseCalendar
                month={selectedDate}
                expenses={expenses}
                incomes={incomes}
                onDateSelect={handleCalendarDateSelect}
                typeFilter={typeFilter}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DateExpenseDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedDate={selectedCalendarDate}
        expenses={expenses}
        incomes={incomes}
        bookId={bookId}
        onExpenseUpdate={loadExpenses}
        onIncomeUpdate={loadIncomes}
      />

      {/* Floating Action Button */}
      <Link href={`/book/add?month=${selectedDate.toFormat("yyyy-MM")}`}>
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
