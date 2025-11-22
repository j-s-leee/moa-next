# 수입 타입: 단일 거래 vs 반복 수입

## 개요

수입은 두 가지 방식으로 기록할 수 있습니다:

1. **단일 거래 (Single Transaction)**: 프리랜서, 자영업자 등 불규칙한 수입
2. **반복 수입 (Recurring Income)**: 급여, 용돈 등 정기적인 수입

## 데이터 모델

### 단일 거래
```typescript
{
  categoryId: string;
  amount: number;
  date: Date;              // 필수: 거래 날짜
  period: null;            // null
  startDate: null;         // null
  endDate: null;           // null
}
```

**사용 예시:**
- 프리랜서 프로젝트 수주: 2024-01-15, 500만원
- 자영업 매출: 2024-01-20, 200만원
- 부수입: 2024-01-25, 50만원

### 반복 수입
```typescript
{
  categoryId: string;
  amount: number;
  date: null;              // null
  period: "monthly" | "yearly";  // 필수: 반복 주기
  startDate: Date;         // 필수: 시작 날짜
  endDate: Date | null;    // 선택: 종료 날짜 (null이면 무기한)
}
```

**사용 예시:**
- 급여: 300만원/월, 2024-01-01 ~ 무기한
- 용돈: 10만원/월, 2024-01-01 ~ 2024-12-31
- 연봉: 5000만원/년, 2024-01-01 ~ 무기한

## API 사용법

### 단일 거래 추가
```json
POST /api/book/[bookId]/income
{
  "categoryId": "cat-123",
  "amount": 5000000,
  "date": "2024-01-15T00:00:00Z"
}
```

### 반복 수입 추가
```json
POST /api/book/[bookId]/income
{
  "categoryId": "cat-456",
  "amount": 3000000,
  "period": "monthly",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": null  // 무기한
}
```

## 검증 규칙

1. **단일 거래**: `date`는 필수, `period`와 `startDate`는 null이어야 함
2. **반복 수입**: `period`와 `startDate`는 필수, `date`는 null이어야 함
3. 두 타입을 동시에 사용할 수 없음

## 조회 시 필터링

기간 필터링 시:
- **단일 거래**: `date`가 기간 내에 있는지 확인
- **반복 수입**: `startDate` ~ `endDate`가 기간과 겹치는지 확인

## 정렬

- 단일 거래: `date` 기준 내림차순
- 반복 수입: `startDate` 기준 내림차순

## UI 통합

### 지출 탭
- 지출과 단일 거래 수입을 날짜별로 함께 표시
- 날짜별 그룹화 및 필터링 지원
- 수입/지출 필터링 및 정렬 지원

### 수입 탭
- 반복 수입(period가 있는 수입)만 별도로 표시
- 시작일 기준 정렬
- 기간 정보 표시 (월간/연간, 시작일~종료일)

