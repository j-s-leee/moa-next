"use client";

import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useExpenses } from "@/lib/react-query/queries/expenses";
import { useCategories } from "@/lib/react-query/queries/categories";
import { CategorySpendingOverview } from "../category/spending-overview/category-spending-overview";
import { CategoryExpensesSection } from "./sections/category-expenses-section";
import { MonthSelector } from "../summary/date-selectors/month-selector";
import { YearSelector } from "../summary/date-selectors/year-selector";
import { getCategoryColor } from "../summary/utils";

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;

  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");

  // URL 쿼리 파라미터에서 year, month 가져오기
  const urlYear = searchParams.get("year");
  const urlMonth = searchParams.get("month");

  // 초기 날짜 설정
  const now = new Date();
  const initialYear = urlYear ? parseInt(urlYear, 10) : now.getFullYear();
  const initialMonth = urlMonth ? parseInt(urlMonth, 10) : now.getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(
    new Date(initialYear, initialMonth - 1, 1)
  );
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // URL 파라미터 변경 시 상태 업데이트
  useEffect(() => {
    if (urlYear) {
      const year = parseInt(urlYear, 10);
      setSelectedYear(year);
      if (urlMonth) {
        const month = parseInt(urlMonth, 10);
        setSelectedMonth(new Date(year, month - 1, 1));
        setActiveTab("monthly");
      } else {
        setActiveTab("yearly");
      }
    }
  }, [urlYear, urlMonth]);

  // 날짜 범위 계산
  const year = activeTab === "monthly" ? selectedMonth.getFullYear() : selectedYear;
  const month = activeTab === "monthly" ? selectedMonth.getMonth() + 1 : undefined;

  // 데이터 조회
  const { data: expensesData, isLoading: isLoadingExpenses } = useExpenses(
    bookId,
    null,
    null,
    year,
    month
  );
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories(bookId);

  const expenses = expensesData?.expenses || [];
  const categories = categoriesData?.categories || [];

  // 카테고리별 지출 집계
  const categoryExpensesList = useMemo(() => {
    const categoryMap = new Map<
      string,
      { id: string; name: string; icon: string | null; color: string; amount: number; count: number }
    >();

    // 카테고리 기본 정보 설정
    categories.forEach((category, index) => {
      if (category.type === "expense") {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: getCategoryColor(category.name, index),
          amount: 0,
          count: 0,
        });
      }
    });

    // 지출 데이터 집계
    let dynamicIndex = categories.filter((c) => c.type === "expense").length;
    expenses.forEach((expense) => {
      const categoryId = expense.category?.id || expense.categoryId;
      const category = categoryMap.get(categoryId);

      if (category) {
        category.amount += expense.amount;
        category.count += 1;
      } else {
        // 카테고리가 없는 경우 expense.category 정보 사용 또는 기본 카테고리 생성
        const categoryName = expense.category?.name || "기타";
        const categoryIcon = expense.category?.icon || null;

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            icon: categoryIcon,
            color: getCategoryColor(categoryName, dynamicIndex),
            amount: 0,
            count: 0,
          });
          dynamicIndex++;
        }
        const newCategory = categoryMap.get(categoryId)!;
        newCategory.amount += expense.amount;
        newCategory.count += 1;
      }
    });

    const sortedCategories = Array.from(categoryMap.values())
      .filter((cat) => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // 정렬 후 색상 재할당 (금액 순으로 정렬된 순서에 맞춰)
    return sortedCategories.map((cat, index) => ({
      ...cat,
      color: getCategoryColor(cat.name, index),
    }));
  }, [expenses, categories]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (value: string) => {
    const newTab = value as "monthly" | "yearly";
    setActiveTab(newTab);

    if (newTab === "monthly") {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      router.push(`/book/${bookId}/categories?year=${year}&month=${month}`);
    } else {
      router.push(`/book/${bookId}/categories?year=${selectedYear}`);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/book/${bookId}`);
    }
  };

  const isLoading = isLoadingExpenses || isLoadingCategories;

  return (
    <AppLayout
      title="카테고리별 지출"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="monthly">월간</TabsTrigger>
            <TabsTrigger value="yearly">연간</TabsTrigger>
          </TabsList>
          {activeTab === "monthly" ? (
            <MonthSelector
              selectedDate={selectedMonth}
              onDateChange={setSelectedMonth}
              bookId={bookId}
              basePath="categories"
            />
          ) : (
            <YearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              bookId={bookId}
              basePath="categories"
            />
          )}
        </div>

        <TabsContent value="monthly">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 카테고리별 지출 분포 */}
              <CategorySpendingOverview
                categories={categoryExpensesList.map((cat) => ({
                  name: cat.name,
                  spent: cat.amount,
                  color: cat.color,
                }))}
              />

              {/* 카테고리별 지출 목록 */}
              <CategoryExpensesSection
                categoryExpensesList={categoryExpensesList}
                bookId={bookId}
                period="monthly"
                selectedYear={selectedMonth.getFullYear()}
                selectedMonth={selectedMonth}
                expenses={expenses}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="yearly">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 카테고리별 지출 분포 */}
              <CategorySpendingOverview
                categories={categoryExpensesList.map((cat) => ({
                  name: cat.name,
                  spent: cat.amount,
                  color: cat.color,
                }))}
              />

              {/* 카테고리별 지출 목록 */}
              <CategoryExpensesSection
                categoryExpensesList={categoryExpensesList}
                bookId={bookId}
                period="yearly"
                selectedYear={selectedYear}
                selectedMonth={new Date(selectedYear, 0, 1)}
                expenses={expenses}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

