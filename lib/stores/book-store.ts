import { create } from "zustand";

interface Book {
  id: string;
  name: string;
  type: "personal" | "shared";
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface BookStore {
  books: Book[];
  currentBookId: string | null;
  setBooks: (books: Book[]) => void;
  setCurrentBookId: (bookId: string | null) => void;
  getCurrentBook: () => Book | undefined;
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  currentBookId: null,
  setBooks: (books) => set({ books }),
  setCurrentBookId: (bookId) => set({ currentBookId: bookId }),
  getCurrentBook: () => {
    const { books, currentBookId } = get();
    return books.find((book) => book.id === currentBookId);
  },
}));

