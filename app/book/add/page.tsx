"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { expenseSchema, incomeSchema, type ExpenseFormData, type IncomeFormData } from "@/lib/validations";
import { useBooks, useCategories, useCreateExpense, useCreateIncome } from "@/lib/react-query/queries";
import { useBookStore } from "@/lib/stores/book-store";

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
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      date: initialDate ? initialDate.toJSDate() : new Date(),
      memo: "",
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const IconComponent = selectedCategory
    ? ((LucideIcons as any)[selectedCategory.icon || ""] as LucideIcon) || null
    : null;

  const createExpense = useCreateExpense();

  const onSubmit = async (data: ExpenseFormData) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    createExpense.mutate(
      {
        bookId,
        data: {
          categoryId: data.categoryId,
          amount: Number(data.amount),
          date: DateTime.fromJSDate(data.date).toFormat("yyyy-MM-dd"),
          memo: data.memo?.trim() || null,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onSave();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <FormControl>
                <CategoryDrawer
                  type="expense"
                  selectedCategoryId={field.value || null}
                  onSelectCategory={field.onChange}
                  categories={categories}
                  bookId={bookId}
                >
                  <Button
                    type="button"
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>금액</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="금액을 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>날짜</FormLabel>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {field.value ? DateTime.fromJSDate(field.value).toLocaleString() : "날짜 선택"}
                      <ChevronDownIcon />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    captionLayout="dropdown"
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        field.onChange(selectedDate);
                        setCalendarOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Input placeholder="메모를 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createExpense.isPending}
          className="w-full"
        >
          {createExpense.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장"
          )}
        </Button>
      </form>
    </Form>
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startDateCalendarOpen, setStartDateCalendarOpen] = useState(false);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      incomeType: "single",
      categoryId: "",
      amount: "",
      date: initialDate ? initialDate.toJSDate() : undefined,
      period: "monthly",
      startDate: initialDate ? initialDate.toJSDate() : undefined,
      endDate: null,
      source: "",
    },
  });

  const incomeType = form.watch("incomeType");
  const selectedCategoryId = form.watch("categoryId");
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const IconComponent = selectedCategory
    ? ((LucideIcons as any)[selectedCategory.icon || ""] as LucideIcon) || null
    : null;
  const hasEndDate = form.watch("endDate") !== null && form.watch("endDate") !== undefined;

  const createIncome = useCreateIncome();

  const onSubmit = async (data: IncomeFormData) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    let requestBody: any = {
      categoryId: data.categoryId,
      amount: Number(data.amount),
      incomeType: "actual", // 기본값: 실제 수입
      source: data.source?.trim() || null,
    };

    if (data.incomeType === "single") {
      // 단일 거래: date만 사용, period와 startDate/endDate는 null
      if (!data.date) {
        toast.error("날짜를 선택해주세요");
        return;
      }
      requestBody.date = DateTime.fromJSDate(data.date).toFormat("yyyy-MM-dd");
      requestBody.period = null;
      requestBody.startDate = null;
      requestBody.endDate = null;
    } else {
      // 반복 수입: period와 startDate/endDate 사용, date는 null
      if (!data.period || !data.startDate) {
        toast.error("기간과 시작 날짜를 선택해주세요");
        return;
      }
      requestBody.date = null;
      requestBody.period = data.period;
      requestBody.startDate = DateTime.fromJSDate(data.startDate).toFormat("yyyy-MM-dd");
      requestBody.endDate = data.endDate
        ? DateTime.fromJSDate(data.endDate).toFormat("yyyy-MM-dd")
        : null;
    }

    createIncome.mutate(
      {
        bookId,
        data: requestBody,
      },
      {
        onSuccess: () => {
          form.reset();
          onSave();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <FormControl>
                <CategoryDrawer
                  type="income"
                  selectedCategoryId={field.value || null}
                  onSelectCategory={field.onChange}
                  categories={categories}
                  bookId={bookId}
                >
                  <Button
                    type="button"
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>금액</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="금액을 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="incomeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>수입 타입</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === "single" ? "default" : "outline"}
                    onClick={() => {
                      field.onChange("single");
                      // 단일 거래로 변경 시 date 초기화
                      if (initialDate) {
                        form.setValue("date", initialDate.toJSDate());
                      }
                    }}
                    className="flex-1"
                  >
                    단일 거래
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "recurring" ? "default" : "outline"}
                    onClick={() => {
                      field.onChange("recurring");
                      // 반복 수입으로 변경 시 startDate 초기화
                      if (initialDate) {
                        form.setValue("startDate", initialDate.toJSDate());
                      }
                    }}
                    className="flex-1"
                  >
                    반복 수입
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {incomeType === "single" ? (
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>날짜</FormLabel>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        {field.value ? DateTime.fromJSDate(field.value).toLocaleString() : "날짜 선택"}
                        <ChevronDownIcon />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      captionLayout="dropdown"
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          field.onChange(selectedDate);
                          setCalendarOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>기간</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === "monthly" ? "default" : "outline"}
                        onClick={() => field.onChange("monthly")}
                        className="flex-1"
                      >
                        월간
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "yearly" ? "default" : "outline"}
                        onClick={() => field.onChange("yearly")}
                        className="flex-1"
                      >
                        연간
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시작 날짜</FormLabel>
                  <Popover
                    open={startDateCalendarOpen}
                    onOpenChange={setStartDateCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {field.value ? DateTime.fromJSDate(field.value).toLocaleString() : "날짜 선택"}
                          <ChevronDownIcon />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        captionLayout="dropdown"
                        onSelect={(selectedDate) => {
                          if (selectedDate) {
                            field.onChange(selectedDate);
                            setStartDateCalendarOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="hasEndDate"
                      checked={hasEndDate}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          field.onChange(null);
                        } else if (initialDate) {
                          field.onChange(initialDate.toJSDate());
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
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            {field.value ? DateTime.fromJSDate(field.value).toLocaleString() : "날짜 선택"}
                            <ChevronDownIcon />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          captionLayout="dropdown"
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              field.onChange(selectedDate);
                              setEndDateCalendarOpen(false);
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>출처 (선택사항)</FormLabel>
              <FormControl>
                <Input placeholder="수입 출처를 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createIncome.isPending}
          className="w-full"
        >
          {createIncome.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function AddExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBookId, setCurrentBookId } = useBookStore();
  const bookId = currentBookId;

  // 쿼리 파라미터에서 날짜 가져오기
  const dateParam = searchParams.get("date");
  const monthParam = searchParams.get("month");
  const initialDate = dateParam
    ? DateTime.fromISO(dateParam)
    : monthParam
    ? DateTime.fromISO(`${monthParam}-01`)
    : null;

  // 가계부 목록 조회
  const { data: booksData, isLoading: isLoadingBooks } = useBooks();
  
  // 가계부가 로드되면 첫 번째 개인 가계부를 선택
  useEffect(() => {
    if (booksData?.books && !bookId) {
      const personalBook = booksData.books.find((book) => book.type === "personal");
      if (personalBook) {
        setCurrentBookId(personalBook.id);
      } else if (booksData.books.length > 0) {
        setCurrentBookId(booksData.books[0].id);
      } else {
        toast.error("가계부를 찾을 수 없습니다.");
        router.push("/book");
      }
    }
  }, [booksData, bookId, setCurrentBookId, router]);

  // 카테고리 목록 조회
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories(bookId);
  
  const categories = categoriesData?.categories || [];
  const isLoading = isLoadingBooks || isLoadingCategories;

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
