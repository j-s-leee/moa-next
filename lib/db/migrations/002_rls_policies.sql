-- Row Level Security (RLS) 정책 설정
-- Supabase의 보안을 위한 RLS 정책을 설정합니다.

-- ============================================================================
-- RLS 활성화
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Users 정책
-- ============================================================================

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- Books 정책
-- ============================================================================

-- 소유자는 자신의 가계부 조회/수정/삭제 가능
CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  USING (auth.uid() = owner_id);

-- 멤버는 멤버인 가계부 조회 가능
CREATE POLICY "Members can view shared books"
  ON books FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM book_members
      WHERE book_members.book_id = books.id
      AND book_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Book Members 정책
-- ============================================================================

-- 가계부 소유자와 멤버는 멤버 목록 조회 가능
CREATE POLICY "Users can view book members"
  ON book_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_members.book_id
      AND (books.owner_id = auth.uid() OR book_members.user_id = auth.uid())
    )
  );

-- 가계부 소유자는 멤버 추가/삭제 가능
CREATE POLICY "Owners can manage book members"
  ON book_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_members.book_id
      AND books.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Categories 정책
-- ============================================================================

-- 가계부 소유자와 멤버는 카테고리 조회/수정 가능
CREATE POLICY "Users can manage categories in their books"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = categories.book_id
      AND (
        books.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM book_members
          WHERE book_members.book_id = books.id
          AND book_members.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- Budgets 정책
-- ============================================================================

-- 가계부 소유자와 멤버는 예산 조회/수정 가능
CREATE POLICY "Users can manage budgets in their books"
  ON budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = budgets.book_id
      AND (
        books.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM book_members
          WHERE book_members.book_id = books.id
          AND book_members.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- Expenses 정책
-- ============================================================================

-- 가계부 소유자와 멤버는 지출 조회/수정 가능
CREATE POLICY "Users can manage expenses in their books"
  ON expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = expenses.book_id
      AND (
        books.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM book_members
          WHERE book_members.book_id = books.id
          AND book_members.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- Incomes 정책
-- ============================================================================

-- 가계부 소유자와 멤버는 수입 조회/수정 가능
CREATE POLICY "Users can manage incomes in their books"
  ON incomes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = incomes.book_id
      AND (
        books.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM book_members
          WHERE book_members.book_id = books.id
          AND book_members.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- Book Invitations 정책
-- ============================================================================

-- 초대자는 자신이 보낸 초대 조회 가능
CREATE POLICY "Users can view own invitations"
  ON book_invitations FOR SELECT
  USING (inviter_id = auth.uid());

-- 가계부 소유자는 초대 생성 가능
CREATE POLICY "Owners can create invitations"
  ON book_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_invitations.book_id
      AND books.owner_id = auth.uid()
    )
    AND inviter_id = auth.uid()
  );

-- 초대자는 자신이 보낸 초대 수정 가능 (상태 변경 등)
CREATE POLICY "Users can update own invitations"
  ON book_invitations FOR UPDATE
  USING (inviter_id = auth.uid());

