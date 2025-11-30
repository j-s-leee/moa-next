# React Hook Form + Zod 도입 가이드

## 개요

이 문서는 프로젝트에 React Hook Form, @hookform/resolvers, Zod를 도입하여 폼 관리를 개선하는 방법을 설명합니다.

---

## 왜 도입하는가?

### 현재 문제점

1. **폼 상태 수동 관리**: `useState`로 각 필드를 개별 관리
2. **검증 로직 반복**: 각 컴포넌트마다 유사한 검증 코드 작성
3. **에러 메시지 불일관**: 에러 처리 방식이 통일되지 않음
4. **성능 이슈**: 폼 필드 변경 시 불필요한 리렌더링

### 도입 효과

- ✅ 폼 코드 50-70% 감소
- ✅ 타입 안전한 검증 (Zod 스키마)
- ✅ 자동 에러 메시지 표시
- ✅ 성능 최적화 (리렌더링 최소화)
- ✅ shadcn/ui와 완벽 호환

---

## 설치

```bash
npm install react-hook-form @hookform/resolvers
```

> **참고**: `zod`는 이미 프로젝트에 설치되어 있습니다.

---

## 기본 사용법

### 1. Zod 스키마 정의

`lib/validations/` 폴더에 스키마를 정의합니다.

```typescript
// lib/validations/expense.ts
import { z } from "zod";

export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, "금액을 입력해주세요")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "유효한 금액을 입력해주세요",
    }),
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
  date: z.date({
    required_error: "날짜를 선택해주세요",
  }),
  memo: z.string().optional(),
});

// 타입 추출
export type ExpenseFormData = z.infer<typeof expenseSchema>;
```

### 2. useForm 훅 사용

```typescript
// app/book/add/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseFormData } from "@/lib/validations/expense";

export default function AddExpensePage() {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: "",
      categoryId: "",
      date: new Date(),
      memo: "",
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    // data는 이미 검증됨!
    console.log(data);
    
    try {
      const response = await fetch("/api/book/[bookId]/expense", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          amount: Number(data.amount),
        }),
      });
      
      if (!response.ok) throw new Error("저장 실패");
      
      toast.success("저장되었습니다");
    } catch (error) {
      toast.error("저장에 실패했습니다");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* 폼 필드들 */}
    </form>
  );
}
```

---

## shadcn/ui와 통합

### Form 컴포넌트 추가

shadcn의 Form 컴포넌트를 사용하면 더 깔끔하게 작성할 수 있습니다.

```bash
npx shadcn@latest add form
```

### 사용 예시

```typescript
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddExpensePage() {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: "",
      categoryId: "",
      date: new Date(),
      memo: "",
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    // 저장 로직
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 금액 필드 */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>금액</FormLabel>
              <FormControl>
                <Input
                  placeholder="0"
                  type="number"
                  inputMode="numeric"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 카테고리 필드 */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <FormControl>
                <CategorySelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 메모 필드 */}
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모 (선택)</FormLabel>
              <FormControl>
                <Input placeholder="메모를 입력하세요" {...field} />
              </FormControl>
              <FormDescription>
                지출에 대한 추가 설명을 입력할 수 있습니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 스키마 예시

### 지출 스키마

```typescript
// lib/validations/expense.ts
import { z } from "zod";

export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, "금액을 입력해주세요")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "0보다 큰 금액을 입력해주세요",
    }),
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
  date: z.date({
    required_error: "날짜를 선택해주세요",
  }),
  memo: z.string().max(200, "메모는 200자 이내로 입력해주세요").optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
```

### 수입 스키마

```typescript
// lib/validations/income.ts
import { z } from "zod";

export const incomeSchema = z.object({
  amount: z
    .string()
    .min(1, "금액을 입력해주세요")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "0보다 큰 금액을 입력해주세요",
    }),
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
  date: z.date({
    required_error: "날짜를 선택해주세요",
  }),
  incomeType: z.enum(["regular", "bonus", "side", "investment", "other"], {
    required_error: "수입 유형을 선택해주세요",
  }),
  memo: z.string().max(200, "메모는 200자 이내로 입력해주세요").optional(),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;
```

### 예산 스키마

```typescript
// lib/validations/budget.ts
import { z } from "zod";

export const budgetSchema = z.object({
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
  startMonth: z.date({
    required_error: "시작월을 선택해주세요",
  }),
  endMonth: z.date().optional(),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
```

### 카테고리 스키마

```typescript
// lib/validations/category.ts
import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "카테고리 이름을 입력해주세요")
    .max(20, "카테고리 이름은 20자 이내로 입력해주세요"),
  icon: z.string().optional(),
  type: z.enum(["expense", "income"], {
    required_error: "카테고리 유형을 선택해주세요",
  }),
  expenseType: z
    .enum(["fixed", "variable", "annual", "one-time"])
    .optional()
    .nullable(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
```

### 사용자 프로필 스키마

```typescript
// lib/validations/profile.ts
import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(50, "이름은 50자 이내로 입력해주세요"),
  email: z.string().email("올바른 이메일 형식을 입력해주세요").optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

---

## 고급 사용법

### 조건부 검증

```typescript
// 지출 타입에 따라 검증 조건이 달라지는 경우
const expenseSchemaWithType = z
  .object({
    categoryId: z.string().min(1, "카테고리를 선택해주세요"),
    amount: z.string().min(1, "금액을 입력해주세요"),
    expenseType: z.enum(["fixed", "variable", "annual", "one-time"]),
    installmentMonths: z.string().optional(),
  })
  .refine(
    (data) => {
      // 연간 예산 타입인 경우 할부 개월수 필수
      if (data.expenseType === "annual") {
        return data.installmentMonths && Number(data.installmentMonths) > 0;
      }
      return true;
    },
    {
      message: "연간 예산 지출은 할부 개월수를 입력해야 합니다",
      path: ["installmentMonths"],
    }
  );
```

### 서버 에러 처리

```typescript
const onSubmit = async (data: ExpenseFormData) => {
  try {
    const response = await fetch("/api/expense", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // 특정 필드에 서버 에러 설정
      if (error.field) {
        form.setError(error.field, {
          type: "server",
          message: error.message,
        });
        return;
      }
      
      // 전역 에러
      form.setError("root", {
        type: "server",
        message: error.message || "저장에 실패했습니다",
      });
      return;
    }

    toast.success("저장되었습니다");
    router.push("/book");
  } catch (error) {
    form.setError("root", {
      type: "server",
      message: "네트워크 오류가 발생했습니다",
    });
  }
};

// 전역 에러 표시
{form.formState.errors.root && (
  <div className="text-destructive text-sm">
    {form.formState.errors.root.message}
  </div>
)}
```

### 폼 초기화

```typescript
// 특정 필드만 초기화
form.resetField("amount");

// 전체 초기화
form.reset();

// 새로운 기본값으로 초기화
form.reset({
  amount: "",
  categoryId: "",
  date: new Date(),
});
```

### Watch로 필드 값 감시

```typescript
// 특정 필드 감시
const amount = form.watch("amount");

// 여러 필드 감시
const [amount, categoryId] = form.watch(["amount", "categoryId"]);

// 전체 폼 값 감시
const formValues = form.watch();

// 콜백으로 감시 (성능 최적화)
useEffect(() => {
  const subscription = form.watch((value, { name, type }) => {
    console.log(value, name, type);
  });
  return () => subscription.unsubscribe();
}, [form.watch]);
```

### 제어 컴포넌트와 통합

커스텀 컴포넌트(Drawer, Calendar 등)와 통합할 때:

```typescript
<FormField
  control={form.control}
  name="date"
  render={({ field }) => (
    <FormItem>
      <FormLabel>날짜</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" className={cn("w-full justify-start")}>
              {field.value ? format(field.value, "PPP") : "날짜 선택"}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 마이그레이션 체크리스트

기존 폼 컴포넌트를 마이그레이션할 때 다음 순서로 진행하세요:

### 1단계: 스키마 정의
- [ ] `lib/validations/` 폴더 생성
- [ ] 필요한 스키마 파일 생성 (expense.ts, income.ts, budget.ts, category.ts)
- [ ] 각 스키마에서 타입 추출 (`z.infer`)

### 2단계: shadcn Form 컴포넌트 추가
- [ ] `npx shadcn@latest add form` 실행

### 3단계: 컴포넌트 마이그레이션
- [ ] `app/book/add/page.tsx` - 지출/수입 폼
- [ ] `app/book/edit/[id]/page.tsx` - 지출/수입 수정 폼
- [ ] `app/book/budget/add/page.tsx` - 예산 폼
- [ ] `app/book/category/add/page.tsx` - 카테고리 폼
- [ ] `app/settings/page.tsx` - 프로필 폼

### 4단계: 기존 코드 정리
- [ ] 사용하지 않는 useState 제거
- [ ] 중복 검증 로직 제거
- [ ] 에러 처리 통일

---

## 폴더 구조

```
lib/
└── validations/
    ├── expense.ts      # 지출 스키마
    ├── income.ts       # 수입 스키마
    ├── budget.ts       # 예산 스키마
    ├── category.ts     # 카테고리 스키마
    ├── profile.ts      # 프로필 스키마
    └── index.ts        # 통합 export
```

```typescript
// lib/validations/index.ts
export * from "./expense";
export * from "./income";
export * from "./budget";
export * from "./category";
export * from "./profile";
```

---

## 참고 자료

- [React Hook Form 공식 문서](https://react-hook-form.com/)
- [Zod 공식 문서](https://zod.dev/)
- [shadcn/ui Form 문서](https://ui.shadcn.com/docs/components/form)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)

