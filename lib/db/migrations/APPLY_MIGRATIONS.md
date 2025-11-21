# 마이그레이션 적용 가이드

## 방법 1: Supabase Dashboard에서 직접 실행 (권장)

### 1단계: 기본 스키마 마이그레이션 적용

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. `drizzle/0000_chief_hiroim.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

### 2단계: Supabase Auth 연동 설정

1. SQL Editor에서 새 쿼리 생성
2. `lib/db/migrations/001_auth_foreign_key.sql` 파일의 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭하여 실행

### 3단계: RLS 정책 설정 (선택사항, 보안 강화)

1. SQL Editor에서 새 쿼리 생성
2. `lib/db/migrations/002_rls_policies.sql` 파일의 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭하여 실행

## 방법 2: Drizzle Push 사용 (환경 변수 설정 후)

환경 변수가 올바르게 설정되어 있다면:

```bash
npm run db:push
```

그 다음 Supabase Dashboard에서 `001_auth_foreign_key.sql`과 `002_rls_policies.sql`을 실행하세요.

## 확인 방법

마이그레이션이 성공적으로 적용되었는지 확인:

1. Supabase Dashboard > **Table Editor**에서 다음 테이블들이 생성되었는지 확인:
   - users
   - books
   - book_members
   - book_invitations
   - categories
   - budgets
   - expenses
   - incomes

2. **Database** > **Types**에서 다음 Enum 타입들이 생성되었는지 확인:
   - book_type
   - category_type
   - expense_type
   - budget_period
   - income_period
   - income_type
   - invitation_status

## 문제 해결

### DATABASE_URL 연결 오류

- `.env.local` 파일의 `DATABASE_URL`이 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 네트워크 연결 확인

### 외래키 제약 오류

- `001_auth_foreign_key.sql`을 실행하기 전에 `users` 테이블이 생성되어 있어야 합니다
- Supabase Auth가 활성화되어 있어야 합니다

