"use client";

import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DateTime } from "luxon";
import { useExpenses, type ExpenseItem } from "@/lib/react-query/queries/expenses";
import { useIncomes, type IncomeItem } from "@/lib/react-query/queries/incomes";
import { useCategories } from "@/lib/react-query/queries/categories";
import { useBudgets } from "@/lib/react-query/queries/budgets";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { CategorySpendingOverview } from "../category/spending-overview/category-spending-overview";
import { SummaryCard } from "./components/summary-card";
import { MonthSelector } from "./date-selectors/month-selector";
import { YearSelector } from "./date-selectors/year-selector";
import { TrendChartSection } from "./sections/trend-chart-section";
import { BudgetVsExpenseSection } from "./sections/budget-vs-expense-section";
import { BudgetUsageByCategorySection } from "./sections/budget-usage-by-category-section";
import { CategoriesWithoutBudgetSection } from "./sections/categories-without-budget-section";
import { getCategoryColor, calculateDateRange } from "./utils";

export default function Page() {
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
  
  const [selectedMonth, setSelectedMonth] = useState(new Date(initialYear, initialMonth - 1, 1));
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

  const { startDate, endDate } = useMemo(
    () => calculateDateRange(activeTab, year, month),
    [activeTab, year, month]
  );

  // 실제 데이터 가져오기
  const { data: expensesData } = useExpenses(
    bookId,
    null, // startDate
    null, // endDate
    year,
    month
  );
  const { data: incomesData } = useIncomes(bookId, startDate, endDate);
  const { data: categoriesData } = useCategories(bookId);
  const { data: budgetsData } = useBudgets(bookId, activeTab, year, month);

  const expenses = expensesData?.expenses || [];
  const incomes = incomesData?.incomes || [];
  const categories = categoriesData?.categories || [];
  const budgets = budgetsData?.budgets || [];

  // 카테고리별 지출 집계
  const categoryExpensesList = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }>();

    // 카테고리 기본 정보 설정
    categories.forEach((category, index) => {
      if (category.type === "expense") {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          icon: category.icon || "📦",
          color: getCategoryColor(category.name, index),
          amount: 0,
          count: 0,
        });
      }
    });

    // 지출 데이터 집계
    let dynamicIndex = categories.filter(c => c.type === "expense").length;
    expenses.forEach((expense) => {
      // expense.category가 있으면 사용, 없으면 categoryId로 찾기
      const categoryId = expense.category?.id || expense.categoryId;
      const category = categoryMap.get(categoryId);
      
      if (category) {
        category.amount += expense.amount;
        category.count += 1;
      } else {
        // 카테고리가 없는 경우 expense.category 정보 사용 또는 기본 카테고리 생성
        const categoryName = expense.category?.name || "기타";
        const categoryIcon = expense.category?.icon || "📦";
        
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

  // 반복 수입을 해당 기간의 실제 발생 금액으로 계산하는 함수
  const calculateRecurringIncomeAmount = useMemo(() => {
    return (income: IncomeItem, periodStart: DateTime, periodEnd: DateTime): number => {
      if (!income.period || !income.startDate) {
        return 0;
      }

      const startDate = DateTime.fromISO(income.startDate, { zone: "utc" });
      const endDate = income.endDate
        ? DateTime.fromISO(income.endDate, { zone: "utc" })
        : null;

      // 시작일이 기간 종료일 이후이거나, 종료일이 기간 시작일 이전이면 0
      if (startDate > periodEnd || (endDate && endDate < periodStart)) {
        return 0;
      }

      let occurrences = 0;

      if (income.period === "monthly") {
        // 월간 수입: 기간 내의 각 월에 발생
        const startDay = startDate.day;
        let currentMonth = periodStart.startOf("month");
        
        while (currentMonth <= periodEnd) {
          // 해당 월의 발생일 계산 (시작일의 일자 사용)
          const occurrenceDate = DateTime.utc(
            currentMonth.year,
            currentMonth.month,
            Math.min(startDay, currentMonth.endOf("month").day) // 월의 마지막 일을 초과하지 않도록
          );
          
          // 시작일 이후이고 기간 내에 있는지 확인
          if (occurrenceDate >= startDate && occurrenceDate >= periodStart && occurrenceDate <= periodEnd) {
            // 종료일이 있으면 확인
            if (!endDate || occurrenceDate <= endDate) {
              occurrences++;
            }
          }
          
          currentMonth = currentMonth.plus({ months: 1 });
        }
      } else if (income.period === "yearly") {
        // 연간 수입: 기간 내의 각 연도에 발생
        const startMonth = startDate.month;
        const startDay = startDate.day;
        let currentYear = periodStart.year;
        
        while (currentYear <= periodEnd.year) {
          // 해당 연도의 발생일 계산
          const occurrenceDate = DateTime.utc(currentYear, startMonth, startDay);
          
          // 시작일 이후이고 기간 내에 있는지 확인
          if (occurrenceDate >= startDate && occurrenceDate >= periodStart && occurrenceDate <= periodEnd) {
            // 종료일이 있으면 확인
            if (!endDate || occurrenceDate <= endDate) {
              occurrences++;
            }
          }
          
          currentYear++;
        }
      }

      return income.amount * occurrences;
    };
  }, []);

  // 총 수입 계산 (단일 거래 + 반복 수입)
  const totalIncome = useMemo(() => {
    let sum = 0;

    incomes.forEach((income) => {
      if (income.date) {
        // 단일 거래 수입: 기간 내의 date를 가진 수입
        const incomeDate = DateTime.fromISO(income.date, { zone: "utc" });
        if (incomeDate >= startDate && incomeDate <= endDate) {
          sum += income.amount;
        }
      } else if (income.period && income.startDate) {
        // 반복 수입: 해당 기간에 실제 발생한 금액 계산
        sum += calculateRecurringIncomeAmount(income, startDate, endDate);
      }
    });

    return sum;
  }, [incomes, startDate, endDate, calculateRecurringIncomeAmount]);

  // 예정 수입 계산 (반복 수입 중 아직 발생하지 않은 부분)
  const scheduledIncome = useMemo(() => {
    const now = DateTime.now();
    let sum = 0;

    incomes.forEach((income) => {
      if (income.period && income.startDate) {
        // 반복 수입 중 아직 발생하지 않은 부분 계산
        const futureStart = now < startDate ? startDate : now;
        const futureAmount = calculateRecurringIncomeAmount(income, futureStart, endDate);
        sum += futureAmount;
      }
    });

    return sum;
  }, [incomes, startDate, endDate, calculateRecurringIncomeAmount]);

  // 예산 금액 계산
  const budgetAmount = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.amount, 0);
  }, [budgets]);

  // 총 지출 계산
  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (value: string) => {
    const newTab = value as "monthly" | "yearly";
    setActiveTab(newTab);
    
    if (newTab === "monthly") {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      router.push(`/book/${bookId}/summary?year=${year}&month=${month}`);
    } else {
      router.push(`/book/${bookId}/summary?year=${selectedYear}`);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "홈", href: "/home" }]}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
      >
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
            />
          ) : (
            <YearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              bookId={bookId}
            />
          )}
        </div>

        <TabsContent value="monthly">
          <div className="space-y-4">
            {/* 총 수입, 총 지출, 카테고리별 지출 분포 */}
            {/* 모바일: 총 수입/총 지출 2열, md 이상: 3열 */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              <SummaryCard
                title="총 수입"
                amount={totalIncome - scheduledIncome}
                subtitle={`예정: ${scheduledIncome.toLocaleString()}원`}
              />
              <SummaryCard
                title="총 지출"
                amount={totalExpense}
                subtitle={`예산: ${budgetAmount.toLocaleString()}원`}
              />
              <div className="col-span-2 md:col-span-1">
                <CategorySpendingOverview categories={categoryExpensesList.map(cat => ({
                  name: cat.name,
                  spent: cat.amount,
                  color: cat.color,
                }))} />
              </div>
            </div>

            <div className="space-y-4 grid gap-4 md:grid-cols-2">
            {/* 수입/지출 추이 그래프 */}
            <TrendChartSection
              bookId={bookId}
              period="monthly"
              selectedYear={selectedMonth.getFullYear()}
              selectedMonth={selectedMonth}
            />
            
            {/* 예산 대비 지출 현황 */}
            <BudgetVsExpenseSection
              bookId={bookId}
              period="monthly"
            />
            </div>
            
            {/* 예산별 사용량 */}
            <BudgetUsageByCategorySection
              bookId={bookId}
              period="monthly"
              selectedYear={selectedMonth.getFullYear()}
              selectedMonth={selectedMonth}
              />
            
            {/* 예산 미설정 카테고리 */}
            <CategoriesWithoutBudgetSection
              categoryExpensesList={categoryExpensesList}
              bookId={bookId}
              selectedMonth={selectedMonth}
              selectedYear={selectedMonth.getFullYear()}
              activeTab="monthly"
              />
              </div>


        </TabsContent>

        <TabsContent value="yearly">
          <div className="space-y-4">
            {/* 총 수입, 총 지출, 카테고리별 지출 분포 */}
            {/* 모바일: 총 수입/총 지출 2열, md 이상: 3열 */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              <SummaryCard
                title="총 수입"
                amount={totalIncome}
                subtitle={`예정: ${scheduledIncome.toLocaleString()}원`}
              />
              <SummaryCard
                title="총 지출"
                amount={totalExpense}
                subtitle={`예산: ${budgetAmount.toLocaleString()}원`}
              />
              <div className="col-span-2 md:col-span-1">
                <CategorySpendingOverview categories={categoryExpensesList.map(cat => ({
                  name: cat.name,
                  spent: cat.amount,
                  color: cat.color,
                }))} />
              </div>
            </div>
            <div className="space-y-4 grid gap-4 md:grid-cols-2">
            {/* 수입/지출 추이 그래프 */}
            <TrendChartSection
              bookId={bookId}
              period="yearly"
              selectedYear={selectedYear}
              selectedMonth={new Date(selectedYear, 0, 1)}
            />

            {/* 예산 대비 지출 현황 */}
            <BudgetVsExpenseSection
              bookId={bookId}
              period="yearly"
            />
            </div>
            
            {/* 예산별 사용량 */}
            <BudgetUsageByCategorySection
              bookId={bookId}
              period="yearly"
              selectedYear={selectedYear}
              selectedMonth={new Date(selectedYear, 0, 1)}
            />
            
            {/* 예산 미설정 카테고리 */}
            <CategoriesWithoutBudgetSection
              categoryExpensesList={categoryExpensesList}
              bookId={bookId}
              selectedMonth={new Date(selectedYear, 0, 1)}
              selectedYear={selectedYear}
              activeTab="yearly"
            />

          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Link href={`/book/${bookId}/expenses/add`}>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">내역 추가</span>
        </Button>
      </Link>
    </AppLayout>
  );
}

