"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Check,
  ChevronDownIcon,
  Settings,
  Loader2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { DateTime } from "luxon";

// 카테고리 타입 정의
interface Category {
  id: string;
  bookId: string;
  name: string;
  icon: string | null;
  type: "expense" | "income";
  expenseType: "fixed" | "variable" | "annual" | "one-time" | null;
  autoDetectedType: "fixed" | "variable" | null;
  lastTypeCheckDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

function CategoryDrawer({
  type,
  selectedCategoryId,
  onSelectCategory,
  categories,
  bookId,
  children,
}: {
  type: "income" | "expense";
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  categories: Category[];
  bookId: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const filteredCategories = categories.filter((cat) => cat.type === type);
  const selectedCategory = filteredCategories.find(
    (cat) => cat.id === selectedCategoryId
  );

  // 아이콘 동적 로드
  const getIconComponent = (iconName: string | null): LucideIcon | null => {
    if (!iconName) return null;
    return ((LucideIcons as any)[iconName] as LucideIcon) || null;
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle>카테고리 선택</DrawerTitle>
            {bookId && (
              <Link href={`/book/${bookId}/category`}>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">카테고리 편집</span>
                </Button>
              </Link>
            )}
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === "expense" ? "지출" : "수입"} 카테고리가 없습니다.
              <br />
              <Link
                href={
                  bookId ? `/book/${bookId}/category/add` : "/book/category"
                }
                className="text-primary hover:underline"
              >
                카테고리 추가하기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      onSelectCategory(category.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-md transition-colors",
                      selectedCategoryId === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-md",
                        selectedCategoryId === category.id
                          ? "bg-primary-foreground/20"
                          : "bg-muted"
                      )}
                    >
                      {IconComponent ? (
                        <IconComponent
                          className={cn(
                            "h-6 w-6",
                            selectedCategoryId === category.id
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        />
                      ) : (
                        <span className="text-lg">{category.icon || "📦"}</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ExpenseForm({
  bookId,
  categories,
  onSave,
  initialDate,
}: {
  bookId: string | null;
  categories: Category[];
  onSave: () => void;
  initialDate?: DateTime | null;
}) {
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<DateTime | null>(
    initialDate || DateTime.now()
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const IconComponent = selectedCategory
    ? ((LucideIcons as any)[selectedCategory.icon || ""] as LucideIcon) || null
    : null;

  const handleSave = async () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    if (!categoryId) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("금액을 입력해주세요.");
      return;
    }

    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/book/${bookId}/expense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          amount: Number(amount),
          date: date ? date.toFormat("yyyy-MM-dd") : null,
          description: memo.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "지출 추가에 실패했습니다.");
      }

      toast.success("지출이 추가되었습니다.");
      onSave();
    } catch (error) {
      console.error("지출 추가 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "지출 추가에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <CategoryDrawer
          type="expense"
          selectedCategoryId={categoryId}
          onSelectCategory={setCategoryId}
          categories={categories}
          bookId={bookId}
        >
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {selectedCategory && IconComponent ? (
              <>
                <IconComponent className="mr-2 h-4 w-4" />
                {selectedCategory.name}
              </>
            ) : selectedCategory ? (
              <>
                <span className="mr-2">{selectedCategory.icon || "📦"}</span>
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

      <div className="space-y-2">
        <Label htmlFor="date">날짜</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date"
              className="w-full justify-between font-normal"
            >
              {date ? date.toLocaleString() : "날짜 선택"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date ? date.toJSDate() : undefined}
              captionLayout="dropdown"
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  setDate(DateTime.fromJSDate(selectedDate));
                }
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

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            저장 중...
          </>
        ) : (
          "저장"
        )}
      </Button>
    </div>
  );
}

function IncomeForm({
  bookId,
  categories,
  onSave,
  initialDate,
}: {
  bookId: string | null;
  categories: Category[];
  onSave: () => void;
  initialDate?: DateTime | null;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [incomeType, setIncomeType] = useState<"single" | "recurring">(
    "single"
  ); // 단일 거래 vs 반복 수입
  const [date, setDate] = useState<DateTime | null>(
    initialDate || DateTime.now()
  ); // 단일 거래용 날짜
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly"); // 반복 수입용
  const [startDate, setStartDate] = useState<DateTime | null>(
    initialDate || DateTime.now()
  ); // 반복 수입용 시작일
  const [endDate, setEndDate] = useState<DateTime | null>(null); // 반복 수입용 종료일
  const [source, setSource] = useState(""); // 수입 출처 (선택사항)
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startDateCalendarOpen, setStartDateCalendarOpen] = useState(false);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const IconComponent = selectedCategory
    ? ((LucideIcons as any)[selectedCategory.icon || ""] as LucideIcon) || null
    : null;

  const handleSave = async () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    if (!categoryId) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("금액을 입력해주세요.");
      return;
    }

    // 단일 거래인 경우 date 필수
    if (incomeType === "single" && !date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    // 반복 수입인 경우 startDate 필수
    if (incomeType === "recurring" && !startDate) {
      toast.error("시작 날짜를 선택해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const requestBody: any = {
        categoryId,
        amount: Number(amount),
        incomeType: "actual", // 기본값: 실제 수입
        source: source.trim() || null,
      };

      if (incomeType === "single") {
        // 단일 거래: date만 사용, period와 startDate/endDate는 null
        requestBody.date = date ? date.toFormat("yyyy-MM-dd") : null;
        requestBody.period = null;
        requestBody.startDate = null;
        requestBody.endDate = null;
      } else {
        // 반복 수입: period와 startDate/endDate 사용, date는 null
        requestBody.date = null;
        requestBody.period = period;
        requestBody.startDate = startDate
          ? startDate.toFormat("yyyy-MM-dd")
          : null;
        requestBody.endDate =
          hasEndDate && endDate ? endDate.toFormat("yyyy-MM-dd") : null;
      }

      const response = await fetch(`/api/book/${bookId}/income`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "수입 추가에 실패했습니다.");
      }

      toast.success("수입이 추가되었습니다.");
      onSave();
    } catch (error) {
      console.error("수입 추가 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "수입 추가에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <CategoryDrawer
          type="income"
          selectedCategoryId={categoryId}
          onSelectCategory={setCategoryId}
          categories={categories}
          bookId={bookId}
        >
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {selectedCategory && IconComponent ? (
              <>
                <IconComponent className="mr-2 h-4 w-4" />
                {selectedCategory.name}
              </>
            ) : selectedCategory ? (
              <>
                <span className="mr-2">{selectedCategory.icon || "📦"}</span>
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

      <div className="space-y-2">
        <Label htmlFor="incomeType">수입 타입</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={incomeType === "single" ? "default" : "outline"}
            onClick={() => setIncomeType("single")}
            className="flex-1"
          >
            단일 거래
          </Button>
          <Button
            type="button"
            variant={incomeType === "recurring" ? "default" : "outline"}
            onClick={() => setIncomeType("recurring")}
            className="flex-1"
          >
            반복 수입
          </Button>
        </div>
      </div>

      {incomeType === "single" ? (
        // 단일 거래: 날짜만 입력
        <div className="space-y-2">
          <Label htmlFor="date">날짜</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date"
                className="w-full justify-between font-normal"
              >
                {date ? date.toLocaleString() : "날짜 선택"}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date ? date.toJSDate() : undefined}
                captionLayout="dropdown"
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    setDate(DateTime.fromJSDate(selectedDate));
                  }
                  setCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        // 반복 수입: 기간, 시작일, 종료일 입력
        <>
          <div className="space-y-2">
            <Label htmlFor="period">기간</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={period === "monthly" ? "default" : "outline"}
                onClick={() => setPeriod("monthly")}
                className="flex-1"
              >
                월간
              </Button>
              <Button
                type="button"
                variant={period === "yearly" ? "default" : "outline"}
                onClick={() => setPeriod("yearly")}
                className="flex-1"
              >
                연간
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">시작 날짜</Label>
            <Popover
              open={startDateCalendarOpen}
              onOpenChange={setStartDateCalendarOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="startDate"
                  className="w-full justify-between font-normal"
                >
                  {startDate ? startDate.toLocaleString() : "날짜 선택"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={startDate ? startDate.toJSDate() : undefined}
                  captionLayout="dropdown"
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setStartDate(DateTime.fromJSDate(selectedDate));
                    }
                    setStartDateCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasEndDate"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (!e.target.checked) {
                    setEndDate(null);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="hasEndDate" className="cursor-pointer">
                종료 날짜 설정 (선택사항)
              </Label>
            </div>
            {hasEndDate && (
              <Popover
                open={endDateCalendarOpen}
                onOpenChange={setEndDateCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {endDate ? endDate.toLocaleString() : "날짜 선택"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={endDate ? endDate.toJSDate() : undefined}
                    captionLayout="dropdown"
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        setEndDate(DateTime.fromJSDate(selectedDate));
                      }
                      setEndDateCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="source">출처 (선택사항)</Label>
        <Input
          id="source"
          placeholder="수입 출처를 입력하세요"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            저장 중...
          </>
        ) : (
          "저장"
        )}
      </Button>
    </div>
  );
}

export default function AddExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookId, setBookId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 쿼리 파라미터에서 날짜 가져오기
  const dateParam = searchParams.get("date");
  const monthParam = searchParams.get("month");
  const initialDate = dateParam
    ? DateTime.fromISO(dateParam)
    : monthParam
    ? DateTime.fromISO(`${monthParam}-01`)
    : null;

  // 가계부 ID 및 카테고리 로드
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
          router.push("/book");
          return;
        }

        setBookId(personalBook.id);

        // 카테고리 목록 조회
        const categoriesResponse = await fetch(
          `/api/book/${personalBook.id}/category`
        );
        if (!categoriesResponse.ok) {
          throw new Error("카테고리 목록 조회에 실패했습니다.");
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
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
  }, [router]);

  const handleSave = useCallback(() => {
    // searchParams 유지하면서 목록 페이지로 이동
    // window.location.search를 사용하여 최신 쿼리 파라미터를 가져옴
    const currentParams = new URLSearchParams(window.location.search);
    const queryString = currentParams.toString();
    router.push(`/book${queryString ? `?${queryString}` : ""}`);
  }, [router]);

  if (isLoading) {
    return (
      <AppLayout
        title="내역 추가"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">뒤로가기</span>
          </Button>
        }
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="내역 추가"
      leftAction={
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
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
            <IncomeForm
              bookId={bookId}
              categories={categories}
              onSave={handleSave}
              initialDate={initialDate}
            />
          </TabsContent>
          <TabsContent value="expense">
            <ExpenseForm
              bookId={bookId}
              categories={categories}
              onSave={handleSave}
              initialDate={initialDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
