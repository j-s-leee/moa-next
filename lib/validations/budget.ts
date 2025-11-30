import { z } from "zod";

export const budgetSchema = z
  .object({
    categoryId: z.string().min(1, "카테고리를 선택해주세요"),
    amount: z
      .string()
      .min(1, "예산 금액을 입력해주세요")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "0보다 큰 금액을 입력해주세요",
      }),
    period: z.enum(["monthly", "yearly"], {
      required_error: "예산 주기를 선택해주세요",
    }),
    isRecurring: z.boolean(),
    startDate: z.date().optional(),
    specificDate: z.date().optional(), // 비반복 예산용
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return !!data.startDate;
      }
      return true;
    },
    {
      message: "시작일을 선택해주세요",
      path: ["startDate"],
    }
  )
  .refine(
    (data) => {
      if (!data.isRecurring) {
        return !!data.specificDate;
      }
      return true;
    },
    {
      message: "기간을 선택해주세요",
      path: ["specificDate"],
    }
  );

export type BudgetFormData = z.infer<typeof budgetSchema>;

