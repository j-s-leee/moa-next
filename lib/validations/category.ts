import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "카테고리 이름을 입력해주세요")
    .max(20, "카테고리 이름은 20자 이내로 입력해주세요"),
  icon: z.string().optional().nullable(),
  type: z.enum(["expense", "income"], {
    required_error: "카테고리 유형을 선택해주세요",
  }),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

