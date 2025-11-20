# The Moa

개인 및 부부 공동 가계부 관리 서비스

## 프로젝트 소개

The Moa는 개인 가계부와 부부 공동 가계부를 한 서비스에서 관리하며, 예산 기반의 계획적 소비와 중장기적인 저축을 지원하는 가계부 서비스입니다.

### 핵심 기능

- **개인 + 공동 통합 관리**: 개인 가계부와 공동 가계부를 별도로 관리하되 통합 뷰 제공
- **예측 기반 예산 관리**: 과거 데이터 기반으로 다음 달/다음 해 예산 자동 제안
- **지능형 지출 분류**: 자동 감지로 고정지출/변동지출 구분
- **유연한 예산 설정**: 예산은 선택사항이지만 강력히 권장, 점진적 예산 관리 지원

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Supabase
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM

## 시작하기

### 필수 요구사항

- Node.js 20 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 Supabase 연결 정보를 설정하세요:

```env
# Supabase Configuration
# Supabase 프로젝트 설정 페이지에서 확인:
# Project Settings > API > Project URL 및 anon/public key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Connection (Drizzle 마이그레이션용)
# Supabase 프로젝트 설정 > Database > Connection string > URI 복사
# 형식: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Optional: 관리자 작업용 (서비스 롤 키)
# Supabase 프로젝트 설정 > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Supabase 프로젝트 설정에서 정보 확인하는 방법:**

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. **Project Settings** > **API** 메뉴에서:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Project Settings** > **Database** 메뉴에서:
   - **Connection string** > **URI** 복사 → `DATABASE_URL` (비밀번호 포함)

## 프로젝트 구조

```
moa-next/
├── app/              # Next.js App Router 페이지
│   ├── book/        # 가계부 관련 페이지
│   ├── dashboard/   # 대시보드 페이지
│   ├── summary/     # 분석/요약 페이지
│   └── settings/    # 설정 페이지
├── components/       # React 컴포넌트
├── lib/             # 유틸리티 및 라이브러리
├── hooks/           # React 커스텀 훅
└── docs/            # 프로젝트 문서
```

## 문서

프로젝트 관련 상세 문서는 `docs/` 폴더를 참고하세요:

- `docs/project-overview.md`: 프로젝트 개요 및 목표
- `docs/brainstorm.md`: 설계 결정사항 및 브레인스토밍
- `docs/data-relationship.md`: 데이터 모델 및 관계
- `docs/information-architecture.md`: UI 구조 및 사용자 플로우
- `docs/development-roadmap.md`: 개발 로드맵 및 진행 상황

## 데이터베이스 마이그레이션

Drizzle ORM을 사용하여 데이터베이스 스키마를 관리합니다:

```bash
# 스키마 변경 후 마이그레이션 파일 생성
npm run db:generate

# 마이그레이션 적용 (Supabase에 스키마 반영)
npm run db:push

# Drizzle Studio 실행 (데이터베이스 브라우저)
npm run db:studio
```

### 초기 마이그레이션 적용 방법

1. **기본 마이그레이션 적용**:

   ```bash
   npm run db:push
   ```

2. **Supabase Auth 연동 설정**:

   - Supabase Dashboard > SQL Editor에서 `lib/db/migrations/001_auth_foreign_key.sql` 실행

3. **RLS 정책 설정** (선택사항, 보안 강화):
   - Supabase Dashboard > SQL Editor에서 `lib/db/migrations/002_rls_policies.sql` 실행

## 개발 로드맵

현재 개발 진행 상황은 `docs/development-roadmap.md`를 참고하세요.

## Git 브랜치 관리

이 프로젝트는 **GitHub Flow** 기반의 브랜치 전략을 사용합니다.

### 주요 브랜치

- `main`: 프로덕션 배포 가능한 안정적인 코드
- `develop`: 개발 통합 브랜치 (기본 개발 브랜치)
- `feature/*`: 기능 개발 브랜치 (develop에서 분기)
- `fix/*`: 버그 수정 브랜치 (develop에서 분기)
- `hotfix/*`: 긴급 프로덕션 수정 브랜치 (main에서 분기)

### 브랜치 전략 상세

자세한 브랜치 관리 전략은 [`.github/BRANCH_STRATEGY.md`](.github/BRANCH_STRATEGY.md)를 참고하세요.

### 커밋 메시지 규칙

**Conventional Commits** 형식을 사용합니다:

```
<type>(<scope>): <subject>

예:
feat(auth): Supabase 인증 기능 추가
fix(budget): 예산 계산 오류 수정
docs(readme): README 업데이트
```

**타입**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
