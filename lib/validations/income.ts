import { z } from "zod";

// 통합 스키마 (모든 필드를 포함하되 조건부 검증)
export const incomeSchema = z
  .object({
    incomeType: z.enum(["single", "recurring"]),
    categoryId: z.string().min(1, "카테고리를 선택해주세요"),
    amount: z
      .string()
      .min(1, "금액을 입력해주세요")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "0보다 큰 금액을 입력해주세요",
      }),
    // 단일 거래용 필드
    date: z.date().optional(),
    // 반복 수입용 필드
    period: z.enum(["monthly", "yearly"]).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional().nullable(),
    // 공통 필드
    source: z.string().max(100, "출처는 100자 이내로 입력해주세요").optional(),
  })
  .refine(
    (data) => {
      if (data.incomeType === "single") {
        return !!data.date;
      }
      return true;
    },
    {
      message: "날짜를 선택해주세요",
      path: ["date"],
    }
  )
  .refine(
    (data) => {
      if (data.incomeType === "recurring") {
        return !!data.period && !!data.startDate;
      }
      return true;
    },
    {
      message: "기간과 시작 날짜를 선택해주세요",
      path: ["period"],
    }
  );

export type IncomeFormData = z.infer<typeof incomeSchema>;

