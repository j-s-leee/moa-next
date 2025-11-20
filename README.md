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

`.env.local` 파일을 생성하고 Supabase 연결 정보를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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

## 개발 로드맵

현재 개발 진행 상황은 `docs/development-roadmap.md`를 참고하세요.

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
