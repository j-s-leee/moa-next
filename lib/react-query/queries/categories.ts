import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

interface CategoriesResponse {
  categories: Category[];
}

// 카테고리 목록 조회
export function useCategories(bookId: string | null) {
  return useQuery({
    queryKey: ["categories", bookId],
    queryFn: async () => {
      if (!bookId) return { categories: [] };

      const response = await fetch(`/api/book/${bookId}/category`);

      if (!response.ok) {
        throw new Error("카테고리 목록 조회에 실패했습니다.");
      }

      const data: CategoriesResponse = await response.json();
      return data;
    },
    enabled: !!bookId,
  });
}

// 카테고리 추가
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      data,
    }: {
      bookId: string;
      data: {
        name: string;
        icon: string | null;
        type: "expense" | "income";
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name.trim(),
          icon: data.icon,
          type: data.type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "카테고리 생성 실패");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["categories", variables.bookId] });
      
      toast.success("카테고리가 생성되었습니다.");
    },
    onError: (error) => {
      console.error("카테고리 생성 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "카테고리 생성 중 오류가 발생했습니다."
      );
    },
  });
}

// 카테고리 수정
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      categoryId,
      data,
    }: {
      bookId: string;
      categoryId: string;
      data: {
        name?: string;
        icon?: string | null;
        type?: "expense" | "income";
        expenseType?: "fixed" | "variable" | "annual" | "one-time" | null;
      };
    }) => {
      const response = await fetch(`/api/book/${bookId}/category/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "카테고리 수정에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["categories", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.bookId, variables.categoryId] });
      
      toast.success("카테고리가 수정되었습니다.");
    },
    onError: (error) => {
      console.error("카테고리 수정 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "카테고리 수정 중 오류가 발생했습니다."
      );
    },
  });
}

// 카테고리 삭제
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      categoryId,
    }: {
      bookId: string;
      categoryId: string;
    }) => {
      const response = await fetch(`/api/book/${bookId}/category/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "카테고리 삭제에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["categories", variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.bookId, variables.categoryId] });
      
      toast.success("카테고리가 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("카테고리 삭제 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "카테고리 삭제 중 오류가 발생했습니다."
      );
    },
  });
}

// 단일 카테고리 조회
export function useCategory(bookId: string | null, categoryId: string | null) {
  return useQuery({
    queryKey: ["category", bookId, categoryId],
    queryFn: async () => {
      if (!bookId || !categoryId) return null;

      const response = await fetch(`/api/book/${bookId}/category/${categoryId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("카테고리를 찾을 수 없습니다.");
        }
        throw new Error("카테고리 조회에 실패했습니다.");
      }

      const data = await response.json();
      return data as Category;
    },
    enabled: !!bookId && !!categoryId,
  });
}

// 카테고리 순서 변경
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      categoryIds,
    }: {
      bookId: string;
      categoryIds: string[];
    }) => {
      const response = await fetch(`/api/book/${bookId}/category/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "카테고리 순서 변경에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["categories", variables.bookId] });
      
      toast.success("카테고리 순서가 변경되었습니다.");
    },
    onError: (error) => {
      console.error("카테고리 순서 변경 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "카테고리 순서 변경 중 오류가 발생했습니다."
      );
    },
  });
}

