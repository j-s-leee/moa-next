"use client";

import * as React from "react";
import { useState } from "react";
import {
  Calendar,
  CalendarDayButton,
} from "@/components/ui/calendar";

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

interface ExpenseCalendarProps {
  month?: Date;
  expenses: ExpenseItem[];
  onDateSelect?: (date: Date) => void;
}

// 날짜별로 그룹화하고 수입/지출 합계 계산
function getDailyTotals(
  expenses: ExpenseItem[]
): Map<string, { income: number; expense: number }> {
  const totals = new Map<string, { income: number; expense: number }>();

  expenses.forEach((expense) => {
    const dateKey = new Date(expense.date).toISOString().split("T")[0]; // YYYY-MM-DD
    const existing = totals.get(dateKey) || { income: 0, expense: 0 };

    if (expense.category.type === "income") {
      existing.income += expense.amount;
    } else {
      existing.expense += expense.amount;
    }

    totals.set(dateKey, existing);
  });

  return totals;
}

export function ExpenseCalendar({
  month,
  expenses,
  onDateSelect,
}: ExpenseCalendarProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [internalMonth, setInternalMonth] = useState<Date>(
    month || new Date()
  );

  // 외부에서 전달받은 month가 변경되면 내부 state 업데이트
  React.useEffect(() => {
    if (month) {
      setInternalMonth(new Date(month.getFullYear(), month.getMonth(), 1));
    }
  }, [month]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate && onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  // 날짜별 수입/지출 합계 계산
  const dailyTotals = getDailyTotals(expenses);

  return (
    <div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        month={internalMonth}
        onMonthChange={setInternalMonth}
        showOutsideDays={false}
        className="rounded-lg border [--cell-size:--spacing(12)]"
        hideNavigation={true}
        classNames={{
          month_caption: "hidden",
        }}
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => {
            const dateKey = day.date.toISOString().split("T")[0];
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
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        +{totals.income.toLocaleString()}
                      </span>
                    )}
                    {totals.expense > 0 && (
                      <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
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

