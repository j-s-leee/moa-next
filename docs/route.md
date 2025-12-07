# 라우트 구조

## 핵심 아이디어

같은 URL을 모바일/데스크탑에서 다른 레이아웃으로 렌더링한다.
next.js app router 방식에서의 parallel routes를 사용한 Master-detail 패턴 구현

### routes

```bash
/
├── landing
├── login
├── book/[id]
│   ├── summary?year=[year]&month=[month]
│   ├── categories
│   │   ├── [categoryId]
│   │   │   └── edit
│   │   ├── add
│   │   └── manage
│   ├── incomes?year=[year]&month=[month]
│   │   ├── [incomeId]
│   │   │   └── edit
│   │   └── add
│   ├── expenses?year=[year]&month=[month]
│   │   ├── [expenseId]
│   │   │   └── edit
│   │   └── add
│   └── budgets
│       ├── [budgetId]
│       │   └── edit
│       └── add
├── settings
└── profile

```

### next.js app router 폴더 구조

```bash
app
├── landing
│   └── page.tsx
├── login
│   └── page.tsx
├── book
│   └── [id]
│       ├── layout.tsx
│       ├── summary
│       │   └── page.tsx               // /book/[id]/summary?year=&month=
│       ├── categories
│       │   ├── page.tsx               // 기본 카테고리 화면 (manage 이동 전)
│       │   ├── manage
│       │   │   └── page.tsx
│       │   ├── add
│       │   │   └── page.tsx
│       │   └── [categoryId]
│       │       └── edit
│       │           └── page.tsx
│       ├── incomes
│       │   └── page.tsx               // /book/[id]/incomes?year=&month=
│       │   ├── add
│       │   │   └── page.tsx
│       │   └── [incomeId]
│       │       └── edit
│       │           └── page.tsx
│       ├── expenses
│       │   └── page.tsx               // /book/[id]/expenses?year=&month=
│       │   ├── add
│       │   │   └── page.tsx
│       │   └── [expenseId]
│       │       └── edit
│       │           └── page.tsx
│       └── budgets
│           ├── page.tsx               // /book/[id]/budgets
│           ├── add
│           │   └── page.tsx
│           └── [budgetId]
│               └── edit
│                   └── page.tsx
├── settings
│   └── page.tsx
└── profile
    └── page.tsx
```

### 라우트별 URL 매핑

| URL                                      | 폴더/파일                                             |
| ---------------------------------------- | ------------------------------------------------- |
| `/landing`                               | `landing/page.tsx`                                |
| `/login`                                 | `login/page.tsx`                                  |
| `/book/[id]`                             | `book/[id]/layout.tsx` + `page.tsx` 필요하면 추가    |
| `/book/[id]/summary?year=2025&month=12`  | `book/[id]/summary/page.tsx`                      |
| `/book/[id]/categories`                  | `book/[id]/categories/page.tsx`                   |
| `/book/[id]/categories/manage`              | `book/[id]/categories/manage/page.tsx`         |
| `/book/[id]/categories/add`              | `book/[id]/categories/add/page.tsx`               |
| `/book/[id]/categories/123/edit`         | `book/[id]/categories/[categoryId]/edit/page.tsx` |
| `/book/[id]/incomes?year=2025&month=12`  | `book/[id]/incomes/page.tsx`                      |
| `/book/[id]/incomes/add`                 | `book/[id]/incomes/add/page.tsx`                  |
| `/book/[id]/incomes/77/edit`             | `book/[id]/incomes/[incomeId]/edit/page.tsx`      |
| `/book/[id]/expenses?year=2025&month=12` | `book/[id]/expenses/page.tsx`                     |
| `/book/[id]/expenses/add`                | `book/[id]/expenses/add/page.tsx`                 |
| `/book/[id]/expenses/33/edit`            | `book/[id]/expenses/[expenseId]/edit/page.tsx`    |
| `/book/[id]/budgets`                     | `book/[id]/budgets/page.tsx`                      |
| `/book/[id]/budgets/add`                 | `book/[id]/budgets/add/page.tsx`                  |
| `/book/[id]/budgets/55/edit`             | `book/[id]/budgets/[budgetId]/edit/page.tsx`      |
| `/settings`                              | `settings/page.tsx`                               |
| `/profile`                               | `profile/page.tsx`                                |
