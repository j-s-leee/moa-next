import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DateTime } from "luxon";

export interface IncomeItem {
  id: string;
  bookId: string;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: "expense" | "income";
  } | null;
  amount: number;
  date: string | null;
  period: "monthly" | "yearly" | null;
  source: string | null;
  incomeType: "actual" | "transfer";
  transferredFromBookId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IncomesResponse {
  incomes: IncomeItem[];
}

// 수입 목록 조회
export function useIncomes(
  bookId: string | null,
  startDate: DateTime,
  endDate: DateTime
) {
  return useQuery({
    queryKey: ["incomes", bookId, startDate.toISODate(), endDate.toISODate()],
    queryFn: async () => {
      if (!bookId) return { incomes: [] };

      const response = await fetch(
        `/api/book/${bookId}/income?startDate=${startDate.toISODate()}&endDate=${endDate.toISODate()}`
      );

      if (!response.ok) {
        throw new Error("수입 목록 조회에 실패했습니다.");
      }

      const data: IncomesResponse = await response.json();
      return data;
    },
    enabled: !!bookId,
  });
}

// 단일 수입 조회
export function useIncome(bookId: string | null, incomeId: string | null) {
  return useQuery({
    queryKey: ["income", bookId, incomeId],
    queryFn: async () => {
      if (!bookId || !incomeId) return null;

      const response = await fetch(`/api/book/${bookId}/income/${incomeId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("수입을 찾을 수 없습니다.");
        }
        throw new Error("수입 조회에 실패했습니다.");
      }

      const data = await response.json();
      return data as IncomeItem;
    },
    enabled: !!bookId && !!incomeId,
  });
}

// 수입 추가
export function useCreateIncome() {
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
        date?: string | null;
        period?: "monthly" | "yearly" | null;
        startDate?: string | null;
        endDate?: string | null;
        incomeType?: "actual" | "transfer";
        source?: string | null;
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/income`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "수입 추가에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["incomes", variables.bookId] });
      
      toast.success("수입이 추가되었습니다.");
    },
    onError: (error) => {
      console.error("수입 추가 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "수입 추가 중 오류가 발생했습니다."
      );
    },
  });
}

// 수입 수정
export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      incomeId,
      data,
    }: {
      bookId: string;
      incomeId: string;
      data: {
        categoryId?: string;
        amount?: number;
        period?: "monthly" | "yearly" | null;
        source?: string | null;
        incomeType?: "actual" | "transfer";
        startDate?: string | null;
        endDate?: string | null;
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/income/${incomeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "수입 수정에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["incomes", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["income", variables.bookId, variables.incomeId] });
      
      toast.success("수입이 수정되었습니다.");
    },
    onError: (error) => {
      console.error("수입 수정 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "수입 수정 중 오류가 발생했습니다."
      );
    },
  });
}

// 수입 삭제
export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      incomeId,
    }: {
      bookId: string;
      incomeId: string;
    }) => {
      const response = await fetch(`/api/book/${bookId}/income/${incomeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "수입 삭제에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["incomes", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["income", variables.bookId, variables.incomeId] });
      
      toast.success("수입이 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("수입 삭제 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "수입 삭제 중 오류가 발생했습니다."
      );
    },
  });
}

