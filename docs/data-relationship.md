# 지출, 카테고리, 예산의 관계

## 1. 핵심 원칙

**가계부별로 모든 데이터가 독립적으로 존재**

- **카테고리**: 가계부별로 독립 (개인 가계부의 식비 ≠ 공동 가계부의 식비)
- **예산**: 가계부별로 독립 (개인 예산 ≠ 공동 예산)
- **지출**: 가계부별로 독립 (개인 지출 ≠ 공동 지출)

## 2. 데이터 구조

### 2.1 계층 구조

```
Book (가계부)
  ├─ Category (카테고리) [가계부별 독립]
  ├─ Budget (예산) [가계부별 독립, 카테고리와 연결]
  ├─ Expense (지출) [가계부별 독립, 카테고리와 연결]
  └─ Income (수입) [가계부별 독립]
```

### 2.2 관계도

```
┌─────────────────┐
│  Book (가계부)  │
│  - personal     │
│  - shared       │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │Category │       │ Budget  │       │ Expense │       │ Income  │
    │         │       │         │       │         │       │         │
    │bookId   │       │bookId   │       │bookId   │       │bookId   │
    │         │◄──────┤categoryId│       │categoryId│       │         │
    └─────────┘       └─────────┘       └─────────┘       └─────────┘
```

## 3. 실제 예시

### 3.1 시나리오: 식비 카테고리와 예산

**질문: 식비 카테고리 하나에 개인 예산과 공동 예산을 모두 설정할 수 있나?**

**답변: 아니요. 카테고리도 가계부별로 독립적으로 존재합니다.**

**올바른 구조:**

```
[개인 가계부]
  └─ 식비 카테고리 (bookId: personal-book-1)
      └─ 개인 식비 예산 20만원/월 (bookId: personal-book-1, categoryId: 식비-개인)

[공동 가계부]
  └─ 식비 카테고리 (bookId: shared-book-1)
      └─ 공동 식비 예산 30만원/월 (bookId: shared-book-1, categoryId: 식비-공동)
```

**데이터 예시:**

```typescript
// 개인 가계부의 식비 카테고리
const personalFoodCategory: Category = {
  id: "category-personal-food-1",
  bookId: "personal-book-1", // 개인 가계부
  name: "식비",
  icon: "🍽️",
  type: "expense",
};

// 개인 가계부의 식비 예산
const personalFoodBudget: Budget = {
  id: "budget-personal-food-1",
  bookId: "personal-book-1", // 개인 가계부
  categoryId: "category-personal-food-1", // 개인 가계부의 식비 카테고리
  period: "monthly",
  amount: 200000, // 20만원
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
};

// 공동 가계부의 식비 카테고리
const sharedFoodCategory: Category = {
  id: "category-shared-food-1",
  bookId: "shared-book-1", // 공동 가계부
  name: "식비",
  icon: "🍽️",
  type: "expense",
};

// 공동 가계부의 식비 예산
const sharedFoodBudget: Budget = {
  id: "budget-shared-food-1",
  bookId: "shared-book-1", // 공동 가계부
  categoryId: "category-shared-food-1", // 공동 가계부의 식비 카테고리
  period: "monthly",
  amount: 300000, // 30만원
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
};
```

## 4. 지출 기록 시나리오

### 4.1 개인 가계부에서 지출 기록

**플로우:**

```
1. 사용자가 개인 가계부 페이지 접근
   → bookId: "personal-book-1" 컨텍스트

2. [지출 추가] 버튼 클릭

3. 지출 입력 폼 표시
   - 카테고리 선택: 개인 가계부의 카테고리만 표시
     → bookId가 "personal-book-1"인 카테고리만 필터링
     → "식비" 카테고리 선택 (category-personal-food-1)

4. 금액, 날짜, 메모 입력

5. 저장
   → Expense 생성:
     - bookId: "personal-book-1"
     - categoryId: "category-personal-food-1"
     - amount: 50000
     - date: 2024-01-15

6. 예산 자동 연결
   → bookId와 categoryId로 Budget 찾기
   → budget-personal-food-1 찾음
   → 예산 대비 지출 계산: 5만원 / 20만원 = 25%
```

**코드 예시:**

```typescript
// 지출 기록 함수
function createExpense(
  bookId: string,
  categoryId: string,
  amount: number,
  date: Date,
  description: string
): Expense {
  // 1. 카테고리가 해당 가계부에 속하는지 확인
  const category = getCategory(categoryId);
  if (category.bookId !== bookId) {
    throw new Error("카테고리가 해당 가계부에 속하지 않습니다");
  }

  // 2. 지출 생성
  const expense: Expense = {
    id: generateId(),
    bookId,
    categoryId,
    amount,
    date,
    description,
    userId: getCurrentUserId(),
  };

  // 3. 예산 자동 연결 (선택적)
  const budget = findBudgetByCategory(bookId, categoryId, date);
  if (budget) {
    // 예산 대비 지출 업데이트
    updateBudgetUsage(budget.id, amount);
  }

  return expense;
}

// 예산 찾기 함수
function findBudgetByCategory(
  bookId: string,
  categoryId: string,
  date: Date
): Budget | null {
  // 같은 가계부의 같은 카테고리에 대한 예산 찾기
  return budgets.find(
    (budget) =>
      budget.bookId === bookId &&
      budget.categoryId === categoryId &&
      budget.startDate <= date &&
      budget.endDate >= date
  );
}
```

### 4.2 공동 가계부에서 지출 기록

**플로우:**

```
1. 사용자가 공동 가계부 페이지 접근
   → bookId: "shared-book-1" 컨텍스트

2. [지출 추가] 버튼 클릭

3. 지출 입력 폼 표시
   - 카테고리 선택: 공동 가계부의 카테고리만 표시
     → bookId가 "shared-book-1"인 카테고리만 필터링
     → "식비" 카테고리 선택 (category-shared-food-1)

4. 금액, 날짜, 메모 입력

5. 저장
   → Expense 생성:
     - bookId: "shared-book-1"
     - categoryId: "category-shared-food-1"
     - amount: 80000
     - date: 2024-01-15
     - userId: "user-a" (누가 입력했는지 기록)

6. 예산 자동 연결
   → bookId와 categoryId로 Budget 찾기
   → budget-shared-food-1 찾음
   → 예산 대비 지출 계산: 8만원 / 30만원 = 26.7%
```

## 5. 핵심 질문에 대한 답변

### Q1: 식비 카테고리 하나에 개인 예산과 공동 예산을 모두 설정할 수 있나?

**A: 아니요. 카테고리도 가계부별로 독립적으로 존재합니다.**

- 개인 가계부의 식비 카테고리 (bookId: personal-book-1)
- 공동 가계부의 식비 카테고리 (bookId: shared-book-1)

이렇게 **별도로 존재**하며, 각각에 예산을 설정합니다.

### Q2: 지출 기록 시 사용자가 예산을 직접 선택해야 하나?

**A: 아니요. 자동으로 연결됩니다.**

**자동 연결 로직:**

1. 사용자가 가계부 페이지에서 지출 기록
2. 해당 가계부의 카테고리만 표시 (bookId로 필터링)
3. 카테고리 선택
4. 저장 시 **같은 가계부의 같은 카테고리에 대한 예산을 자동으로 찾아 연결**

**사용자는 예산을 선택할 필요가 없습니다.**

### Q3: 카테고리도 개인/공동으로 나눠야 하나?

**A: 네, 가계부별로 독립적으로 존재합니다.**

**이유:**

1. **데이터 분리**: 개인과 공동 데이터를 명확히 구분
2. **예산 독립성**: 개인 예산과 공동 예산을 별도로 관리
3. **분석 정확성**: 개인 식비와 공동 식비를 별도로 분석 가능
4. **유연성**: 같은 이름의 카테고리라도 가계부별로 다른 설정 가능

**예시:**

- 개인 가계부의 "식비": 개인 용돈으로 사용하는 식비
- 공동 가계부의 "식비": 공동 생활비로 사용하는 식비

## 6. UI/UX 설계

### 6.1 카테고리 선택 UI

**개인 가계부 페이지:**

```
[지출 추가 폼]

카테고리 선택:
┌─────────────────────────┐
│ 🍽️ 식비                 │ ← 개인 가계부의 식비
│ 🚗 교통비               │
│ 🏠 주거비               │
│ ...                     │
└─────────────────────────┘
```

**공동 가계부 페이지:**

```
[지출 추가 폼]

카테고리 선택:
┌─────────────────────────┐
│ 🍽️ 식비                 │ ← 공동 가계부의 식비
│ 🚗 교통비               │
│ 🏠 주거비               │
│ ...                     │
└─────────────────────────┘
```

### 6.2 예산 표시

**지출 기록 후 예산 정보 표시:**

```
[지출 기록 완료]

✅ 지출이 기록되었습니다

식비 카테고리
- 금액: 5만원
- 예산: 20만원/월
- 사용률: 25% (5만원 / 20만원)
- 남은 예산: 15만원
```

**예산이 없는 경우:**

```
[지출 기록 완료]

✅ 지출이 기록되었습니다

식비 카테고리
- 금액: 5만원
- 예산: 미설정
- 💡 예산을 설정하면 예산 대비 지출을 추적할 수 있습니다
  [예산 설정하기]
```

## 7. 데이터 모델 상세

### 7.1 완전한 데이터 모델

```typescript
// 가계부
interface Book {
  id: string;
  name: string;
  type: "personal" | "shared";
  ownerIds: string[];
  createdAt: Date;
}

// 카테고리 (가계부별 독립)
interface Category {
  id: string;
  bookId: string; // 필수: 어느 가계부의 카테고리인지
  name: string;
  icon?: string;
  type: "expense" | "income";
  expenseType?: "fixed" | "variable" | "annual" | "one-time";
  autoDetectedType?: "fixed" | "variable";
  lastTypeCheckDate?: Date;
}

// 예산 (가계부별 독립, 카테고리와 연결)
interface Budget {
  id: string;
  bookId: string; // 필수: 어느 가계부의 예산인지
  categoryId: string; // 필수: 어느 카테고리의 예산인지
  period: "monthly" | "yearly";
  amount: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  previousBudgetId?: string; // 예산 수정 이력
}

// 지출 (가계부별 독립, 카테고리와 연결)
interface Expense {
  id: string;
  bookId: string; // 필수: 어느 가계부의 지출인지
  categoryId: string; // 필수: 어느 카테고리의 지출인지
  amount: number;
  date: Date;
  description: string;
  userId: string; // 누가 입력했는지 (공동 가계부에서 중요)
  budgetId?: string; // 선택적: 자동 연결된 예산 ID
  createdAt: Date;
}

// 수입 (가계부별 독립)
interface Income {
  id: string;
  bookId: string; // 필수: 어느 가계부의 수입인지
  amount: number;
  period: "monthly" | "yearly";
  source: string;
  incomeType: "actual" | "transfer";
  transferredFromBookId?: string;
  startDate: Date;
  endDate?: Date;
}
```

### 7.2 제약 조건

**데이터 무결성 제약:**

1. **카테고리 제약**

   - Category.bookId는 반드시 존재하는 Book.id여야 함
   - 같은 가계부 내에서 카테고리 이름은 중복 가능 (사용자 편의)

2. **예산 제약**

   - Budget.bookId는 반드시 존재하는 Book.id여야 함
   - Budget.categoryId는 반드시 존재하는 Category.id여야 함
   - Budget.bookId와 Category.bookId는 일치해야 함
   - 같은 가계부의 같은 카테고리에 대해 동일 기간의 예산은 중복 불가

3. **지출 제약**
   - Expense.bookId는 반드시 존재하는 Book.id여야 함
   - Expense.categoryId는 반드시 존재하는 Category.id여야 함
   - Expense.bookId와 Category.bookId는 일치해야 함
   - Expense.budgetId가 있으면 Budget.bookId와 Budget.categoryId가 일치해야 함

## 8. 예산 자동 연결 로직

### 8.1 연결 알고리즘

```typescript
function autoLinkBudget(expense: Expense): Budget | null {
  // 1. 같은 가계부의 같은 카테고리에 대한 예산 찾기
  const budgets = getBudgetsByBook(expense.bookId);

  // 2. 해당 카테고리의 예산 필터링
  const categoryBudgets = budgets.filter(
    (budget) => budget.categoryId === expense.categoryId
  );

  // 3. 지출 날짜가 포함되는 예산 찾기
  const activeBudget = categoryBudgets.find(
    (budget) =>
      budget.startDate <= expense.date && budget.endDate >= expense.date
  );

  // 4. 예산이 있으면 연결
  if (activeBudget) {
    expense.budgetId = activeBudget.id;
    updateBudgetUsage(activeBudget.id, expense.amount);
  }

  return activeBudget || null;
}
```

### 8.2 예산 사용률 계산

```typescript
function calculateBudgetUsage(
  budgetId: string,
  date: Date
): {
  budget: Budget;
  totalExpenses: number;
  usageRate: number;
  remaining: number;
} {
  const budget = getBudget(budgetId);
  const expenses = getExpensesByBudget(budgetId, date);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const usageRate = (totalExpenses / budget.amount) * 100;
  const remaining = budget.amount - totalExpenses;

  return {
    budget,
    totalExpenses,
    usageRate,
    remaining,
  };
}
```

### 8.3 예산 잔액 저장 방식

**Q: 예산의 잔액은 별도로 저장하나요?**

**A: 아니요. 예산 잔액은 저장하지 않고 필요할 때마다 계산합니다.**

**이유:**

1. **데이터 일관성**: 지출이 추가/수정/삭제될 때마다 잔액을 업데이트해야 하는데, 이 과정에서 동기화 문제가 발생할 수 있음
2. **단일 진실 공급원 (Single Source of Truth)**: 예산 금액과 지출 내역만 저장하고, 잔액은 항상 계산하여 항상 정확한 값 보장
3. **저장 공간 절약**: 불필요한 중복 데이터 저장 방지
4. **유연성**: 기간별, 카테고리별 등 다양한 조건으로 잔액 계산 가능

**계산 방식:**

```typescript
// 예산 잔액 계산 (실시간)
function calculateBudgetRemaining(budgetId: string, targetDate: Date): number {
  const budget = getBudget(budgetId);

  // 해당 예산 기간 내의 모든 지출 합계
  const expenses = getExpensesByBudgetAndDateRange(
    budgetId,
    budget.startDate,
    targetDate // 또는 budget.endDate
  );

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // 잔액 = 예산 금액 - 지출 합계
  return budget.amount - totalExpenses;
}
```

**성능 최적화 (선택적):**

대량의 데이터가 있는 경우 성능 최적화를 위해 캐시를 사용할 수 있습니다:

```typescript
// 예산 사용 현황 캐시 (선택적)
interface BudgetUsageCache {
  budgetId: string;
  period: string; // "2024-01" 형식
  totalExpenses: number;
  usageRate: number;
  remaining: number;
  lastUpdated: Date;
}

// 캐시 업데이트 전략
function updateBudgetUsageCache(
  budgetId: string,
  period: string
): BudgetUsageCache {
  const budget = getBudget(budgetId);
  const expenses = getExpensesByBudgetAndPeriod(budgetId, period);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const cache: BudgetUsageCache = {
    budgetId,
    period,
    totalExpenses,
    usageRate: (totalExpenses / budget.amount) * 100,
    remaining: budget.amount - totalExpenses,
    lastUpdated: new Date(),
  };

  // 캐시 저장 (Redis, 메모리 등)
  saveBudgetUsageCache(cache);

  return cache;
}

// 캐시 무효화 시점
function invalidateBudgetCache(budgetId: string, period: string) {
  // 지출 추가/수정/삭제 시
  // 예산 수정 시
  deleteBudgetUsageCache(budgetId, period);
}
```

**권장 방식:**

- **초기 단계**: 계산된 값 사용 (별도 저장 없음)
- **성능 이슈 발생 시**: 캐시 도입 고려
- **캐시 사용 시**: 지출 변경 시 캐시 무효화 필수

**데이터 모델:**

```typescript
// 예산 모델 (잔액 필드 없음)
interface Budget {
  id: string;
  bookId: string;
  categoryId: string;
  period: "monthly" | "yearly";
  amount: number; // 예산 금액만 저장
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  previousBudgetId?: string;
  // remaining 필드 없음 - 계산으로 처리
}

// 잔액은 함수로 계산
const remaining = calculateBudgetRemaining(budgetId, new Date());
```

## 9. 요약

### 9.1 핵심 원칙

1. **가계부별 독립성**: 모든 데이터(카테고리, 예산, 지출)는 가계부별로 독립
2. **자동 연결**: 지출 기록 시 예산은 자동으로 연결됨 (사용자 선택 불필요)
3. **명확한 구분**: 개인과 공동 데이터는 완전히 분리되어 관리
4. **계산된 값**: 예산 잔액은 저장하지 않고 필요할 때마다 계산 (데이터 일관성 보장)

### 9.2 사용자 경험

- **지출 기록**: 가계부 선택 → 카테고리 선택 → 금액 입력 → 저장
- **예산 연결**: 자동으로 처리됨 (사용자 개입 불필요)
- **예산 표시**: 지출 기록 후 예산 정보 자동 표시

### 9.3 데이터 구조

```
개인 가계부
  └─ 식비 카테고리
      └─ 식비 예산 20만원/월
          └─ 식비 지출들...

공동 가계부
  └─ 식비 카테고리 (별도 존재)
      └─ 식비 예산 30만원/월
          └─ 식비 지출들...
```

**결론: 카테고리도 예산처럼 가계부별로 나눠서 관리합니다.**
