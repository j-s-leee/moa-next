"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  ChevronDownIcon,
  Settings,
} from "lucide-react";
import {
  UtensilsCrossed,
  ShoppingCart,
  Coffee,
  Home,
  Car,
  Wallet,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 개인 카테고리
const personalExpenseCategories: { name: string; icon: LucideIcon }[] = [
  { name: "식비", icon: UtensilsCrossed },
  { name: "쇼핑", icon: ShoppingCart },
  { name: "카페", icon: Coffee },
  { name: "주거", icon: Home },
  { name: "교통", icon: Car },
];

const personalIncomeCategories: { name: string; icon: LucideIcon }[] = [
  { name: "급여", icon: Wallet },
  { name: "용돈", icon: PiggyBank },
];

// 공동 카테고리
const sharedExpenseCategories: { name: string; icon: LucideIcon }[] = [
  { name: "공동 식비", icon: UtensilsCrossed },
  { name: "공동 쇼핑", icon: ShoppingCart },
];

const sharedIncomeCategories: { name: string; icon: LucideIcon }[] = [
  { name: "공동 수입", icon: Wallet },
];

function CategoryDrawer({
  type,
  selectedCategory,
  onSelectCategory,
  children,
}: {
  type: "income" | "expense";
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const personalCategories =
    type === "expense" ? personalExpenseCategories : personalIncomeCategories;
  const sharedCategories =
    type === "expense" ? sharedExpenseCategories : sharedIncomeCategories;

  const selectedCategoryData = [
    ...personalCategories,
    ...sharedCategories,
  ].find((cat) => cat.name === selectedCategory);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle>카테고리 선택</DrawerTitle>
            <Link href="/book/category">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">카테고리 편집</span>
              </Button>
            </Link>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <div className="space-y-4">
            {/* 개인 카테고리 */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                개인 카테고리
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {personalCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => {
                        onSelectCategory(category.name);
                        setOpen(false);
                      }}
                      className={cn("flex flex-col items-center gap-2 p-3")}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-12 h-12 bg-muted rounded-md"
                        )}
                      >
                        <Icon className={cn("h-6 w-6 text-muted-foreground")} />
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 공동 카테고리 */}
            {sharedCategories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  공동 카테고리
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {sharedCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.name}
                        onClick={() => {
                          onSelectCategory(category.name);
                          setOpen(false);
                        }}
                        className={cn("flex flex-col items-center gap-2 p-3")}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-12 h-12 bg-muted rounded-md"
                          )}
                        >
                          <Icon
                            className={cn("h-6 w-6 text-muted-foreground")}
                          />
                        </div>
                        <span className="text-xs font-medium text-center leading-tight">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ExpenseForm() {
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "날짜 선택";
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  const selectedCategoryData = [
    ...personalExpenseCategories,
    ...sharedExpenseCategories,
  ].find((cat) => cat.name === category);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <CategoryDrawer
          type="expense"
          selectedCategory={category}
          onSelectCategory={setCategory}
        >
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {selectedCategoryData ? (
              <>
                <selectedCategoryData.icon className="mr-2 h-4 w-4" />
                {selectedCategoryData.name}
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

      <div className="space-y-2">
        <Label htmlFor="date">날짜</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date"
              className="w-full justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : "날짜 선택"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(date) => {
                setDate(date);
                setCalendarOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">메모</Label>
        <Input
          id="memo"
          placeholder="메모를 입력하세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="recurring" className="cursor-pointer">
          매월 정기 여부
        </Label>
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />
      </div>
    </div>
  );
}

function IncomeForm() {
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "날짜 선택";
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  const selectedCategoryData = [
    ...personalIncomeCategories,
    ...sharedIncomeCategories,
  ].find((cat) => cat.name === category);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <CategoryDrawer
          type="income"
          selectedCategory={category}
          onSelectCategory={setCategory}
        >
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {selectedCategoryData ? (
              <>
                <selectedCategoryData.icon className="mr-2 h-4 w-4" />
                {selectedCategoryData.name}
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

      <div className="space-y-2">
        <Label>날짜</Label>
        <div className="relative">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            onClick={() => setCalendarOpen(!calendarOpen)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDate(date)}
          </Button>
          {calendarOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setCalendarOpen(false)}
              />
              <div className="absolute z-50 mt-2 w-auto rounded-md border bg-popover p-3 shadow-md">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    setCalendarOpen(false);
                  }}
                  showOutsideDays={false}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="memo">메모</Label>
        <Input
          id="memo"
          placeholder="메모를 입력하세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="recurring" className="cursor-pointer">
          매월 정기 여부
        </Label>
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />
      </div>
    </div>
  );
}

export default function AddExpensePage() {
  const router = useRouter();

  const handleSave = () => {
    // TODO: 저장 로직 구현
    console.log("저장");
  };

  return (
    <AppLayout
      title="내역 추가"
      leftAction={
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
      <div>
        <Tabs defaultValue="expense">
          <TabsList className="mx-auto">
            <TabsTrigger value="income">수입</TabsTrigger>
            <TabsTrigger value="expense">지출</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <IncomeForm />
          </TabsContent>
          <TabsContent value="expense">
            <ExpenseForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
