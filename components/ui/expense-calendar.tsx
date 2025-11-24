"use client";

import * as React from "react";
import { useState } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { DateTime } from "luxon";

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
  categoryId: string | null;
  amount: number;
  date: string | null; // 단일 거래 수입의 경우 ISO string
  period: "monthly" | "yearly" | null;
  source: string | null;
  incomeType: "actual" | "transfer";
  transferredFromBookId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseCalendarProps {
  month?: DateTime;
  expenses: ExpenseItem[];
  incomes?: IncomeItem[]; // 단일 거래 수입 추가
  onDateSelect?: (date: DateTime) => void;
  typeFilter?: "all" | "income" | "expense"; // 필터 추가
}

// 반복 수입을 해당 기간의 실제 발생 날짜로 변환
function getRecurringIncomeDates(
  income: IncomeItem,
  targetMonth: DateTime
): DateTime[] {
  if (!income.period || !income.startDate) {
    return [];
  }

  const dates: DateTime[] = [];
  const startDate = DateTime.fromISO(income.startDate, { zone: "utc" });

  const endDate = income.endDate
    ? DateTime.fromISO(income.endDate, { zone: "utc" })
    : null;
  const targetYear = targetMonth.year;
  const targetMonthNum = targetMonth.month;

  // 시작일의 일자 추출 (예: 1월 1일이면 1일)
  const startDay = startDate.day;

  if (income.period === "monthly") {
    startDate.hasSame(targetMonth, "month");
    startDate.hasSame(targetMonth, "year");

    // 월간 수입: 매월 시작일의 일자에 발생
    const monthStart = targetMonth.startOf("month");
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
        dates.push(occurrenceDate);
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
        dates.push(occurrenceDate);
      }
    }
  }

  return dates;
}

// 날짜별로 그룹화하고 수입/지출 합계 계산 (지출 + 단일 거래 수입 + 반복 수입)
function getDailyTotals(
  expenses: ExpenseItem[],
  incomes: IncomeItem[] | undefined,
  targetMonth?: DateTime,
  typeFilter: "all" | "income" | "expense" = "all"
): Map<string, { income: number; expense: number }> {
  const totals = new Map<string, { income: number; expense: number }>();

  // 지출 추가 (필터 적용)
  expenses.forEach((expense) => {
    // 필터링: all이거나 해당 타입과 일치하는 경우만
    if (typeFilter !== "all" && expense.category.type !== typeFilter) {
      return;
    }

    const existing = totals.get(expense.date) || { income: 0, expense: 0 };

    if (expense.category.type === "income") {
      existing.income += expense.amount;
    } else {
      existing.expense += expense.amount;
    }

    totals.set(expense.date, existing);
  });

  // 수입 추가 (단일 거래 + 반복 수입) - 필터 적용
  if (incomes && targetMonth) {
    // 수입 필터가 적용된 경우에만 수입 추가
    if (typeFilter === "all" || typeFilter === "income") {
      incomes.forEach((income) => {
        if (income.date) {
          // 단일 거래 수입
          const existing = totals.get(income.date) || { income: 0, expense: 0 };
          existing.income += income.amount;
          totals.set(income.date, existing);
        } else if (income.period && income.startDate) {
          // 반복 수입: 해당 기간의 실제 발생 날짜로 변환
          const occurrenceDates = getRecurringIncomeDates(income, targetMonth);
          occurrenceDates.forEach((date) => {
            const existing = totals.get(date.toFormat("yyyy-MM-dd")) || {
              income: 0,
              expense: 0,
            };
            existing.income += income.amount;
            totals.set(date.toFormat("yyyy-MM-dd"), existing);
          });
        }
      });
    }
  }

  return totals;
}

export function ExpenseCalendar({
  month,
  expenses,
  incomes,
  onDateSelect,
  typeFilter = "all",
}: ExpenseCalendarProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [internalMonth, setInternalMonth] = useState<Date>(
    month?.toJSDate() || DateTime.now().toJSDate()
  );

  // 외부에서 전달받은 month가 변경되면 내부 state 업데이트
  React.useEffect(() => {
    if (month) {
      setInternalMonth(month.toJSDate());
    }
  }, [month]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate && onDateSelect) {
      onDateSelect(DateTime.fromJSDate(selectedDate));
    }
  };

  // DateTime으로 변환 (getDailyTotals에서 사용)
  const targetMonthDateTime =
    month || DateTime.fromJSDate(internalMonth, { zone: "utc" });

  // 날짜별 수입/지출 합계 계산 (지출 + 단일 거래 수입 + 반복 수입) - 필터 적용
  const dailyTotals = getDailyTotals(
    expenses,
    incomes,
    targetMonthDateTime,
    typeFilter
  );

  return (
    <div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        month={internalMonth}
        onMonthChange={setInternalMonth}
        showOutsideDays={false}
        className="rounded-lg border-none [--cell-size:--spacing(12)]"
        hideNavigation={true}
        classNames={{
          month_caption: "hidden",
        }}
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => {
            const dateKey = DateTime.fromJSDate(day.date).toFormat(
              "yyyy-MM-dd"
            );
            const totals = dailyTotals.get(dateKey) || {
              income: 0,
              expense: 0,
            };
            const hasData = totals.income > 0 || totals.expense > 0;

            return (
              <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                {children}
                {!modifiers.outside && hasData && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {totals.income > 0 && (
                      <span className="text-[8px] font-medium text-blue-600 dark:text-blue-400 tracking-tighter">
                        +{totals.income.toLocaleString()}
                      </span>
                    )}
                    {totals.expense > 0 && (
                      <span className="text-[8px] font-medium text-red-600 dark:text-red-400 tracking-tighter">
                        -{totals.expense.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </CalendarDayButton>
            );
          },
        }}
      />
    </div>
  );
}
