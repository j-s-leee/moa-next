import { DateTime } from "luxon";
import type { Budget, ExpenseItem } from "@/lib/react-query/queries/expenses";

/**
 * 카테고리별 색상 매핑 함수 (CSS 변수 사용)
 */
export function getCategoryColor(categoryName: string, index: number = 0): string {
  const chartColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  
  const colorIndex = index % chartColors.length;
  return chartColors[colorIndex];
}

/**
 * 기간별 날짜 범위 계산
 */
export function calculateDateRange(
  period: "monthly" | "yearly",
  year: number,
  month?: number
): { startDate: DateTime; endDate: DateTime } {
  if (period === "monthly" && month) {
    const startDate = DateTime.fromObject({ year, month, day: 1 });
    return {
      startDate,
      endDate: startDate.endOf("month"),
    };
  } else {
    const startDate = DateTime.fromObject({ year, month: 1, day: 1 });
    return {
      startDate,
      endDate: startDate.endOf("year"),
    };
  }
}

/**
 * 예산별 사용량 계산 함수
 */
export function calculateBudgetUsage(
  budget: Budget,
  expenses: ExpenseItem[],
  period: "monthly" | "yearly",
  year: number,
  month?: number
): { spent: number; percentage: number; remaining: number } {
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
    
    if (period === "monthly" && month) {
      return expenseDate.year === year && expenseDate.month === month;
    } else {
      return expenseDate.year === year;
    }
  });

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

  return {
    spent,
    percentage: Math.min(percentage, 100),
    remaining: Math.max(0, budget.amount - spent),
  };
}

/**
 * 연간 예산의 누적 사용량 계산 (해당 연도의 1월부터 현재까지)
 */
export function calculateYearlyBudgetCumulativeUsage(
  budget: Budget,
  expenses: ExpenseItem[],
  year: number,
  currentMonth?: number
): { spent: number; percentage: number; remaining: number } {
  const now = DateTime.now();
  const targetYear = year;
  const endMonth = currentMonth || now.month;
  
  const budgetExpenses = expenses.filter((expense) => {
    if (expense.categoryId !== budget.categoryId) return false;
    const expenseDate = DateTime.fromISO(expense.date, { zone: "utc" });
    return expenseDate.year === targetYear && expenseDate.month <= endMonth;
  });

  const spent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

  return {
    spent,
    percentage: Math.min(percentage, 100),
    remaining: Math.max(0, budget.amount - spent),
  };
}

