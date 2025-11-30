import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBookStore } from "@/lib/stores/book-store";

interface Book {
  id: string;
  name: string;
  type: "personal" | "shared";
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface BooksResponse {
  books: Book[];
}

// 가계부 목록 조회
export function useBooks() {
  const { setBooks, setCurrentBookId } = useBookStore();

  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const response = await fetch("/api/book");
      if (!response.ok) {
        throw new Error("가계부 목록 조회에 실패했습니다.");
      }
      const data: BooksResponse = await response.json();
      
      // Zustand store에 저장
      setBooks(data.books || []);
      
      // 첫 번째 개인 가계부를 기본값으로 설정
      const personalBook = data.books?.find((book) => book.type === "personal");
      if (personalBook) {
        setCurrentBookId(personalBook.id);
      }
      
      return data;
    },
  });
}

// 특정 가계부 조회
export function useBook(bookId: string | null) {
  return useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      if (!bookId) return null;
      
      const response = await fetch(`/api/book/${bookId}`);
      if (!response.ok) {
        throw new Error("가계부 조회에 실패했습니다.");
      }
      const data = await response.json();
      return data.book;
    },
    enabled: !!bookId,
  });
}

