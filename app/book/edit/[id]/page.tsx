"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/app-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Trash2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { DateTime } from "luxon";
import { expenseSchema, incomeSchema, type ExpenseFormData, type IncomeFormData } from "@/lib/validations";
import { 
  useBooks, 
  useCategories, 
  useExpense, 
  useIncome, 
  useUpdateExpense, 
  useUpdateIncome, 
  useDeleteExpense, 
  useDeleteIncome,
  type ExpenseItem,
  type IncomeItem
} from "@/lib/react-query/queries";
import { useBookStore } from "@/lib/stores/book-store";

// 카테고리 타입 정의 (쿼리 훅에서 export하지 않으므로 여기서 정의)
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
              <Link href={`/book/${bookId}/categories`}>
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
                  bookId ? `/book/${bookId}/categories/add` : "/book/category"
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
  expenseId,
  categories,
  onSave,
  onDelete,
}: {
  bookId: string | null;
  expenseId: string;
  categories: Category[];
  onSave: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      date: new Date(),
      description: "",
    },
  });

  // 지출 조회
  const { data: expense, isLoading, error } = useExpense(bookId, expenseId);
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // 기존 지출 데이터 로드
  useEffect(() => {
    if (expense) {
      // 날짜 변환
      let dateValue: Date;
      if (expense.date) {
        const dateObj =
          typeof expense.date === "string"
            ? DateTime.fromISO(expense.date)
            : DateTime.fromJSDate(new Date(expense.date));
        dateValue = dateObj.isValid ? dateObj.toJSDate() : new Date();
      } else {
        dateValue = new Date();
      }

      form.reset({
        categoryId: expense.categoryId,
        amount: expense.amount.toString(),
        date: dateValue,
        description: expense.description || "",
      });
    }
  }, [expense, form]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      if (error instanceof Error && error.message === "지출을 찾을 수 없습니다.") {
        toast.error("지출을 찾을 수 없습니다.");
        router.push("/book");
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "지출을 불러오는데 실패했습니다."
        );
        router.push("/book");
      }
    }
  }, [error, router]);

  const categoryId = form.watch("categoryId");
  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const IconComponent = selectedCategory
    ? ((LucideIcons as any)[selectedCategory.icon || ""] as LucideIcon) || null
    : null;

  const onSubmit = async (data: ExpenseFormData) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    updateExpense.mutate(
      {
        bookId,
        expenseId,
        data: {
          categoryId: data.categoryId,
          amount: Number(data.amount),
          date: DateTime.fromJSDate(data.date).toFormat("yyyy-MM-dd"),
          description: data.description?.trim() || null,
        },
      },
      {
        onSuccess: () => {
          onSave();
        },
      }
    );
  };

  const handleDelete = () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    deleteExpense.mutate(
      { bookId, expenseId },
      {
        onSuccess: () => {
          onDelete();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          name="description"
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

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteExpense.isPending}
                className="flex-1"
              >
                {deleteExpense.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>지출 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 이 지출을 삭제하시겠습니까?
                  <br />이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Form>
  );
}

function IncomeForm({
  bookId,
  incomeId,
  categories,
  onSave,
  onDelete,
}: {
  bookId: string | null;
  incomeId: string;
  categories: Category[];
  onSave: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      incomeType: "recurring",
      categoryId: "",
      amount: "",
      period: "monthly",
      startDate: new Date(),
      endDate: null,
      source: "",
    },
  });

  // 수입 조회
  const { data: income, isLoading, error } = useIncome(bookId, incomeId);
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  // 기존 수입 데이터 로드
  useEffect(() => {
    if (income) {
      // 날짜 변환
      let startDateValue: Date;
      if (income.startDate) {
        const dateObj =
          typeof income.startDate === "string"
            ? DateTime.fromISO(income.startDate)
            : DateTime.fromJSDate(new Date(income.startDate));
        startDateValue = dateObj.isValid ? dateObj.toJSDate() : new Date();
      } else {
        startDateValue = new Date();
      }

      let endDateValue: Date | null = null;
      if (income.endDate) {
        const dateObj =
          typeof income.endDate === "string"
            ? DateTime.fromISO(income.endDate)
            : DateTime.fromJSDate(new Date(income.endDate));
        endDateValue = dateObj.isValid ? dateObj.toJSDate() : null;
      }

      form.reset({
        incomeType: "recurring",
        categoryId: income.categoryId || "",
        amount: income.amount.toString(),
        period: income.period || "monthly",
        startDate: startDateValue,
        endDate: endDateValue,
        source: income.source || "",
      });
    }
  }, [income, form]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      if (error instanceof Error && error.message === "수입을 찾을 수 없습니다.") {
        toast.error("수입을 찾을 수 없습니다.");
        router.push("/book?type=income");
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "수입을 불러오는데 실패했습니다."
        );
        router.push("/book?type=income");
      }
    }
  }, [error, router]);

  const categoryId = form.watch("categoryId");
  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const IconComponent = selectedCategory
    ? ((LucideIcons as any)[selectedCategory.icon || ""] as LucideIcon) || null
    : null;
  const hasEndDate = form.watch("endDate") !== null && form.watch("endDate") !== undefined;

  const onSubmit = async (data: IncomeFormData) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    if (data.incomeType !== "recurring") {
      toast.error("수입 수정은 반복 수입만 지원합니다.");
      return;
    }

    updateIncome.mutate(
      {
        bookId,
        incomeId,
        data: {
          categoryId: data.categoryId,
          amount: Number(data.amount),
          period: data.period,
          source: data.source?.trim() || null,
          incomeType: "actual", // 기본값: 실제 수입
          startDate: data.startDate
            ? DateTime.fromJSDate(data.startDate).toFormat("yyyy-MM-dd")
            : null,
          endDate: data.endDate
            ? DateTime.fromJSDate(data.endDate).toFormat("yyyy-MM-dd")
            : null,
        },
      },
      {
        onSuccess: () => {
          onSave();
        },
      }
    );
  };

  const handleDelete = () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    deleteIncome.mutate(
      { bookId, incomeId },
      {
        onSuccess: () => {
          onDelete();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                    } else {
                      field.onChange(new Date());
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

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteIncome.isPending}
                className="flex-1"
              >
                {deleteIncome.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </>
                )}
              </Button>
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
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Form>
  );
}

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const itemId = params.id as string;
  const type = searchParams.get("type") || "expense"; // 기본값: expense
  const { currentBookId, setCurrentBookId } = useBookStore();

  // 가계부 목록 조회
  const { data: booksData, isLoading: isLoadingBooks } = useBooks();
  
  // 가계부가 로드되면 첫 번째 개인 가계부를 선택
  useEffect(() => {
    if (booksData?.books && !currentBookId) {
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
  }, [booksData, currentBookId, setCurrentBookId, router]);

  // 카테고리 목록 조회
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories(currentBookId);
  
  const categories = (categoriesData?.categories || []) as Category[];
  const isLoading = isLoadingBooks || isLoadingCategories;

  const handleSave = useCallback(() => {
    // searchParams 유지하면서 목록 페이지로 이동
    // window.location.search를 사용하여 최신 쿼리 파라미터를 가져옴
    const params = new URLSearchParams(window.location.search);
    // type 파라미터를 filter로 변환 (목록 페이지에서 filter를 사용)
    if (type === "income") {
      params.set("filter", "income");
    } else if (type === "expense") {
      params.set("filter", "expense");
    }
    // type 파라미터 제거 (목록 페이지에서는 filter를 사용)
    params.delete("type");
    const queryString = params.toString();
    router.push(`/book${queryString ? `?${queryString}` : ""}`);
  }, [router, type]);

  const handleDelete = useCallback(() => {
    // searchParams 유지하면서 목록 페이지로 이동
    // window.location.search를 사용하여 최신 쿼리 파라미터를 가져옴
    const params = new URLSearchParams(window.location.search);
    // type 파라미터를 filter로 변환 (목록 페이지에서 filter를 사용)
    if (type === "income") {
      params.set("filter", "income");
    } else if (type === "expense") {
      params.set("filter", "expense");
    }
    // type 파라미터 제거 (목록 페이지에서는 filter를 사용)
    params.delete("type");
    const queryString = params.toString();
    router.push(`/book${queryString ? `?${queryString}` : ""}`);
  }, [router, type]);

  if (isLoading) {
    return (
      <AppLayout
        title={type === "income" ? "수입 수정" : "지출 수정"}
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
      title={type === "income" ? "수입 수정" : "지출 수정"}
      leftAction={
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
    >
      {type === "income" ? (
        <IncomeForm
          bookId={currentBookId}
          incomeId={itemId}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : (
        <ExpenseForm
          bookId={currentBookId}
          expenseId={itemId}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </AppLayout>
  );
}
