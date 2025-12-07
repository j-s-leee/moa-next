"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useExpenses,
  useDeleteExpense,
  type ExpenseItem,
} from "@/lib/react-query/queries";
import { useCategories } from "@/lib/react-query/queries/categories";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

function ExpenseListItem({
  expense,
  bookId,
}: {
  expense: ExpenseItem;
  bookId: string;
}) {
  const deleteExpense = useDeleteExpense();
  const router = useRouter();

  const handleDelete = () => {
    if (!bookId) return;
    deleteExpense.mutate(
      { bookId, expenseId: expense.id },
      {
        onSuccess: () => {
          toast.success("지출이 삭제되었습니다.");
        },
        onError: (error: any) => {
          toast.error(error?.message || "지출 삭제 중 오류가 발생했습니다.");
        },
      }
    );
  };

  const handleEdit = () => {
    router.push(`/book/edit/${expense.id}?type=expense`);
  };

  const expenseDate = expense.date
    ? DateTime.fromISO(expense.date, { zone: "utc" })
    : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground">
            {expenseDate?.toFormat("MM월 dd일") || "날짜 없음"}
          </span>
        </div>
        {expense.description && (
          <p className="text-sm text-muted-foreground mb-1">
            {expense.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          {expense.category?.icon && (
            <span className="text-lg">{expense.category.icon}</span>
          )}
          <span className="font-medium">{expense.category?.name || "기타"}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
            -{expense.amount.toLocaleString()}원
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">더보기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>지출 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 이 지출을 삭제하시겠습니까?
                    <br />
                    이 작업은 되돌릴 수 없습니다.
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function CategoryExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;
  const categoryId = params.categoryId as string;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : DateTime.now().year;
  const monthParam = searchParams.get("month");
  const isYearly = !monthParam; // month 파라미터가 없으면 연간

  // 날짜 범위 계산
  const startDate = isYearly
    ? DateTime.fromObject({ year, month: 1, day: 1 })
    : DateTime.fromObject({ year, month: parseInt(monthParam!), day: 1 });
  const endDate = isYearly
    ? startDate.endOf("year")
    : startDate.endOf("month");

  // 카테고리 정보 조회
  const { data: categoriesData } = useCategories(bookId);
  const category = categoriesData?.categories.find((c) => c.id === categoryId);

  // 지출 데이터 조회
  const { data: expensesData, isLoading } = useExpenses(
    bookId,
    startDate,
    endDate
  );

  // 해당 카테고리의 지출만 필터링
  const categoryExpenses = useMemo(() => {
    if (!expensesData?.expenses) return [];
    return expensesData.expenses.filter((expense) => {
      const expenseCategoryId = expense.category?.id || expense.categoryId;
      return expenseCategoryId === categoryId;
    });
  }, [expensesData, categoryId]);

  // 총 지출 금액 계산
  const totalAmount = useMemo(() => {
    return categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [categoryExpenses]);

  // 날짜별로 그룹화 (연간일 경우 월별로 그룹화)
  const expensesByDate = useMemo(() => {
    if (isYearly) {
      // 연간일 경우 월별로 그룹화
      const grouped = new Map<string, ExpenseItem[]>();
      categoryExpenses.forEach((expense) => {
        if (expense.date) {
          const dateTime = DateTime.fromISO(expense.date, { zone: "utc" });
          const monthKey = dateTime.toFormat("yyyy-MM"); // 월별 키
          if (!grouped.has(monthKey)) {
            grouped.set(monthKey, []);
          }
          grouped.get(monthKey)!.push(expense);
        }
      });
      return grouped;
    } else {
      // 월간일 경우 일별로 그룹화
      const grouped = new Map<string, ExpenseItem[]>();
      categoryExpenses.forEach((expense) => {
        if (expense.date) {
          const dateTime = DateTime.fromISO(expense.date, { zone: "utc" });
          const dateKey = dateTime.toFormat("yyyy-MM-dd");
          if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
          }
          grouped.get(dateKey)!.push(expense);
        }
      });
      return grouped;
    }
  }, [categoryExpenses, isYearly]);

  const sortedDates = Array.from(expensesByDate.keys()).sort((a, b) => {
    return DateTime.fromISO(b).toMillis() - DateTime.fromISO(a).toMillis();
  });

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AppLayout
        title={category?.name || "카테고리 지출"}
        leftAction={
          <Button variant="ghost" size="icon" onClick={handleBack}>
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

  if (!category) {
    return (
      <AppLayout
        title="카테고리 지출"
        leftAction={
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">뒤로가기</span>
          </Button>
        }
      >
        <div className="text-center py-12 text-muted-foreground">
          카테고리를 찾을 수 없습니다.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={category.name}
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
    >
      <div className="space-y-4">
        {/* 카테고리 정보 및 통계 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-4">
            {category.icon && (
              <div className="size-12 rounded-md flex items-center justify-center bg-muted">
                <span className="text-2xl">{category.icon}</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <p className="text-sm text-muted-foreground">
                {year}년 {isYearly ? "" : `${parseInt(monthParam!)}월`}
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">총 지출</p>
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                {totalAmount.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">건수</p>
              <p className="text-xl font-semibold">
                {categoryExpenses.length}건
              </p>
            </div>
          </div>
        </div>

        {/* 지출 목록 */}
        {categoryExpenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            이 기간에 지출 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDates.map((dateKey) => {
              const expenses = expensesByDate.get(dateKey)!;
              const dateTime = DateTime.fromISO(dateKey);
              const periodTotal = expenses.reduce(
                (sum, exp) => sum + exp.amount,
                0
              );

              const displayDate = isYearly
                ? dateTime.toFormat("yyyy년 MM월", { locale: "ko" })
                : dateTime.toFormat("MM월 dd일 (EEE)", { locale: "ko" });

              return (
                <div key={dateKey} className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      {displayDate}
                    </span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      -{periodTotal.toLocaleString()}원
                    </span>
                  </div>
                  {isYearly ? (
                    // 연간일 경우 일별로 다시 그룹화하여 표시
                    (() => {
                      const dailyGrouped = new Map<string, ExpenseItem[]>();
                      expenses.forEach((expense) => {
                        if (expense.date) {
                          const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
                          const dayKey = expenseDate.toFormat("yyyy-MM-dd");
                          if (!dailyGrouped.has(dayKey)) {
                            dailyGrouped.set(dayKey, []);
                          }
                          dailyGrouped.get(dayKey)!.push(expense);
                        }
                      });
                      const sortedDailyKeys = Array.from(dailyGrouped.keys()).sort((a, b) => {
                        return DateTime.fromISO(b).toMillis() - DateTime.fromISO(a).toMillis();
                      });
                      return (
                        <div className="space-y-2 pl-4">
                          {sortedDailyKeys.map((dayKey) => {
                            const dayExpenses = dailyGrouped.get(dayKey)!;
                            const dayDateTime = DateTime.fromISO(dayKey);
                            const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                            return (
                              <div key={dayKey} className="space-y-2">
                                <div className="flex items-center justify-between px-2 py-1">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {dayDateTime.toFormat("dd일 (EEE)", { locale: "ko" })}
                                  </span>
                                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                    -{dayTotal.toLocaleString()}원
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {dayExpenses.map((expense) => (
                                    <ExpenseListItem
                                      key={expense.id}
                                      expense={expense}
                                      bookId={bookId}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-2">
                      {expenses.map((expense) => (
                        <ExpenseListItem
                          key={expense.id}
                          expense={expense}
                          bookId={bookId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

