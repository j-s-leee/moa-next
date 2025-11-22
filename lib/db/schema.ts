import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * 데이터베이스 스키마
 *
 * 참고 문서:
 * - docs/data-relationship.md: 데이터 모델 및 관계
 * - docs/brainstorm.md: 설계 결정사항
 */

// ============================================================================
// Enums
// ============================================================================

export const bookTypeEnum = pgEnum("book_type", ["personal", "shared"]);
export const categoryTypeEnum = pgEnum("category_type", ["expense", "income"]);
export const expenseTypeEnum = pgEnum("expense_type", [
  "fixed",
  "variable",
  "annual",
  "one-time",
]);
export const budgetPeriodEnum = pgEnum("budget_period", ["monthly", "yearly"]);
export const incomePeriodEnum = pgEnum("income_period", ["monthly", "yearly"]);
export const incomeTypeEnum = pgEnum("income_type", ["actual", "transfer"]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
]);

// ============================================================================
// User Profile (Supabase Auth와 연동)
// ============================================================================

/**
 * 사용자 프로필 테이블
 * Supabase Auth의 auth.users와 연동 (id는 auth.users.id와 동일)
 * 참고: Supabase에서 auth.users는 자동으로 관리되므로 외래키 제약은 마이그레이션에서 수동 설정
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // auth.users.id와 동일 (외래키는 마이그레이션에서 설정)
    email: text("email").notNull().unique(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

// ============================================================================
// Book (가계부)
// ============================================================================

/**
 * 가계부 테이블
 * 개인 가계부 또는 공동 가계부를 나타냄
 */
export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: bookTypeEnum("type").notNull(), // 'personal' | 'shared'
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // 소유자 (공동 가계부는 생성자)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index("books_owner_id_idx").on(table.ownerId),
    typeIdx: index("books_type_idx").on(table.type),
  })
);

/**
 * 공동 가계부 멤버 테이블
 * 공동 가계부의 멤버 정보를 관리
 */
export const bookMembers = pgTable(
  "book_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // 'owner' | 'member'
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    bookUserIdx: unique("book_members_book_user_unique").on(
      table.bookId,
      table.userId
    ),
    bookIdx: index("book_members_book_id_idx").on(table.bookId),
    userIdx: index("book_members_user_id_idx").on(table.userId),
  })
);

/**
 * 공동 가계부 초대 테이블
 * Resend를 통해 이메일 초대를 관리
 */
export const bookInvitations = pgTable(
  "book_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inviteeEmail: text("invitee_email").notNull(),
    token: text("token").notNull().unique(), // 초대 토큰 (URL에 포함)
    status: invitationStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(), // 초대 만료 시간
    acceptedAt: timestamp("accepted_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    bookIdx: index("book_invitations_book_id_idx").on(table.bookId),
    tokenIdx: index("book_invitations_token_idx").on(table.token),
    emailIdx: index("book_invitations_email_idx").on(table.inviteeEmail),
    statusIdx: index("book_invitations_status_idx").on(table.status),
  })
);

// ============================================================================
// Category (카테고리)
// ============================================================================

/**
 * 카테고리 테이블
 * 가계부별로 독립적으로 존재하는 카테고리
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon"), // 이모지 또는 아이콘 이름
    type: categoryTypeEnum("type").notNull(), // 'expense' | 'income'
    expenseType: expenseTypeEnum("expense_type"), // 지출 타입 (지출 카테고리인 경우)
    autoDetectedType: expenseTypeEnum("auto_detected_type"), // 자동 감지된 타입
    lastTypeCheckDate: timestamp("last_type_check_date"), // 마지막 타입 확인 날짜
    order: integer("order").default(0), // 정렬 순서
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    bookIdx: index("categories_book_id_idx").on(table.bookId),
    bookTypeIdx: index("categories_book_type_idx").on(table.bookId, table.type),
  })
);

// ============================================================================
// Budget (예산)
// ============================================================================

/**
 * 예산 테이블
 * 가계부별로 독립적으로 존재하며, 카테고리와 연결됨
 * 예산 잔액은 저장하지 않고 계산 (단일 진실 공급원 원칙)
 */
export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    period: budgetPeriodEnum("period").notNull(), // 'monthly' | 'yearly'
    amount: integer("amount").notNull(), // 예산 금액 (원 단위)
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    previousBudgetId: uuid("previous_budget_id"), // 예산 수정 이력 (self-reference는 relations에서 처리)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    bookIdx: index("budgets_book_id_idx").on(table.bookId),
    categoryIdx: index("budgets_category_id_idx").on(table.categoryId),
    bookCategoryIdx: index("budgets_book_category_idx").on(
      table.bookId,
      table.categoryId
    ),
    dateRangeIdx: index("budgets_date_range_idx").on(
      table.startDate,
      table.endDate
    ),
    previousIdx: index("budgets_previous_budget_id_idx").on(
      table.previousBudgetId
    ),
  })
);

// ============================================================================
// Expense (지출)
// ============================================================================

/**
 * 지출 테이블
 * 가계부별로 독립적으로 존재하며, 카테고리와 연결됨
 * 예산은 자동으로 연결됨 (선택적)
 */
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // 지출 금액 (원 단위)
    date: timestamp("date").notNull(), // 지출 날짜
    description: text("description"), // 메모/설명
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // 누가 입력했는지 (공동 가계부에서 중요)
    budgetId: uuid("budget_id").references(() => budgets.id, {
      onDelete: "set null",
    }), // 자동 연결된 예산 ID (선택적)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    bookIdx: index("expenses_book_id_idx").on(table.bookId),
    categoryIdx: index("expenses_category_id_idx").on(table.categoryId),
    userIdx: index("expenses_user_id_idx").on(table.userId),
    budgetIdx: index("expenses_budget_id_idx").on(table.budgetId),
    dateIdx: index("expenses_date_idx").on(table.date),
    bookDateIdx: index("expenses_book_date_idx").on(table.bookId, table.date),
  })
);

// ============================================================================
// Income (수입)
// ============================================================================

/**
 * 수입 테이블
 * 가계부별로 독립적으로 존재
 * actual: 실제 수입, transfer: 개인 가계부에서 공동 가계부로 이체
 */
export const incomes = pgTable(
  "incomes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }), // 수입 카테고리 (기존 데이터 호환을 위해 nullable)
    amount: integer("amount").notNull(), // 수입 금액 (원 단위)
    // 단일 거래 vs 반복 수입 구분
    // 단일 거래: date만 사용, period와 startDate/endDate는 null
    // 반복 수입: period와 startDate/endDate 사용, date는 null
    date: timestamp("date"), // 단일 거래 날짜 (프리랜서, 자영업자용)
    period: incomePeriodEnum("period"), // 'monthly' | 'yearly' (반복 수입용, nullable)
    source: text("source"), // 수입 출처 (선택사항, 카테고리 이름으로 대체 가능)
    incomeType: incomeTypeEnum("income_type").notNull().default("actual"), // 'actual' | 'transfer'
    transferredFromBookId: uuid("transferred_from_book_id").references(
      () => books.id,
      { onDelete: "set null" }
    ), // 이체인 경우 출처 가계부 ID
    startDate: timestamp("start_date"), // 반복 수입 시작 날짜 (nullable)
    endDate: timestamp("end_date"), // 반복 수입 종료 날짜 (null이면 무기한)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    bookIdx: index("incomes_book_id_idx").on(table.bookId),
    categoryIdx: index("incomes_category_id_idx").on(table.categoryId),
    typeIdx: index("incomes_income_type_idx").on(table.incomeType),
    transferredFromIdx: index("incomes_transferred_from_idx").on(
      table.transferredFromBookId
    ),
    dateIdx: index("incomes_date_idx").on(table.date), // 단일 거래 날짜 인덱스
    dateRangeIdx: index("incomes_date_range_idx").on(
      table.startDate,
      table.endDate
    ), // 반복 수입 기간 인덱스
    bookDateIdx: index("incomes_book_date_idx").on(table.bookId, table.date), // 가계부별 단일 거래 조회용
  })
);

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  ownedBooks: many(books),
  bookMemberships: many(bookMembers),
  expenses: many(expenses),
  invitations: many(bookInvitations, { relationName: "inviter" }),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  owner: one(users, {
    fields: [books.ownerId],
    references: [users.id],
  }),
  members: many(bookMembers),
  invitations: many(bookInvitations),
  categories: many(categories),
  budgets: many(budgets),
  expenses: many(expenses),
  incomes: many(incomes),
  transferredIncomes: many(incomes, { relationName: "transferredFrom" }),
}));

export const bookMembersRelations = relations(bookMembers, ({ one }) => ({
  book: one(books, {
    fields: [bookMembers.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [bookMembers.userId],
    references: [users.id],
  }),
}));

export const bookInvitationsRelations = relations(
  bookInvitations,
  ({ one }) => ({
    book: one(books, {
      fields: [bookInvitations.bookId],
      references: [books.id],
    }),
    inviter: one(users, {
      fields: [bookInvitations.inviterId],
      references: [users.id],
    }),
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  book: one(books, {
    fields: [categories.bookId],
    references: [books.id],
  }),
  budgets: many(budgets),
  expenses: many(expenses),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  book: one(books, {
    fields: [budgets.bookId],
    references: [books.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
  previousBudget: one(budgets, {
    fields: [budgets.previousBudgetId],
    references: [budgets.id],
    relationName: "previous",
  }),
  nextBudgets: many(budgets, { relationName: "previous" }), // 이 예산을 이전 예산으로 참조하는 예산들
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  book: one(books, {
    fields: [expenses.bookId],
    references: [books.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  budget: one(budgets, {
    fields: [expenses.budgetId],
    references: [budgets.id],
  }),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  book: one(books, {
    fields: [incomes.bookId],
    references: [books.id],
  }),
  transferredFrom: one(books, {
    fields: [incomes.transferredFromBookId],
    references: [books.id],
    relationName: "transferredFrom",
  }),
}));
