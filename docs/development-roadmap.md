# 개발 로드맵 (Development Roadmap)

## 개발 진행 순서 및 진척도

이 문서는 The Moa 프로젝트의 개발 순서와 진척도를 추적합니다. 다른 AI agent가 이어서 작업할 수 있도록 명확하게 작성되었습니다.

**마지막 업데이트**: 2024년 12월 (Phase 4.5 개발 도구 도입 진행 중)

---

## Phase 0: 프로젝트 기반 설정

### 0.1 프로젝트 초기 설정

- [x] Next.js 프로젝트 생성
- [x] TypeScript 설정
- [x] Tailwind CSS 설정
- [x] shadcn/ui 설정
- [x] 기본 레이아웃 구조
- [x] Supabase 프로젝트 생성 및 연결
- [x] Drizzle ORM 설정
- [x] 환경 변수 설정

**진척도**: 100% 완료 ✅

**완료된 작업**:

- Supabase 클라이언트 라이브러리 설치 (`@supabase/supabase-js`, `@supabase/ssr`)
- Drizzle ORM 및 관련 패키지 설치 (`drizzle-orm`, `drizzle-kit`, `postgres`)
- Supabase 클라이언트 설정 파일 생성 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- Drizzle 설정 파일 생성 (`drizzle.config.ts`)
- 데이터베이스 연결 파일 생성 (`lib/db/index.ts`)
- 스키마 파일 초기화 (`lib/db/schema.ts`)
- package.json에 Drizzle 스크립트 추가

**다음 작업**: Phase 1.1 - 데이터베이스 스키마 설계 및 구현

---

## Phase 1: 데이터베이스 스키마 설계 및 구현

### 1.1 데이터베이스 스키마 설계

- [x] Drizzle 스키마 파일 생성 (`lib/db/schema.ts`)
- [x] User 테이블 설계 (Supabase Auth 연동)
- [x] Book 테이블 설계 (개인/공동 가계부)
- [x] BookMembers 테이블 설계 (공동 가계부 멤버)
- [x] BookInvitations 테이블 설계 (Resend 초대 기능)
- [x] Category 테이블 설계
- [x] Budget 테이블 설계 (예산 이력 관리 포함)
- [x] Expense 테이블 설계
- [x] Income 테이블 설계 (actual/transfer 타입 구분)
- [x] 관계(Relations) 정의
- [x] 인덱스 설계 (성능 최적화)

**참고 문서**: `docs/data-relationship.md`, `docs/brainstorm.md`

**진척도**: 100% 완료 ✅

**완료된 작업**:

- 모든 테이블 스키마 정의 완료
- Enum 타입 정의 (book_type, category_type, expense_type 등)
- 외래키 관계 설정
- 인덱스 설계 (조회 성능 최적화)
- Drizzle Relations 정의

**다음 작업**: Phase 1.2 - 마이그레이션 및 초기 데이터

### 1.2 마이그레이션 및 초기 데이터

- [x] Drizzle 마이그레이션 생성
- [x] Supabase에 마이그레이션 적용
- [x] 기본 카테고리 시드 데이터 준비
- [x] 테스트 데이터 생성 스크립트

**진척도**: 100% 완료 ✅

**완료된 작업**:

- 마이그레이션 파일 생성 완료 (`drizzle/0000_chief_hiroim.sql`)
- Supabase에 스키마 적용 완료
- Supabase Auth 연동 설정 완료 (`001_auth_foreign_key.sql`)
- RLS 정책 설정 완료 (`002_rls_policies.sql`)
- 시드 데이터 스크립트 작성 완료 (`lib/db/seed.ts`)
- 회원가입 시 자동 실행 함수 작성 완료 (`lib/db/seed-helpers.ts`)

**다음 작업**: Phase 2.1 - Supabase 인증 설정

**우선순위**: 🔴 최우선

---

## Phase 2: 인증 및 사용자 관리

### 2.1 Supabase 인증 설정

- [x] Supabase Auth 설정
- [x] 로그인 페이지 구현 (`app/login/page.tsx`) - OAuth 전용 (Google, Kakao)
- [x] OAuth 콜백 처리 (`app/auth/callback/route.ts`)
- [x] 인증 미들웨어 설정 (`middleware.ts`)
- [x] 사용자 세션 관리
- [x] OAuth 로그인 시 시드 데이터 자동 생성 연동

**진척도**: 100% 완료 ✅

**완료된 작업**:

- OAuth 로그인 페이지 구현 완료 (Google, Kakao)
- OAuth 콜백 처리 구현 완료
- 인증 미들웨어 설정 완료 (보호된 경로 접근 제어)
- 로그아웃 기능 구현 완료
- OAuth 로그인 시 자동으로 사용자 프로필 및 개인 가계부 생성

**주의사항**:

- Supabase Dashboard에서 Google OAuth 제공자 설정 필요
- Kakao OAuth는 Supabase에서 직접 지원하지 않으므로 Custom OAuth 설정 필요 (참고: `docs/SUPABASE_OAUTH_SETUP.md`)

**다음 작업**: Phase 3.1 - 가계부 생성 및 관리

**우선순위**: 🔴 최우선

### 2.2 사용자 프로필 관리

- [x] 프로필 페이지 구현 (`app/settings/page.tsx`)
- [x] 프로필 수정 기능
- [x] 사용자 정보 조회 API (`app/api/user/profile/route.ts`)

**진척도**: 100% 완료 ✅

**완료된 작업**:

- 사용자 프로필 조회 API 구현 완료 (GET `/api/user/profile`)
- 사용자 프로필 수정 API 구현 완료 (PUT `/api/user/profile`)
- 설정 페이지 프로필 관리 UI 구현 완료
- 프로필 이미지, 이름 수정 기능 구현 완료
- 테마 설정 UI 유지 (AnimatedThemeToggler)
- Toast 알림 기능 추가 (sonner)

**우선순위**: 🟡 중간

**예상 작업 시간**: 2-3시간 (완료)

---

## Phase 3: 개인 가계부 기본 기능

### 3.1 가계부 생성 및 관리

- [x] 개인 가계부 자동 생성 로직 (회원가입 시) - `lib/db/seed-helpers.ts`의 `onUserSignUp` 함수에서 구현
- [x] 가계부 목록 조회 API (`GET /api/book`) - 개인 가계부만 조회
- [x] 가계부 정보 조회 API (`GET /api/book/[id]`)
- [x] 가계부 정보 수정 API (`PUT /api/book/[id]`) - 이름 수정 가능
- [ ] 가계부 삭제 (향후)

**참고 문서**: `docs/data-relationship.md` - 가계부별 독립성 원칙

**진척도**: 75% 완료 ✅

**완료된 작업**:

- 개인 가계부 자동 생성 로직 구현 완료 (회원가입 시 `seedPersonalBook` 호출)
- 가계부 목록 조회 API 구현 완료 (`app/api/book/route.ts`)
- 가계부 정보 조회 API 구현 완료 (`app/api/book/[id]/route.ts`)
- 가계부 정보 수정 API 구현 완료 (이름 수정)

**우선순위**: 🔴 최우선

**예상 작업 시간**: 3-4시간 (완료)

### 3.2 카테고리 관리

- [x] 카테고리 목록 페이지 (`app/book/category/page.tsx`) - API 연동 완료
- [x] 카테고리 CRUD API 구현
  - [x] 카테고리 목록 조회 API (`GET /api/book/[bookId]/category`)
  - [x] 카테고리 생성 API (`POST /api/book/[bookId]/category`)
  - [x] 카테고리 수정 API (`PUT /api/book/[bookId]/category/[id]`)
  - [x] 카테고리 삭제 API (`DELETE /api/book/[bookId]/category/[id]`)
  - [x] 카테고리 순서 변경 API (`PUT /api/book/[bookId]/category/reorder`)
- [x] 카테고리 추가 기능 (`app/book/category/add/page.tsx`) - API 연동 완료
- [x] 카테고리 수정 기능 - API 구현 완료 (UI는 향후 구현)
- [x] 카테고리 삭제 기능 - API 연동 완료
- [x] 카테고리 아이콘 선택 기능 - 구현 완료
- [ ] 지출 타입 자동 감지 로직 (3개월 데이터 기준) - 향후 구현

**참고 문서**:

- `docs/brainstorm.md` - 지출 타입 자동 감지 로직
- `docs/data-relationship.md` - 카테고리와 가계부 관계

**진척도**: 85% 완료 ✅

**완료된 작업**:

- 카테고리 CRUD API 구현 완료
- 카테고리 목록 페이지 API 연동 완료
- 카테고리 추가 페이지 API 연동 완료
- 카테고리 삭제 기능 구현 완료
- 카테고리 순서 변경 기능 구현 완료
- 카테고리 아이콘 선택 기능 구현 완료

**우선순위**: 🔴 최우선

**예상 작업 시간**: 6-8시간 (대부분 완료)

### 3.3 지출 내역 관리

- [x] 지출 목록 페이지 (`app/book/page.tsx`) - 지출과 단일 거래 수입 통합 표시
- [x] 지출 CRUD API 구현
- [x] 지출 추가 기능 (`app/book/add/page.tsx`)
- [x] 지출 수정 기능
- [x] 지출 삭제 기능
- [x] 캘린더 뷰 구현 - 실제 지출 데이터 표시
- [x] 리스트 뷰 구현 - 지출과 단일 거래 수입 통합 표시
- [x] 단일 거래 수입 통합 - 지출 탭에 단일 거래 수입도 함께 표시
- [ ] 카테고리별 필터링
- [ ] 기간별 필터링
- [x] 예산 자동 연결 로직 - API에 구현됨

**참고 문서**: `docs/data-relationship.md` - 예산 자동 연결 로직

**진척도**: 70% 완료

**완료된 작업**:

- 지출 CRUD API 구현 완료
- 지출 추가/수정/삭제 기능 구현 완료
- 리스트 뷰 구현 완료 (일별 그룹화, 필터링, 정렬)
- 단일 거래 수입과 지출 통합 표시 완료
  - 지출 탭에서 지출과 단일 거래 수입을 날짜별로 함께 표시
  - 수입/지출 필터링 및 정렬 지원
- 캘린더 뷰 구현 완료 (`components/ui/expense-calendar.tsx`)
  - 날짜별 수입/지출 금액 표시
  - 날짜 클릭 시 해당 날짜의 상세 내역 표시 (Drawer)
- 예산 자동 연결 로직 API에 구현 완료

**우선순위**: 🔴 최우선

**예상 작업 시간**: 8-10시간 (대부분 완료)

### 3.4 수입 내역 관리

- [x] 수입 목록 페이지 - 지출 페이지에 수입 탭 추가 (반복 수입만 표시)
- [x] 수입 CRUD API 구현
  - [x] 수입 목록 조회 API (`GET /api/book/[bookId]/income`)
  - [x] 수입 추가 API (`POST /api/book/[bookId]/income`)
  - [x] 수입 수정 API (`PUT /api/book/[bookId]/income/[id]`)
  - [x] 수입 삭제 API (`DELETE /api/book/[bookId]/income/[id]`)
- [x] 수입 추가 기능 (`app/book/add/page.tsx`)
- [x] 단발성 수입(단일 거래) 지원 - date 필드로 단일 거래 수입 관리
- [x] 단일 거래 수입 삭제 기능
- [x] 단일 거래 수입과 지출 통합 표시 - 지출 탭에 함께 표시
- [ ] 수입 수정 기능 (단일거래 수정)
- [x] 수입 삭제 기능
- [x] 기간 구분 (월간/연간) - 반복 수입만
- [ ] 수입 이체 기능 (개인 → 공동, 향후)

**참고 문서**:

- `docs/brainstorm.md` - 수입 관리
- `docs/income-types.md` - 단일 거래 vs 반복 수입

**진척도**: 90% 완료

**완료된 작업**:

- 수입 CRUD API 구현 완료 (단일 거래 및 반복 수입 모두 지원)
- 수입 추가 기능 구현 완료 (단일 거래 및 반복 수입 모두 지원)
- 단발성 수입(단일 거래) 기능 구현 완료
  - date 필드를 사용한 단일 거래 수입 지원
  - 지출 탭에 단일 거래 수입도 함께 표시
  - 날짜별 그룹화 및 필터링 지원
- 수입 목록 페이지 구현 완료
  - 수입 탭: 반복 수입(period가 있는 수입)만 표시
  - 지출 탭: 지출과 단일 거래 수입(date가 있는 수입) 통합 표시
- 수입 삭제 기능 구현 완료 (단일 거래 및 반복 수입 모두)
- 기간 구분 (월간/연간) 구현 완료

**우선순위**: 🟡 중간

**예상 작업 시간**: 4-6시간 (대부분 완료)

---

## Phase 4: 예산 관리 기능

### 4.1 예산 설정 및 관리

- [x] 예산 목록 페이지 (`app/book/budget/page.tsx`) - 완료
- [x] 예산 CRUD API 구현
  - [x] 예산 목록 조회 API (`GET /api/book/[bookId]/budget`)
  - [x] 예산 생성 API (`POST /api/book/[bookId]/budget`)
  - [x] 예산 수정 API (`PUT /api/book/[bookId]/budget/[id]`)
  - [x] 예산 삭제 API (`DELETE /api/book/[bookId]/budget/[id]`)
- [x] 예산 추가 기능 (`app/book/budget/add/page.tsx`) - 완료
- [x] 예산 수정 기능 - API 완료 (UI는 향후 개선)
- [x] 예산 삭제 기능 - 완료
- [x] 월별/연별 예산 설정 - 완료
- [x] 예산 이력 관리 (previousBudgetId) - 스키마 및 API에 구현됨 (UI는 향후)
- [ ] 예산 중간 수정 시나리오 처리 - 부분 완료 (API는 있으나 UI 가이드 없음)

**참고 문서**:

- `docs/brainstorm.md` - 예산 수정 시나리오 처리
- `docs/data-relationship.md` - 예산 잔액 계산

**진척도**: 90% 완료 ✅

**완료된 작업**:

- 예산 CRUD API 구현 완료
- 예산 목록 페이지 구현 완료 (월별/연별 선택, 예산 대비 지출 표시)
- 예산 추가 기능 구현 완료
- 예산 수정 API 구현 완료 (previousBudgetId 지원)
- 예산 삭제 기능 구현 완료
- 고정지출 배지 표시 및 경고 제외 기능 구현 완료

**우선순위**: 🔴 최우선

**예상 작업 시간**: 6-8시간 (대부분 완료)

### 4.2 예산 대비 지출 추적

- [x] 예산 잔액 계산 로직 (실시간 계산) - 완료
- [x] 예산 사용률 표시 - 완료 (도넛 차트 및 퍼센트 표시)
- [x] 예산 초과 알림 - 완료 (toast 알림)
- [x] 예산 경고 (80%, 100% 등) - 완료
- [x] 예산 대비 지출 차트 - 완료 (BarChart)
- [x] 고정지출 경고 제외 - 완료 (고정지출은 100% 사용해도 경고 없음)

**참고 문서**: `docs/data-relationship.md` - 예산 잔액 저장 방식

**진척도**: 100% 완료 ✅

**완료된 작업**:

- 예산 잔액 실시간 계산 로직 구현 완료
- 예산 사용률 표시 (도넛 차트 및 퍼센트) 구현 완료
- 예산 초과 알림 (toast) 구현 완료
- 예산 경고 시스템 구현 완료 (80% 경고, 100% 초과)
- 예산 대비 지출 차트 (BarChart) 구현 완료
- 고정지출 판별 및 경고 제외 기능 구현 완료

**우선순위**: 🟡 중간

**예상 작업 시간**: 4-6시간 (완료)

### 4.3 예산 자동 제안

- [x] 과거 지출 데이터 분석 - 완료 (최근 3개월/3년 데이터 분석)
- [x] 예산 제안 알고리즘 구현 - 완료
  - [x] 평균 지출 기반 제안
  - [x] 변동성 고려 안전 마진 (10-20%)
  - [x] 고정지출 판별 로직 (변동계수 5% 미만)
  - [x] 고정지출 제안 (안전 마진 없이 실제 지출 금액)
- [x] 예산 제안 UI - 완료 (`app/book/budget/suggest/page.tsx`)
- [x] 예산 제안 수용/거부 기능 - 완료
- [x] 고정지출 자동 판별 및 카테고리 타입 업데이트 - 완료

**참고 문서**: `docs/brainstorm.md` - 예산 자동 제안

**진척도**: 100% 완료 ✅

**완료된 작업**:

- 예산 제안 API 구현 완료 (`GET /api/book/[bookId]/budget/suggest`)
- 과거 지출 데이터 분석 로직 구현 완료
- 고정지출 판별 알고리즘 구현 완료 (변동계수 기반)
- 예산 제안 UI 구현 완료 (월간/연간 탭, 제안 수용/거부)
- 고정지출 제안 시 카테고리 타입 자동 업데이트 기능 구현 완료
- 기존 예산과 비교 기능 구현 완료
- 고정지출이고 예산이 일치하면 제안에서 제외 기능 구현 완료

**우선순위**: 🟢 낮음 (완료)

**예상 작업 시간**: 6-8시간 (완료)

---

## Phase 4.5: TanStack Query 도입

### 4.5.1 기본 설정 및 마이그레이션

- [x] `@tanstack/react-query` 설치
- [x] QueryClient 설정 및 Provider 설정
- [x] 기본 옵션 설정 (staleTime, gcTime 등)
- [x] 핵심 쿼리 파일 생성 (`lib/react-query/queries/`)
  - [x] 가계부 목록 조회 쿼리 (`books.ts`)
  - [x] 지출 목록 조회 쿼리 (`expenses.ts`)
  - [x] 수입 목록 조회 쿼리 (`incomes.ts`)
  - [x] 예산 목록 조회 쿼리 (`budgets.ts`)
  - [x] 카테고리 목록 조회 쿼리 (`categories.ts`)
  - [x] 사용자 정보 조회 쿼리 (`user.ts`)
- [x] Mutation 구현 (낙관적 업데이트 포함)
  - [x] 지출 추가/수정/삭제 Mutation
  - [x] 수입 추가/수정/삭제 Mutation
  - [x] 예산 추가/수정/삭제 Mutation
  - [x] 카테고리 추가/수정/삭제/순서변경 Mutation
  - [x] 사용자 프로필 조회/수정 Mutation
- [x] 실제 페이지에서 쿼리 사용 (마이그레이션 완료)
  - [x] `app/book/page.tsx` - 지출/수입 목록 및 삭제
  - [x] `app/book/budget/page.tsx` - 예산 목록 및 삭제
  - [x] `app/book/[bookId]/category/page.tsx` - 카테고리 목록, 삭제, 순서 변경
  - [x] `app/book/add/page.tsx` - 지출/수입 추가
  - [x] `app/book/budget/add/page.tsx` - 예산 추가
  - [x] `app/book/budget/suggest/page.tsx` - 예산 제안
  - [x] `app/book/category/add/page.tsx` - 카테고리 추가
  - [x] `app/book/[bookId]/category/edit/[id]/page.tsx` - 카테고리 수정
  - [x] `app/book/edit/[id]/page.tsx` - 지출/수입 수정
  - [x] `app/settings/page.tsx` - 프로필 조회/수정

**참고 문서**: `docs/tanstack-query-review.md` - 도입 검토 및 계획

**진척도**: 95% 완료 ✅

**우선순위**: 🟡 중간 (Phase 5 시작 전 권장)

**예상 작업 시간**: 8-12시간

**도입 이유**:

- Phase 5 (대시보드) 개발 시 여러 데이터 소스를 효율적으로 관리
- 캐싱 및 자동 동기화로 사용자 경험 개선
- Phase 6 (공동 가계부) 개발 시 실시간 동기화에 유리
- 코드 중복 제거 및 개발 생산성 향상

**주의사항**:

- 점진적 마이그레이션 전략 사용 (Phase 5부터 새 기능에 적용)
- 기존 Phase 3-4 코드는 필요 시 점진적으로 리팩토링
- 기존 기능 동작에 영향 없도록 주의

### 4.5.2 폼 관리 도구 도입 (React Hook Form + Zod)

- [x] `react-hook-form` 설치
- [x] `@hookform/resolvers` 설치
- [x] Zod 스키마 정의 (`lib/validations/`)
  - [x] 지출 폼 스키마 (`expense.ts`)
  - [x] 수입 폼 스키마 (`income.ts`)
  - [x] 예산 폼 스키마 (`budget.ts`)
  - [x] 카테고리 폼 스키마 (`category.ts`)
  - [x] 프로필 폼 스키마 (`profile.ts`)
- [x] shadcn/ui Form 컴포넌트 생성 (`components/ui/form.tsx`)
- [x] 기존 폼 컴포넌트 마이그레이션 진행 중
  - [x] `app/book/add/page.tsx` (지출/수입 폼)
  - [x] `app/book/budget/add/page.tsx`
  - [x] `app/book/category/add/page.tsx`
  - [x] `app/settings/page.tsx` (프로필 폼)
  - [x] `app/book/edit/[id]/page.tsx` (가계부 수정)
- [x] API 라우트에서 Zod 스키마 사용 (18개 파일)

**참고 문서**: `docs/additional-tools-review.md` - 추가 도구 검토

**진척도**: 95% 완료 ✅

**우선순위**: 🔴 최우선 (TanStack Query와 함께 또는 그 전에)

**예상 작업 시간**: 4-6시간

**도입 이유**:

- 현재 폼 코드가 많고 복잡함 (수동 검증, 에러 처리)
- Zod가 이미 설치되어 있으나 미사용
- 폼 코드 50-70% 감소 예상
- 타입 안전한 검증으로 버그 감소
- shadcn/ui와 완벽 호환

### 4.5.3 개발 도구 설정

- [x] Prettier 설치 및 설정
  - [x] `.prettierrc` 설정 파일 생성
  - [x] `.prettierignore` 설정
  - [x] package.json 스크립트 추가 (`format`, `format:check`)
  - [ ] VS Code 설정 (format on save) - 사용자 설정 필요
- [ ] React Error Boundary 구현
  - [ ] `components/error-boundary.tsx` 생성
  - [ ] `app/layout.tsx`에 ErrorBoundary 추가
  - [ ] 에러 화면 UI 구현

**참고 문서**: `docs/additional-tools-review.md` - 추가 도구 검토

**진척도**: 50% 완료 ✅

**우선순위**: 🟡 중간

**예상 작업 시간**: 3-5시간

**도입 이유**:

- 코드 포맷팅 일관성 향상
- 에러 발생 시 사용자 친화적인 화면 제공
- 개발 생산성 향상

---

## Phase 5: 대시보드 및 통계

### 5.1 개인 가계부 대시보드

- [x] 대시보드 페이지 (`app/dashboard/page.tsx`) - UI만 구현됨
- [ ] 총 수입/예산/지출 집계
- [ ] 예산 대비 지출 차트
- [ ] 카테고리별 지출 현황
- [ ] 최근 지출 내역
- [ ] 월별/연별 선택 기능

**참고 문서**: `docs/information-architecture.md` - 대시보드 구조

**진척도**: 30% 완료 (UI만 구현)

**우선순위**: 🟡 중간

**예상 작업 시간**: 6-8시간

### 5.2 분석 기능

- [x] 요약 페이지 (`app/summary/page.tsx`) - UI만 구현됨
- [ ] 지출 추이 분석
- [ ] 카테고리별 분석
- [ ] 시계열 분석
- [ ] 예산 변경 추이 시각화
- [ ] 기간별 비교 기능

**참고 문서**: `docs/information-architecture.md` - 분석 페이지 구조

**진척도**: 30% 완료 (UI만 구현)

**우선순위**: 🟢 낮음 (Phase 4 이후)

**예상 작업 시간**: 8-10시간

---

## Phase 5.5: 전역 상태 관리 도입 (Zustand)

### 5.5.1 Zustand 기본 설정

- [x] `zustand` 설치
- [x] 기본 Store 구조 설계
  - [x] `lib/stores/book-store.ts` - 가계부 관련 상태
  - [x] `lib/stores/user-store.ts` - 사용자 관련 상태
- [x] 기본 Store 구현
  - [x] 가계부 목록 관리 (개인 + 공동)
  - [x] 현재 선택된 가계부 관리
  - [x] 사용자 정보 관리
  - [ ] 파트너 정보 관리 (공동 가계부용) - 향후 구현
- [x] TanStack Query와 연동 (`lib/react-query/queries/books.ts`)

**참고 문서**: `docs/zustand-review.md` - Zustand 도입 시점 검토

**진척도**: 80% 완료 ✅

**우선순위**: 🟡 중간 (Phase 6 시작 전 필수)

**예상 작업 시간**: 2-3시간

**도입 이유**:

- Phase 6 (공동 가계부) 개발 시 **반드시 필요**
- 가계부 전환 기능 (개인 ↔ 공동) 구현에 필수
- 가계부 목록 중복 fetch 문제 해결
- 사용자/파트너 정보 전역 관리
- 실시간 동기화를 위한 상태 관리
- TanStack Query와 함께 사용 시 강력한 조합

**주의사항**:

- Phase 5 (대시보드) 개발 중 필요해지면 먼저 도입 가능
- 기본 설정만 하고, Phase 6 개발하면서 점진적으로 활용
- TanStack Query와 함께 사용 (서버 상태 vs 클라이언트 상태 구분)

---

## Phase 6: 공동 가계부 기능

### 6.1 공동 가계부 생성 및 관리

- [ ] 공동 가계부 생성 API
- [ ] 파트너 초대 기능
- [ ] 초대 승인/거부 기능
- [ ] 공동 가계부 목록 조회
- [ ] 공동 가계부 설정 페이지 (`app/shared/page.tsx`)
- [ ] 공동 가계부 삭제 기능

**참고 문서**:

- `docs/brainstorm.md` - 공동 가계부 구성 제안
- `docs/data-relationship.md` - 가계부별 독립성

**진척도**: 0% 완료

**우선순위**: 🟡 중간 (Phase 3 완료 후)

**예상 작업 시간**: 8-10시간

### 6.2 공동 가계부 예산 설정

- [ ] 공동 예산 설정 가이드 UI
- [ ] 개인 예산 참고 기능
- [ ] 공동 예산 자동 제안 로직
- [ ] 예산 재조정 가이드
- [ ] 예산 초과 경고 시스템

**참고 문서**: `docs/brainstorm.md` - 공동 가계부 예산 설정

**진척도**: 0% 완료

**우선순위**: 🟡 중간

**예상 작업 시간**: 6-8시간

### 6.3 공동 가계부 지출 관리

- [ ] 공동 가계부 지출 추가
- [ ] 지출 입력자 추적 (userId)
- [ ] 공동 가계부 지출 목록
- [ ] 입력자별 필터링
- [ ] 공동 가계부 캘린더 뷰

**참고 문서**: `docs/data-relationship.md` - 지출 입력자 추적

**진척도**: 0% 완료

**우선순위**: 🟡 중간

**예상 작업 시간**: 6-8시간

### 6.4 공동 가계부 수입 관리

- [ ] 공동 수입 추가 기능
- [ ] 수입 이체 기능 (개인 → 공동)
- [ ] 수입 타입 구분 (actual/transfer)
- [ ] 총 수입 계산 로직 (이체 제외)

**참고 문서**: `docs/brainstorm.md` - 수입 분리 방식

**진척도**: 0% 완료

**우선순위**: 🟡 중간

**예상 작업 시간**: 4-6시간

### 6.5 통합 대시보드

- [ ] 통합 뷰 구현 (개인 + 공동)
- [ ] 개인/공동 필터링
- [ ] 통합 예산 분석
- [ ] 통합 지출 분석
- [ ] 수입 한도 경고 시스템

**참고 문서**: `docs/brainstorm.md` - 통합 대시보드

**진척도**: 0% 완료

**우선순위**: 🟢 낮음 (Phase 6.1-6.4 완료 후)

**예상 작업 시간**: 6-8시간

---

## Phase 7: 고급 기능

### 7.1 알림 시스템

- [ ] 예산 초과 알림
- [ ] 예산 경고 알림 (80%, 100%)
- [ ] 공동 가계부 예산 변경 알림
- [ ] 알림 설정 페이지
- [ ] 알림 읽음 처리

**참고 문서**: `docs/information-architecture.md` - 알림 설정

**진척도**: 0% 완료

**우선순위**: 🟢 낮음

**예상 작업 시간**: 6-8시간

### 7.2 데이터 내보내기/가져오기

- [ ] CSV 내보내기
- [ ] Excel 내보내기
- [ ] 데이터 가져오기 기능
- [ ] 백업/복원 기능

**진척도**: 0% 완료

**우선순위**: 🟢 낮음

**예상 작업 시간**: 4-6시간

### 7.3 검색 및 필터링 고도화

- [ ] 통합 검색 기능
- [ ] 고급 필터링 옵션
- [ ] 저장된 필터 기능

**참고 문서**: `docs/information-architecture.md` - 검색 및 필터링

**진척도**: 0% 완료

**우선순위**: 🟢 낮음

**예상 작업 시간**: 4-6시간

---

## Phase 8: 성능 최적화 및 개선

### 8.1 성능 최적화

- [ ] 예산 잔액 계산 캐싱 (필요 시)
- [ ] 대시보드 데이터 캐싱
- [ ] 페이지네이션 최적화
- [ ] 이미지 최적화
- [ ] 번들 크기 최적화

**진척도**: 0% 완료

**우선순위**: 🟢 낮음 (Phase 1-6 완료 후)

**예상 작업 시간**: 6-8시간

### 8.2 접근성 및 사용성 개선

- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원
- [ ] 반응형 디자인 개선
- [ ] 모바일 최적화

**참고 문서**: `docs/information-architecture.md` - 반응형 구조

**진척도**: 0% 완료

**우선순위**: 🟢 낮음

**예상 작업 시간**: 8-10시간

---

## 현재 진행 상황 요약

### 완료된 작업

- ✅ 프로젝트 초기 설정 (100%)
- ✅ Supabase 연결 및 Drizzle ORM 설정 완료
- ✅ 데이터베이스 스키마 설계 및 마이그레이션 적용 완료
- ✅ 기본 UI 컴포넌트 구조
- ✅ 일부 페이지 UI 구현 (가계부, 예산, 카테고리, 대시보드, 요약)
- ✅ 인증 및 사용자 관리 (OAuth 로그인, 프로필 관리)
- ✅ 개인 가계부 기본 기능 (생성, 목록 조회, 정보 조회/수정 API)
- ✅ 카테고리 관리 (CRUD API 및 UI)
- ✅ 지출 내역 관리 (CRUD API 및 UI, 단일 거래 수입 통합)
- ✅ 수입 내역 관리 (단일 거래 및 반복 수입 지원, UI 통합)
- ✅ 예산 관리 기능 (CRUD API, 예산 대비 지출 추적, 예산 자동 제안)
- ✅ React Hook Form + Zod 도입 (스키마 정의 및 폼 마이그레이션 완료)
- ✅ Prettier 설정 완료
- ✅ TanStack Query 도입 완료 (기본 설정, 쿼리 파일 생성, 실제 페이지 마이그레이션 완료)
- ✅ Zustand 기본 설정 및 Store 구현 완료

### 진행 중인 작업

- ⏳ **Phase 4.5.3**: React Error Boundary 구현 (Prettier 및 TanStack Query 마이그레이션 완료)

### 다음 우선 작업 (순서대로)

1. **Phase 4.5.3**: React Error Boundary 구현 (Prettier는 완료, TanStack Query 마이그레이션 완료)
2. **Phase 3.3**: 지출 내역 관리 - 카테고리별/기간별 필터링
3. **Phase 4.1**: 예산 수정 UI 개선 (현재 API만 있음)
4. **Phase 5**: 대시보드 및 통계 (데이터 연동)
5. **Phase 5.5**: Zustand 파트너 정보 관리 추가 (Phase 6 시작 전 필수)
6. **Phase 6**: 공동 가계부 기능 개발

---

## 작업 시작 전 체크리스트

새로운 작업을 시작하기 전에 다음을 확인하세요:

- [ ] 관련 문서 확인 (`docs/` 폴더)
- [ ] 데이터 모델 확인 (`docs/data-relationship.md`)
- [ ] UI 구조 확인 (`docs/information-architecture.md`)
- [ ] 기존 코드 스타일 확인
- [ ] 브랜치 전략 확인

---

## 작업 완료 후 체크리스트

작업을 완료한 후 다음을 수행하세요:

- [ ] 코드 리뷰 (가능한 경우)
- [ ] 테스트 작성/실행
- [ ] 문서 업데이트 (필요 시)
- [ ] 이 로드맵의 진척도 업데이트
- [ ] 커밋 메시지에 Phase 번호 포함

---

## 참고 사항

### 개발 원칙

1. **가계부별 독립성**: 모든 데이터는 가계부별로 독립적으로 관리
2. **예산 잔액**: 저장하지 않고 계산 (단일 진실 공급원)
3. **자동 연결**: 지출 기록 시 예산 자동 연결
4. **점진적 개선**: 예산 설정은 선택사항이지만 권장

### 기술 스택

- Frontend: Next.js 14+, React, TypeScript
- UI: Tailwind CSS, shadcn/ui, Lucide Icons
- Data Fetching: TanStack Query ✅ (Phase 4.5.1 도입 완료, 마이그레이션 진행 중)
- State Management: Zustand ✅ (Phase 5.5.1 기본 설정 완료)
- Form Management: React Hook Form + Zod ✅ (Phase 4.5.2 도입 완료)
- Backend: Supabase
- Database: Supabase (PostgreSQL)
- ORM: Drizzle ORM
- Code Formatting: Prettier ✅ (Phase 4.5.3 설정 완료)

### 문서 참고

- `docs/project-overview.md`: 프로젝트 개요 및 목표
- `docs/brainstorm.md`: 설계 결정사항 및 브레인스토밍
- `docs/data-relationship.md`: 데이터 모델 및 관계
- `docs/information-architecture.md`: UI 구조 및 사용자 플로우
- `docs/competitive-analysis.md`: 경쟁사 분석
- `docs/kpi.md`: 성과 지표
- `docs/tanstack-query-review.md`: TanStack Query 도입 검토 및 계획
- `docs/additional-tools-review.md`: 추가 도구 도입 검토 (React Hook Form, Prettier 등)
- `docs/zustand-review.md`: Zustand (전역 상태 관리) 도입 시점 검토

---

**마지막 업데이트**: 작업 완료 시 이 날짜를 업데이트하세요.
