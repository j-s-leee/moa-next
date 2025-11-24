"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/app-layout";
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

// 지출 타입 정의
interface Expense {
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
  date: string;
  description: string | null;
  userId: string;
  budgetId: string | null;
  createdAt: string;
  updatedAt: string;
}

// 수입 타입 정의
interface Income {
  id: string;
  bookId: string;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
  };
  amount: number;
  period: "monthly" | "yearly";
  source: string | null;
  incomeType: "actual" | "transfer";
  transferredFromBookId: string | null;
  startDate: string;
  endDate: string | null;
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
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<DateTime | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 기존 지출 데이터 로드
  useEffect(() => {
    const loadExpense = async () => {
      if (!bookId) return;

      try {
        // expenseId로 직접 조회
        const response = await fetch(
          `/api/book/${bookId}/expense/${expenseId}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("지출을 찾을 수 없습니다.");
            router.push("/book");
            return;
          }
          throw new Error("지출 조회에 실패했습니다.");
        }

        const expense = await response.json();

        setCategoryId(expense.categoryId);
        setAmount(expense.amount.toString());
        // API에서 반환되는 날짜를 DateTime 객체로 변환
        // JSON 직렬화로 인해 날짜는 ISO 문자열 형식으로 반환됨
        if (expense.date) {
          const dateValue =
            typeof expense.date === "string"
              ? DateTime.fromISO(expense.date)
              : DateTime.fromJSDate(new Date(expense.date));
          setDate(dateValue.isValid ? dateValue : null);
        } else {
          setDate(null);
        }
        setMemo(expense.description || "");
      } catch (error) {
        console.error("지출 로드 오류:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "지출을 불러오는데 실패했습니다."
        );
        router.push("/book");
      } finally {
        setIsLoading(false);
      }
    };

    loadExpense();
  }, [bookId, expenseId, router]);

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
      const response = await fetch(`/api/book/${bookId}/expense/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          amount: Number(amount),
          date: date.toFormat("yyyy-MM-dd"),
          description: memo.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "지출 수정에 실패했습니다.");
      }

      toast.success("지출이 수정되었습니다.");
      onSave();
    } catch (error) {
      console.error("지출 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "지출 수정에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/book/${bookId}/expense/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "지출 삭제에 실패했습니다.");
      }

      // 응답이 성공이면 (200-299 범위)
      await response.json().catch(() => ({ success: true }));

      toast.success("지출이 삭제되었습니다.");
      onDelete();
    } catch (error) {
      console.error("지출 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "지출 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              onSelect={(date) => {
                if (date) {
                  setDate(DateTime.fromJSDate(date));
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

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? (
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
              variant="destructive"
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
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
    </div>
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [startDate, setStartDate] = useState<DateTime | null>(null);
  const [endDate, setEndDate] = useState<DateTime | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const IconComponent = selectedCategory
    ? ((LucideIcons as any)[selectedCategory.icon || ""] as LucideIcon) || null
    : null;

  // 기존 수입 데이터 로드
  useEffect(() => {
    const loadIncome = async () => {
      if (!bookId) return;

      try {
        // incomeId로 직접 조회
        const response = await fetch(`/api/book/${bookId}/income/${incomeId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("수입을 찾을 수 없습니다.");
            router.push("/book?type=income");
            return;
          }
          throw new Error("수입 조회에 실패했습니다.");
        }

        const income = await response.json();

        setCategoryId(
          income.categoryId || (income as any).category?.id || null
        );
        setAmount(income.amount.toString());
        setPeriod(income.period);
        // API에서 반환되는 날짜를 DateTime 객체로 변환
        // JSON 직렬화로 인해 날짜는 ISO 문자열 형식으로 반환됨
        if (income.startDate) {
          const startDateValue =
            typeof income.startDate === "string"
              ? DateTime.fromISO(income.startDate)
              : DateTime.fromJSDate(new Date(income.startDate));
          setStartDate(startDateValue.isValid ? startDateValue : null);
        } else {
          setStartDate(null);
        }
        if (income.endDate) {
          const endDateValue =
            typeof income.endDate === "string"
              ? DateTime.fromISO(income.endDate)
              : DateTime.fromJSDate(new Date(income.endDate));
          setEndDate(endDateValue.isValid ? endDateValue : null);
          setHasEndDate(true);
        } else {
          setEndDate(null);
          setHasEndDate(false);
        }
      } catch (error) {
        console.error("수입 로드 오류:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "수입을 불러오는데 실패했습니다."
        );
        router.push("/book?type=income");
      } finally {
        setIsLoading(false);
      }
    };

    loadIncome();
  }, [bookId, incomeId, router]);

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

    if (!startDate) {
      toast.error("시작 날짜를 선택해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/book/${bookId}/income/${incomeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          amount: Number(amount),
          period,
          source: null, // 카테고리 이름으로 대체
          incomeType: "actual", // 기본값: 실제 수입
          startDate: startDate ? startDate.toFormat("yyyy-MM-dd") : null,
          endDate:
            hasEndDate && endDate ? endDate.toFormat("yyyy-MM-dd") : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "수입 수정에 실패했습니다.");
      }

      toast.success("수입이 수정되었습니다.");
      onSave();
    } catch (error) {
      console.error("수입 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "수입 수정에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/book/${bookId}/income/${incomeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "수입 삭제에 실패했습니다.");
      }

      await response.json().catch(() => ({ success: true }));

      toast.success("수입이 삭제되었습니다.");
      onDelete();
    } catch (error) {
      console.error("수입 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "수입 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate ? startDate.toJSDate() : undefined}
              captionLayout="dropdown"
              onSelect={(date) => {
                if (date) {
                  setStartDate(DateTime.fromJSDate(date));
                }
                setCalendarOpen(false);
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
                onSelect={(date) => {
                  if (date) {
                    setEndDate(DateTime.fromJSDate(date));
                  }
                  setEndDateCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? (
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
              variant="destructive"
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
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
    </div>
  );
}

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const itemId = params.id as string;
  const type = searchParams.get("type") || "expense"; // 기본값: expense
  const [bookId, setBookId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        // 카테고리 목록 조회 (지출/수입 모두)
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
  }, [router, type]);

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
          bookId={bookId}
          incomeId={itemId}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : (
        <ExpenseForm
          bookId={bookId}
          expenseId={itemId}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </AppLayout>
  );
}
