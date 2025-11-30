# TanStack Query & Zustand 리팩토링 체크리스트

## 완료된 작업 ✅

### 1. 기본 설정
- [x] TanStack Query 설치 및 Provider 설정
- [x] Zustand 설치 및 Store 생성
- [x] QueryClient 기본 옵션 설정

### 2. Query/Mutation 훅 생성
- [x] `useBooks` - 가계부 목록 조회
- [x] `useUserProfile` - 사용자 프로필 조회
- [x] `useUpdateUserProfile` - 사용자 프로필 수정
- [x] `useExpenses` - 지출 목록 조회
- [x] `useExpense` - 단일 지출 조회 (추가)
- [x] `useIncomes` - 수입 목록 조회
- [x] `useIncome` - 단일 수입 조회 (추가)
- [x] `useBudgets` - 예산 목록 조회
- [x] `useBudgetSuggestions` - 예산 제안 조회 (추가)
- [x] `useCategories` - 카테고리 목록 조회
- [x] `useCategory` - 단일 카테고리 조회 (추가)
- [x] `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`
- [x] `useCreateIncome`, `useUpdateIncome`, `useDeleteIncome`
- [x] `useCreateBudget`, `useUpdateBudget`, `useDeleteBudget`
- [x] `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
- [x] `useReorderCategories` - 카테고리 순서 변경 (추가)

### 3. 컴포넌트 리팩토링 완료
- [x] `app/settings/page.tsx` - 사용자 프로필 쿼리/뮤테이션 적용
- [x] `app/book/page.tsx` - 가계부 목록, 지출/수입 쿼리 적용 완료
- [x] `app/book/budget/page.tsx` - 가계부 목록, 예산/지출 쿼리 적용 완료
- [x] `app/book/add/page.tsx` - 가계부 목록, 카테고리 쿼리, 뮤테이션 적용 완료
- [x] `app/book/edit/[id]/page.tsx` - 가계부 목록, 카테고리 쿼리, 단일 지출/수입 조회, 수정/삭제 뮤테이션 적용 완료
- [x] `app/book/budget/add/page.tsx` - 가계부 목록, 카테고리 쿼리, 예산 추가 뮤테이션 적용 완료
- [x] `app/book/budget/suggest/page.tsx` - 가계부 목록, 예산 제안 조회, 예산 추가/수정 뮤테이션 적용 완료
- [x] `app/book/category/add/page.tsx` - 카테고리 추가 뮤테이션 적용 완료
- [x] `app/book/[bookId]/category/page.tsx` - 카테고리 목록 조회, 삭제, 순서 변경 뮤테이션 적용 완료
- [x] `app/book/[bookId]/category/edit/[id]/page.tsx` - 카테고리 조회, 수정 뮤테이션 적용 완료

## 리팩토링 가능한 파일 목록

### 우선순위 높음 🔴

1. **app/book/page.tsx** ✅ 완료
   - [x] 가계부 목록 조회 → `useBooks` 적용
   - [x] 지출/수입 목록 조회 → `useExpenses`, `useIncomes` 적용
   - [x] 삭제 기능 → `useDeleteExpense`, `useDeleteIncome` 적용
   - [x] `DailyExpenseList` 컴포넌트 내부 삭제 로직 리팩토링 완료
   - [x] `IncomeList` 컴포넌트 내부 삭제 로직 리팩토링 완료
   - [x] `DateExpenseDrawer` 컴포넌트 내부 삭제 로직 리팩토링 완료
   - [x] 타입 정의 통합 (쿼리 훅에서 export한 타입 사용)

2. **app/book/budget/page.tsx** ✅ 완료
   - [x] 가계부 목록 조회 → `useBooks` 적용
   - [x] 예산 목록 조회 → `useBudgets` 적용
   - [x] 지출 목록 조회 → `useExpenses` 적용
   - [x] 예산 삭제 → `useDeleteBudget` 적용

3. **app/book/add/page.tsx** ✅ 완료
   - [x] 가계부 목록 조회 → `useBooks` 적용
   - [x] 카테고리 목록 조회 → `useCategories` 적용
   - [x] 지출 추가 → `useCreateExpense` 적용
   - [x] 수입 추가 → `useCreateIncome` 적용 (반복 수입 지원 타입 확장)

4. **app/book/edit/[id]/page.tsx** ✅ 완료
   - [x] 가계부 목록 조회 → `useBooks` 적용
   - [x] 카테고리 목록 조회 → `useCategories` 적용
   - [x] 지출/수입 조회 → `useExpense`, `useIncome` 적용 (단일 아이템 조회 훅 추가)
   - [x] 지출/수입 수정 → `useUpdateExpense`, `useUpdateIncome` 적용
   - [x] 지출/수입 삭제 → `useDeleteExpense`, `useDeleteIncome` 적용
   - [x] 타입 정의 통합 (쿼리 훅에서 export한 타입 사용)

### 우선순위 중간 🟡

5. **app/book/budget/add/page.tsx** ✅ 완료
   - [x] 가계부 목록 조회 → `useBooks` 적용
   - [x] 카테고리 목록 조회 → `useCategories` 적용
   - [x] 예산 추가 → `useCreateBudget` 적용

6. **app/book/budget/suggest/page.tsx** ✅ 완료
   - [x] 가계부 목록 조회 → `useBooks` 적용
   - [x] 예산 제안 조회 → `useBudgetSuggestions` 적용 (새로운 쿼리 훅 추가)
   - [x] 예산 추가/수정 → `useCreateBudget`, `useUpdateBudget` 적용
   - [x] 카테고리 타입 업데이트 → `useUpdateCategory` 적용

7. **app/book/category/add/page.tsx** ✅ 완료
   - [x] 카테고리 추가 → `useCreateCategory` 적용

8. **app/book/[bookId]/category/page.tsx** ✅ 완료
   - [x] 카테고리 목록 조회 → `useCategories` 적용
   - [x] 카테고리 삭제 → `useDeleteCategory` 적용
   - [x] 카테고리 순서 변경 → `useReorderCategories` 적용 (새로운 뮤테이션 훅 추가)

9. **app/book/[bookId]/category/edit/[id]/page.tsx** ✅ 완료
   - [x] 카테고리 조회 → `useCategory` 적용 (새로운 쿼리 훅 추가)
   - [x] 카테고리 수정 → `useUpdateCategory` 적용

## 리팩토링 패턴

### Before (기존 코드)
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch("/api/endpoint");
      const data = await response.json();
      setData(data);
    } catch (error) {
      toast.error("에러 발생");
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependencies]);
```

### After (TanStack Query)
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["key", dependencies],
  queryFn: async () => {
    const response = await fetch("/api/endpoint");
    return response.json();
  },
});
```

### Before (Mutation)
```typescript
const handleSubmit = async (data) => {
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error();
    toast.success("성공");
    // 수동으로 데이터 다시 로드
    fetchData();
  } catch (error) {
    toast.error("에러");
  }
};
```

### After (TanStack Query Mutation)
```typescript
const mutation = useCreateData();

const handleSubmit = (data) => {
  mutation.mutate(data);
  // 자동으로 쿼리 무효화 및 재조회
};
```

## 추가 개선 사항

### 1. 가계부 Store 활용
- 현재 선택된 가계부를 Zustand Store에서 관리
- 여러 컴포넌트에서 공유되는 가계부 정보는 Store 사용

### 2. 에러 처리 개선
- Query/Mutation 훅에서 일관된 에러 처리
- 에러 타입별 메시지 분기 처리

### 3. 낙관적 업데이트 (Optimistic Updates)
- 삭제/수정 시 즉시 UI 업데이트
- 서버 응답 후 실제 데이터로 교체

### 4. 쿼리 키 관리
- 쿼리 키를 상수로 관리하여 타입 안정성 향상
- 쿼리 키 팩토리 함수 생성

## 참고사항

- 모든 리팩토링은 기존 기능을 유지하면서 진행
- 테스트를 통해 리팩토링 후 동작 확인 필요
- 점진적으로 리팩토링 진행 (한 번에 모든 파일 변경하지 않기)

