import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DateTime } from "luxon";

export interface ExpenseItem {
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

interface ExpensesResponse {
  expenses: ExpenseItem[];
}

// 지출 목록 조회
export function useExpenses(
  bookId: string | null,
  startDate: DateTime,
  endDate: DateTime
) {
  return useQuery({
    queryKey: ["expenses", bookId, startDate.toISODate(), endDate.toISODate()],
    queryFn: async () => {
      if (!bookId) return { expenses: [] };

      const response = await fetch(
        `/api/book/${bookId}/expense?startDate=${startDate.toISODate()}&endDate=${endDate.toISODate()}`
      );

      if (!response.ok) {
        throw new Error("지출 목록 조회에 실패했습니다.");
      }

      const data: ExpensesResponse = await response.json();
      return data;
    },
    enabled: !!bookId,
  });
}

// 단일 지출 조회
export function useExpense(bookId: string | null, expenseId: string | null) {
  return useQuery({
    queryKey: ["expense", bookId, expenseId],
    queryFn: async () => {
      if (!bookId || !expenseId) return null;

      const response = await fetch(`/api/book/${bookId}/expense/${expenseId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("지출을 찾을 수 없습니다.");
        }
        throw new Error("지출 조회에 실패했습니다.");
      }

      const data = await response.json();
      return data as ExpenseItem;
    },
    enabled: !!bookId && !!expenseId,
  });
}

// 지출 추가
export function useCreateExpense() {
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
        date: string;
        memo?: string | null;
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/expense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "지출 추가에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.bookId] });
      
      toast.success("지출이 추가되었습니다.");
    },
    onError: (error) => {
      console.error("지출 추가 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "지출 추가 중 오류가 발생했습니다."
      );
    },
  });
}

// 지출 수정
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      expenseId,
      data,
    }: {
      bookId: string;
      expenseId: string;
      data: {
        categoryId?: string;
        amount?: number;
        date?: string;
        memo?: string | null;
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/expense/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "지출 수정에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["expense", variables.bookId, variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.bookId] });
      
      toast.success("지출이 수정되었습니다.");
    },
    onError: (error) => {
      console.error("지출 수정 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "지출 수정 중 오류가 발생했습니다."
      );
    },
  });
}

// 지출 삭제
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      expenseId,
    }: {
      bookId: string;
      expenseId: string;
    }) => {
      const response = await fetch(`/api/book/${bookId}/expense/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "지출 삭제에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["expenses", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["expense", variables.bookId, variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.bookId] });
      
      toast.success("지출이 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("지출 삭제 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "지출 삭제 중 오류가 발생했습니다."
      );
    },
  });
}

