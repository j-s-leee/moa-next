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

export function YearSelector({
  selectedYear,
  onYearChange,
  bookId,
  basePath = "summary",
}: {
  selectedYear: number;
  onYearChange: (year: number) => void;
  bookId: string;
  basePath?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
    router.push(`/book/${bookId}/${basePath}?year=${year}`);
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

