import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .max(50, "이름은 50자 이내로 입력해주세요")
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .url("올바른 URL 형식을 입력해주세요")
    .optional()
    .nullable(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

