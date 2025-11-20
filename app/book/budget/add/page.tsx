"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UtensilsCrossed, ShoppingCart, Coffee, Home, Car } from "lucide-react";

// 카테고리 데이터 (실제로는 카테고리 관리에서 가져와야 함)
const expenseCategories: { id: string; name: string; icon: LucideIcon }[] = [
  { id: "1", name: "식비", icon: UtensilsCrossed },
  { id: "2", name: "쇼핑", icon: ShoppingCart },
  { id: "3", name: "카페", icon: Coffee },
  { id: "4", name: "주거", icon: Home },
  { id: "5", name: "교통", icon: Car },
];

function CategoryDrawer({
  selectedCategoryId,
  onSelectCategory,
  children,
}: {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const selectedCategory = expenseCategories.find(
    (c) => c.id === selectedCategoryId
  );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>카테고리 선택</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <div className="grid grid-cols-4 gap-3 pt-2">
            {expenseCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategoryId === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    onSelectCategory(category.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-md",
                      isSelected ? "bg-primary-foreground/20" : "bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isSelected ? "text-primary-foreground" : ""
                    )}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function AddBudgetPage() {
  const router = useRouter();
  const [type, setType] = useState<"monthly" | "yearly">("monthly");
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(true);

  // 반복 예산용
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  // 비반복 예산용
  const [specificDate, setSpecificDate] = useState<Date | undefined>(
    new Date()
  );

  const selectedCategory = expenseCategories.find((c) => c.id === categoryId);

  const handleSave = () => {
    if (!categoryId || !amount) {
      alert("카테고리와 금액을 입력해주세요.");
      return;
    }

    if (isRecurring && !startDate) {
      alert("시작일을 선택해주세요.");
      return;
    }

    if (!isRecurring && !specificDate) {
      alert("기간을 선택해주세요.");
      return;
    }

    const budget = {
      id: Date.now().toString(),
      categoryId,
      type,
      amount: Number(amount),
      isRecurring,
      ...(isRecurring
        ? {
            startYear: startDate!.getFullYear(),
            startMonth:
              type === "monthly" ? startDate!.getMonth() + 1 : undefined,
          }
        : {
            year: specificDate!.getFullYear(),
            month:
              type === "monthly" ? specificDate!.getMonth() + 1 : undefined,
          }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: 실제 저장 로직 구현
    console.log("예산 저장", budget);
    router.push("/book/budget");
  };

  const handleBack = () => {
    // 부모 라우트로 이동
    router.push("/book/budget");
  };

  return (
    <AppLayout
      title="예산 추가"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Check className="size-4" />
          <span className="sr-only">저장</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <Tabs
          value={type}
          onValueChange={(v) => setType(v as "monthly" | "yearly")}
        >
          <TabsList className="mx-auto mb-6">
            <TabsTrigger value="monthly">월간</TabsTrigger>
            <TabsTrigger value="yearly">연간</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <CategoryDrawer
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
          >
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              {selectedCategory ? (
                <>
                  <selectedCategory.icon className="mr-2 h-4 w-4" />
                  {selectedCategory.name}
                </>
              ) : (
                "카테고리 선택"
              )}
            </Button>
          </CategoryDrawer>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">금액</Label>
          <Input
            id="amount"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="금액을 입력하세요"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="recurring" className="cursor-pointer">
            {type === "monthly" ? "매월 자동 적용" : "매년 자동 적용"}
          </Label>
          <Switch
            id="recurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
        </div>

        {isRecurring ? (
          <div className="space-y-2">
            <Label>시작 {type === "monthly" ? "월" : "연도"}</Label>
            {type === "monthly" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate
                      ? `${startDate.getFullYear()}년 ${
                          startDate.getMonth() + 1
                        }월`
                      : "시작 월 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    captionLayout="dropdown"
                    defaultMonth={startDate}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate
                      ? `${startDate.getFullYear()}년`
                      : "시작 연도 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    captionLayout="dropdown"
                    defaultMonth={startDate}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>{type === "monthly" ? "적용 월" : "적용 연도"}</Label>
            {type === "monthly" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !specificDate && "text-muted-foreground"
                    )}
                  >
                    {specificDate
                      ? `${specificDate.getFullYear()}년 ${
                          specificDate.getMonth() + 1
                        }월`
                      : "월 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={specificDate}
                    onSelect={setSpecificDate}
                    captionLayout="dropdown"
                    defaultMonth={specificDate}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !specificDate && "text-muted-foreground"
                    )}
                  >
                    {specificDate
                      ? `${specificDate.getFullYear()}년`
                      : "연도 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={specificDate}
                    onSelect={setSpecificDate}
                    captionLayout="dropdown"
                    defaultMonth={specificDate}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
