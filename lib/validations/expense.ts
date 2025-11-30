import { z } from "zod";

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
  amount: z
    .string()
    .min(1, "금액을 입력해주세요")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "0보다 큰 금액을 입력해주세요",
    }),
  date: z.date({
    required_error: "날짜를 선택해주세요",
  }),
  memo: z.string().max(200, "메모는 200자 이내로 입력해주세요").optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
