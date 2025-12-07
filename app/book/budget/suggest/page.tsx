"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBooks, useBudgetSuggestions, useCreateBudget, useUpdateBudget, useUpdateCategory, useBudgets } from "@/lib/react-query/queries";
import { useBookStore } from "@/lib/stores/book-store";
import { DateTime } from "luxon";

import type { BudgetSuggestion } from "@/lib/react-query/queries/budgets";

export default function BudgetSuggestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") || "monthly") as
    | "monthly"
    | "yearly";

  const { currentBookId, setCurrentBookId } = useBookStore();
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());

  // 가계부 목록 조회
  const { data: booksData } = useBooks();
  
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
        router.push(`/book/${currentBookId || booksData?.books[0]?.id || ""}/budgets`);
      }
    }
  }, [booksData, currentBookId, setCurrentBookId, router]);

  // 예산 제안 조회
  const { data: suggestionsData, isLoading } = useBudgetSuggestions(currentBookId, period);
  const suggestions = suggestionsData?.suggestions || [];
  
  // 현재 년/월 계산
  const now = DateTime.now();
  const year = now.year;
  const month = period === "monthly" ? now.month : undefined;

  // 예산 목록 조회 (기존 예산 찾기용)
  const { data: budgetsData } = useBudgets(currentBookId, period, year, month);
  const budgets = budgetsData?.budgets || [];

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const updateCategory = useUpdateCategory();

  const handleAccept = async (suggestion: BudgetSuggestion) => {
    if (!currentBookId) return;

    setAcceptingIds((prev) => new Set(prev).add(suggestion.categoryId!));

    try {
      // 날짜 계산
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (period === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date("2099-12-31T23:59:59.999Z");
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date("2099-12-31T23:59:59.999Z");
      }

      // 기존 예산이 있으면 수정, 없으면 생성
      if (suggestion.existingAmount !== null) {
        const existingBudget = budgets.find(
          (b) => b.categoryId === suggestion.categoryId
        );

        if (existingBudget) {
          // 예산 수정
          updateBudget.mutate(
            {
              bookId: currentBookId,
              budgetId: existingBudget.id,
              data: {
                amount: suggestion.suggestedAmount,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              },
            },
            {
              onSuccess: () => {
                // 고정지출로 판별된 경우 카테고리의 expenseType을 "fixed"로 업데이트
                if (suggestion.isFixedExpense) {
                  updateCategory.mutate(
                    {
                      bookId: currentBookId,
                      categoryId: suggestion.categoryId,
                      data: {
                        expenseType: "fixed",
                      } as any, // 타입 확장 필요
                    },
                    {
                      onError: (error) => {
                        console.warn("카테고리 타입 업데이트 오류 (무시됨):", error);
                      },
                    }
                  );
                }
                setAcceptingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(suggestion.categoryId!);
                  return next;
                });
              },
              onError: () => {
                setAcceptingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(suggestion.categoryId!);
                  return next;
                });
              },
            }
          );
        }
      } else {
        // 예산 생성
        createBudget.mutate(
          {
            bookId: currentBookId,
            data: {
              categoryId: suggestion.categoryId,
              period,
              amount: suggestion.suggestedAmount,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          },
          {
            onSuccess: () => {
              // 고정지출로 판별된 경우 카테고리의 expenseType을 "fixed"로 업데이트
              if (suggestion.isFixedExpense) {
                updateCategory.mutate(
                  {
                    bookId: currentBookId,
                    categoryId: suggestion.categoryId,
                    data: {
                      expenseType: "fixed",
                    },
                  },
                  {
                    onError: (error) => {
                      console.warn("카테고리 타입 업데이트 오류 (무시됨):", error);
                    },
                  }
                );
              }
              setAcceptingIds((prev) => {
                const next = new Set(prev);
                next.delete(suggestion.categoryId!);
                return next;
              });
            },
            onError: () => {
              setAcceptingIds((prev) => {
                const next = new Set(prev);
                next.delete(suggestion.categoryId!);
                return next;
              });
            },
          }
        );
      }
    } catch (error) {
      console.error("예산 적용 오류:", error);
      toast.error("예산 적용에 실패했습니다.");
      setAcceptingIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.categoryId!);
        return next;
      });
    }
  };

  const handleReject = (suggestion: BudgetSuggestion) => {
    toast.info(`${suggestion.category?.name} 제안을 거부했습니다.`);
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-green-500">높음</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">보통</Badge>;
      case "low":
        return <Badge variant="outline">낮음</Badge>;
      default:
        return null;
    }
  };

  const IconComponent = (icon: string | null) => {
    if (!icon) return null;
    return (
      (LucideIcons[icon as keyof typeof LucideIcons] as React.ComponentType<{
        className?: string;
      }>) || null
    );
  };

  return (
    <AppLayout
      title="예산 제안"
      leftAction={
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
    >
      <Tabs
        value={period}
        onValueChange={(v) => router.push(`/book/${currentBookId || booksData?.books[0]?.id || ""}/budgets/suggest?period=${v}`)}
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="monthly">월간</TabsTrigger>
            <TabsTrigger value="yearly">연간</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={period}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                제안할 예산이 없습니다.
                <br />
                지출 데이터를 더 기록하면 예산 제안을 받을 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.category?.icon
                  ? IconComponent(suggestion.category.icon)
                  : null;

                return (
                  <Card key={suggestion.categoryId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {Icon ? (
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <span>{suggestion.category?.icon || "📦"}</span>
                          )}
                          <CardTitle>{suggestion.category?.name}</CardTitle>
                          {getConfidenceBadge(suggestion.confidence)}
                        </div>
                      </div>
                      <CardDescription>
                        {suggestion.reason}
                        {suggestion.isFixedExpense && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            고정지출
                          </Badge>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            제안 금액
                          </span>
                          <span className="text-lg font-semibold">
                            {suggestion.suggestedAmount.toLocaleString()}원
                          </span>
                        </div>

                        {suggestion.existingAmount !== null && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                기존 예산
                              </span>
                              <span className="text-sm">
                                {suggestion.existingAmount.toLocaleString()}원
                              </span>
                            </div>
                            {suggestion.difference !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  차이
                                </span>
                                <div className="flex items-center gap-2">
                                  {suggestion.difference > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      suggestion.difference > 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {suggestion.difference > 0 ? "+" : ""}
                                    {suggestion.difference.toLocaleString()}원
                                    {suggestion.differencePercent !== null &&
                                      ` (${
                                        suggestion.differencePercent > 0
                                          ? "+"
                                          : ""
                                      }${suggestion.differencePercent}%)`}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              평균 지출
                            </div>
                            <div className="text-sm font-medium">
                              {Math.round(
                                suggestion.stats.avgAmount
                              ).toLocaleString()}
                              원
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              지출 횟수
                            </div>
                            <div className="text-sm font-medium">
                              {suggestion.stats.count}회
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleAccept(suggestion)}
                            disabled={acceptingIds.has(suggestion.categoryId!)}
                          >
                            {acceptingIds.has(suggestion.categoryId!) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                적용 중...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                적용
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(suggestion)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
