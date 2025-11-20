"use client";

import * as React from "react";
import { useState } from "react";

import {
  Calendar,
  CalendarDayButton,
} from "@/components/ui/calendar-pricing-calendar";

function getPriceForDate(date: Date) {
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

  const val = (seed * 9301 + 49297) % 233280;

  return Math.floor(50 + (val / 30) * 200);
}

function getSecondPriceForDate(date: Date) {
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

  const val = (seed * 7307 + 39217) % 2380;

  return Math.floor(30 + (val / 20) * 150);
}

const CalendarPricing = ({
  month,
  onDateSelect,
}: {
  month?: Date;
  onDateSelect?: (date: Date) => void;
}) => {
  const [date, setDate] = useState<Date | undefined>();
  const [internalMonth, setInternalMonth] = useState<Date>(month || new Date());

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
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => {
            const price = getPriceForDate(day.date);
            const secondPrice = getSecondPriceForDate(day.date);
            const isGreen = price < 100;

            return (
              <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                {children}
                {!modifiers.outside && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      +{price}
                    </span>
                    <span className="text-[10px] text-red-600 dark:text-red-400">
                      -{secondPrice}
                    </span>
                  </div>
                )}
              </CalendarDayButton>
            );
          },
        }}
      />
    </div>
  );
};

export default CalendarPricing;
