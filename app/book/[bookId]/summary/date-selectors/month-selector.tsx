"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export function MonthSelector({
  selectedDate,
  onDateChange,
  bookId,
  basePath = "summary",
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  bookId: string;
  basePath?: string;
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
    router.push(`/book/${bookId}/${basePath}?year=${year}&month=${month}`);
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

