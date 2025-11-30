import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Budget {
  id: string;
  bookId: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
    expenseType?: "fixed" | "variable" | "annual" | "one-time" | null;
  } | null; // leftJoin으로 인해 null일 수 있음
  period: "monthly" | "yearly";
  amount: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  previousBudgetId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BudgetsResponse {
  budgets: Budget[];
}

// 예산 목록 조회
export function useBudgets(
  bookId: string | null,
  period: "monthly" | "yearly",
  year: number,
  month?: number
) {
  return useQuery({
    queryKey: ["budgets", bookId, period, year, month],
    queryFn: async () => {
      if (!bookId) return { budgets: [] };

      const params = new URLSearchParams({
        period,
        year: year.toString(),
      });
      if (month) {
        params.append("month", month.toString());
      }

      const response = await fetch(`/api/book/${bookId}/budget?${params.toString()}`);

      if (!response.ok) {
        throw new Error("예산 목록 조회에 실패했습니다.");
      }

      const data: BudgetsResponse = await response.json();
      return data;
    },
    enabled: !!bookId,
  });
}

// 예산 추가
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      data,
    }: {
      bookId: string;
      data: {
        categoryId: string;
        amount: number;
        period: "monthly" | "yearly";
        startDate: string; // ISO date string
        endDate: string; // ISO date string
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "예산 추가에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["budgetSuggestions", variables.bookId] });
      
      toast.success("예산이 추가되었습니다.");
    },
    onError: (error) => {
      console.error("예산 추가 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "예산 추가 중 오류가 발생했습니다."
      );
    },
  });
}

// 예산 수정
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      budgetId,
      data,
    }: {
      bookId: string;
      budgetId: string;
      data: {
        amount?: number;
        startDate?: string; // ISO date string
        endDate?: string; // ISO date string
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/budget/${budgetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "예산 수정에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["budgetSuggestions", variables.bookId] });
      
      toast.success("예산이 수정되었습니다.");
    },
    onError: (error) => {
      console.error("예산 수정 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "예산 수정 중 오류가 발생했습니다."
      );
    },
  });
}

// 예산 삭제
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      budgetId,
    }: {
      bookId: string;
      budgetId: string;
    }) => {
      const response = await fetch(`/api/book/${bookId}/budget/${budgetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "예산 삭제에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.bookId] });
      
      toast.success("예산이 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("예산 삭제 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "예산 삭제 중 오류가 발생했습니다."
      );
    },
  });
}

// 예산 제안 조회
export interface BudgetSuggestion {
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
  } | null;
  suggestedAmount: number;
  confidence: "low" | "medium" | "high";
  reason: string;
  isFixedExpense?: boolean;
  stats: {
    totalAmount: number;
    count: number;
    avgAmount: number;
    maxAmount: number;
    minAmount: number;
    variance?: number;
    varianceRatio?: number;
  };
  existingAmount: number | null;
  difference: number | null;
  differencePercent: number | null;
}

interface BudgetSuggestionsResponse {
  suggestions: BudgetSuggestion[];
}

export function useBudgetSuggestions(
  bookId: string | null,
  period: "monthly" | "yearly"
) {
  return useQuery({
    queryKey: ["budgetSuggestions", bookId, period],
    queryFn: async () => {
      if (!bookId) return { suggestions: [] };

      const response = await fetch(
        `/api/book/${bookId}/budget/suggest?period=${period}`
      );

      if (!response.ok) {
        throw new Error("예산 제안 조회에 실패했습니다.");
      }

      const data: BudgetSuggestionsResponse = await response.json();
      return data;
    },
    enabled: !!bookId,
  });
}

