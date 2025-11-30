# 추가 도구 도입 검토

## 현재 상태 분석

### 이미 설치되어 있지만 미사용
- **Zod**: 설치되어 있으나 폼 검증에 사용하지 않음
- **date-fns**: 설치되어 있으나 luxon만 사용 중

### 부족한 부분
1. **폼 관리**: `useState`로 수동 관리, 검증 로직 반복
2. **코드 포맷팅**: Prettier 없음
3. **테스팅**: 테스트 코드 전무
4. **에러 처리**: React Error Boundary 없음
5. **전역 상태**: 각 컴포넌트에서 개별적으로 데이터 관리

---

## 추천 도입 도구

### 1. React Hook Form + Zod (최우선) ⭐⭐⭐⭐⭐

**현재 문제점**:
- 폼 상태를 `useState`로 수동 관리
- 검증 로직이 각 컴포넌트마다 반복됨
- 에러 메시지 표시가 일관되지 않음
- Zod가 설치되어 있으나 사용하지 않음

**도입 효과**:
- 폼 코드 50-70% 감소
- 타입 안전한 검증 (Zod 스키마)
- 자동 에러 메시지 표시
- 성능 최적화 (리렌더링 최소화)
- shadcn/ui와 완벽 호환

**도입 시점**: Phase 4.5 (TanStack Query와 함께) 또는 Phase 5 시작 전

**예상 작업 시간**: 4-6시간

**예시**:
```typescript
// 현재 (수동 검증)
const [amount, setAmount] = useState("");
const handleSave = async () => {
  if (!amount || Number(amount) <= 0) {
    toast.error("금액을 입력해주세요.");
    return;
  }
  // ...
};

// React Hook Form + Zod 사용 시
const form = useForm({
  resolver: zodResolver(expenseSchema),
  defaultValues: { amount: "", categoryId: null }
});
const onSubmit = form.handleSubmit(async (data) => {
  // data는 이미 검증됨
});
```

**우선순위**: 🔴 최우선

---

### 2. Prettier (코드 포맷팅) ⭐⭐⭐⭐

**현재 문제점**:
- 코드 포맷팅이 일관되지 않음
- 수동 포맷팅으로 인한 시간 낭비
- 코드 리뷰 시 포맷팅 이슈로 집중 분산

**도입 효과**:
- 일관된 코드 스타일
- 자동 포맷팅으로 개발 속도 향상
- Git 커밋 시 자동 포맷팅 (husky + lint-staged)

**도입 시점**: 언제든지 (즉시 도입 가능)

**예상 작업 시간**: 1-2시간

**설정**:
- `.prettierrc` 설정 파일
- `.prettierignore` 설정
- VS Code 설정 (format on save)
- package.json 스크립트 추가

**우선순위**: 🟡 중간 (즉시 도입 권장)

---

### 3. Zustand (전역 상태 관리) ⭐⭐⭐

**현재 문제점**:
- 각 컴포넌트에서 개별적으로 사용자 정보 fetch
- 현재 선택된 가계부 정보가 여러 컴포넌트에 중복
- 가계부 목록을 각 컴포넌트마다 중복 fetch
- 공동 가계부 개발 시 상태 동기화 필요

**도입 효과**:
- 사용자 정보, 현재 가계부 등 전역 상태 관리
- 여러 컴포넌트 간 상태 공유 간소화
- 가계부 목록 중복 fetch 문제 해결
- TanStack Query와 함께 사용 시 강력한 조합

**도입 시점**: Phase 5.5 또는 Phase 6 시작 전 (공동 가계부 개발 전 필수)

**예상 작업 시간**: 2-3시간

**사용 예시**:
```typescript
// 사용자 정보, 현재 가계부 등 전역 상태
const useBookStore = create((set) => ({
  currentBook: null,
  books: [],
  personalBooks: [],
  sharedBooks: [],
  setCurrentBook: (book) => set({ currentBook: book }),
  loadBooks: async () => {
    const books = await fetchBooks();
    set({ books });
  },
}));

const useUserStore = create((set) => ({
  user: null,
  partner: null,
  setUser: (user) => set({ user }),
  setPartner: (partner) => set({ partner }),
}));
```

**우선순위**: 🟡 중간 (Phase 6 시작 전 필수)

**참고 문서**: `docs/zustand-review.md` - 상세한 도입 시점 검토

---

### 4. React Error Boundary ⭐⭐⭐

**현재 문제점**:
- 에러 발생 시 전체 앱이 크래시됨
- 사용자에게 친화적인 에러 화면 없음
- 에러 복구 메커니즘 없음

**도입 효과**:
- 에러 격리 (일부 컴포넌트 에러가 전체 앱에 영향 없음)
- 사용자 친화적인 에러 화면
- 에러 복구 옵션 제공

**도입 시점**: Phase 5 시작 전

**예상 작업 시간**: 2-3시간

**구현**:
- `components/error-boundary.tsx` 생성
- `app/layout.tsx`에 ErrorBoundary 추가
- 에러 로깅 연동 (선택사항)

**우선순위**: 🟡 중간

---

### 5. Vitest + Testing Library (테스팅) ⭐⭐⭐

**현재 문제점**:
- 테스트 코드 전무
- 리팩토링 시 회귀 버그 위험
- 기능 추가 시 기존 기능 검증 어려움

**도입 효과**:
- 안정적인 리팩토링
- 회귀 버그 방지
- 문서화 효과 (테스트가 사용 예시)

**도입 시점**: Phase 5 이후 (기능 안정화 후)

**예상 작업 시간**: 4-6시간 (초기 설정 + 샘플 테스트)

**설정**:
- Vitest 설정
- Testing Library 설정
- 샘플 테스트 작성 (폼 검증, API 호출 등)

**우선순위**: 🟢 낮음 (나중에 도입)

---

### 6. @hookform/resolvers (Zod 통합) ⭐⭐⭐⭐

**현재 상태**: Zod는 설치되어 있으나 사용하지 않음

**도입 효과**:
- React Hook Form과 Zod 통합
- 타입 안전한 폼 검증
- 서버/클라이언트 검증 스키마 공유 가능

**도입 시점**: React Hook Form 도입 시 함께

**예상 작업 시간**: 포함됨 (React Hook Form 도입 시간에 포함)

**우선순위**: 🔴 최우선 (React Hook Form과 함께)

---

## 도입 우선순위 요약

### 즉시 도입 권장 (Phase 4.5 또는 Phase 5 전)

1. **React Hook Form + Zod + @hookform/resolvers** ⭐⭐⭐⭐⭐
   - 폼 관리 코드 대폭 감소
   - 타입 안전성 향상
   - 사용자 경험 개선
   - **예상 시간**: 4-6시간

2. **Prettier** ⭐⭐⭐⭐
   - 코드 일관성 향상
   - 개발 속도 향상
   - **예상 시간**: 1-2시간

3. **React Error Boundary** ⭐⭐⭐
   - 에러 처리 개선
   - 사용자 경험 개선
   - **예상 시간**: 2-3시간

### Phase 5.5 또는 Phase 6 전 도입 (공동 가계부 개발 전 필수)

4. **Zustand** ⭐⭐⭐
   - Phase 6 (공동 가계부) 개발 시 **반드시 필요**
   - 가계부 전환 기능 구현에 필수
   - 사용자/파트너 정보 관리에 필수
   - **예상 시간**: 2-3시간
   - **참고**: `docs/zustand-review.md` - 상세한 도입 시점 검토

5. **Vitest + Testing Library** ⭐⭐⭐
   - 기능 안정화 후
   - 리팩토링 안정성 확보
   - **예상 시간**: 4-6시간

---

## 도입 계획

### Phase 4.5.2: 폼 관리 도구 도입 (React Hook Form + Zod)

**작업 내용**:
- [ ] `react-hook-form` 설치
- [ ] `@hookform/resolvers` 설치
- [ ] Zod 스키마 정의 (`lib/validations/`)
  - [ ] 지출 폼 스키마
  - [ ] 수입 폼 스키마
  - [ ] 예산 폼 스키마
  - [ ] 카테고리 폼 스키마
- [ ] 기존 폼 컴포넌트 마이그레이션
  - [ ] `app/book/add/page.tsx` (지출/수입 폼)
  - [ ] `app/book/budget/add/page.tsx`
  - [ ] `app/book/category/add/page.tsx`
  - [ ] `app/settings/page.tsx` (프로필 폼)

**예상 작업 시간**: 4-6시간

**우선순위**: 🔴 최우선

---

### Phase 4.5.3: 개발 도구 설정

**작업 내용**:
- [ ] Prettier 설치 및 설정
- [ ] `.prettierrc` 설정
- [ ] `.prettierignore` 설정
- [ ] package.json 스크립트 추가 (`format`, `format:check`)
- [ ] VS Code 설정 (format on save)
- [ ] React Error Boundary 구현
- [ ] `components/error-boundary.tsx` 생성
- [ ] `app/layout.tsx`에 ErrorBoundary 추가

**예상 작업 시간**: 3-5시간

**우선순위**: 🟡 중간

---

## 예상 효과

### 개발 생산성
- 폼 코드 50-70% 감소
- 코드 포맷팅 자동화로 시간 절약
- 타입 안전성 향상으로 버그 감소

### 사용자 경험
- 폼 검증 즉시 피드백
- 에러 발생 시 친화적인 메시지
- 일관된 UI/UX

### 코드 품질
- 일관된 코드 스타일
- 타입 안전성 향상
- 유지보수성 향상

---

## 결론

**즉시 도입 권장**:
1. **React Hook Form + Zod** - 폼 관리 개선 (최우선)
2. **Prettier** - 코드 포맷팅 자동화
3. **React Error Boundary** - 에러 처리 개선

이 세 가지는 Phase 4.5 또는 Phase 5 시작 전에 도입하는 것을 강력히 추천합니다. 특히 React Hook Form은 현재 폼 코드가 많고 복잡하므로 도입 효과가 매우 큽니다.

**선택적 도입**:
- Zustand: 전역 상태 관리가 필요해질 때
- Vitest: 기능 안정화 후 테스트 코드 작성 시

