# Drizzle 스키마 관리 가이드

초기 개발 단계에서 스키마 변경이 빈번하게 발생하는 상황을 고려한 Drizzle 마이그레이션 관리 가이드입니다.

## 목차

1. [기본 워크플로우](#기본-워크플로우)
2. [상황별 가이드](#상황별-가이드)
3. [문제 해결](#문제-해결)
4. [프로덕션 배포 전 체크리스트](#프로덕션-배포-전-체크리스트)

---

## 기본 워크플로우

### 1. 스키마 변경

`lib/db/schema.ts` 파일을 수정합니다.

```typescript
// 예: 새로운 컬럼 추가
export const expenses = pgTable("expenses", {
  // ... 기존 컬럼들
  newField: text("new_field"), // 새 컬럼 추가
});
```

### 2. 마이그레이션 생성

```bash
npm run db:generate
```

이 명령어는:

- 현재 스키마와 데이터베이스 상태를 비교
- 변경사항을 감지하여 `drizzle/` 폴더에 마이그레이션 파일 생성
- `drizzle/meta/_journal.json`에 마이그레이션 기록 추가

### 3. 마이그레이션 적용

#### 개발 환경 (로컬)

```bash
# 방법 1: Push (빠른 프로토타이핑, 권장)
npm run db:push

# 방법 2: 마이그레이션 파일 직접 실행
# Supabase SQL Editor에서 drizzle/XXXX_*.sql 파일 실행
```

#### 프로덕션 환경

```bash
# 마이그레이션 파일을 Supabase SQL Editor에서 실행
# 또는 CI/CD 파이프라인에서 자동 실행
```

---

## 상황별 가이드

### 상황 1: 초기 개발 단계 - 스키마 변경이 빈번한 경우

**문제**: 스키마를 자주 변경하면서 마이그레이션 파일이 많아지고, 충돌이 발생할 수 있습니다.

**해결 방법**:

#### 옵션 A: `db:push` 사용 (권장)

```bash
# 스키마 변경 후 바로 적용
npm run db:push
```

**장점**:

- 빠르고 간단함
- 마이그레이션 파일 관리 불필요
- 초기 개발 단계에 적합

**단점**:

- 마이그레이션 히스토리 관리 어려움
- 프로덕션에서는 사용 불가

**사용 시기**:

- 로컬 개발 환경
- 프로토타이핑 단계
- 데이터 손실이 문제되지 않는 경우

#### 옵션 B: 마이그레이션 파일 관리

```bash
# 1. 스키마 변경
# 2. 마이그레이션 생성
npm run db:generate

# 3. 생성된 마이그레이션 파일 확인
# drizzle/XXXX_*.sql 파일 검토

# 4. 적용
npm run db:push
# 또는 Supabase SQL Editor에서 실행
```

**장점**:

- 변경 이력 추적 가능
- 프로덕션 배포 준비됨
- 롤백 가능

**단점**:

- 파일 관리 필요
- 초기 개발 단계에서는 번거로울 수 있음

---

### 상황 2: 마이그레이션 파일이 생성되지 않는 경우

**원인**:

- 스키마 변경사항이 없음
- Drizzle이 변경사항을 감지하지 못함

**해결 방법**:

1. **스키마 파일 확인**

   ```bash
   # 스키마 파일이 올바르게 수정되었는지 확인
   cat lib/db/schema.ts
   ```

2. **Drizzle 캐시 초기화**

   ```bash
   # meta 폴더의 snapshot 파일 확인
   # 필요시 삭제 후 재생성 (주의: 데이터 손실 가능)
   ```

3. **수동으로 마이그레이션 생성**

   ```bash
   # 강제로 마이그레이션 생성
   npm run db:generate
   ```

4. **데이터베이스와 스키마 동기화 확인**
   ```bash
   # 현재 데이터베이스 상태 확인
   npm run db:studio
   ```

---

### 상황 3: 마이그레이션 적용 실패

**원인**:

- 데이터베이스와 스키마 불일치
- 제약조건 위반
- 외래키 참조 오류

**해결 방법**:

#### 1. 에러 메시지 확인

```bash
npm run db:push
# 에러 메시지를 자세히 확인
```

#### 2. 데이터베이스 상태 확인

```bash
# Drizzle Studio로 현재 상태 확인
npm run db:studio
```

#### 3. 수동으로 마이그레이션 수정

생성된 마이그레이션 파일을 수정하여 안전하게 적용:

```sql
-- 예: 컬럼 추가 시 기존 데이터 처리
ALTER TABLE "expenses" ADD COLUMN "new_field" text DEFAULT 'default_value';

-- 또는 조건부 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'new_field'
  ) THEN
    ALTER TABLE "expenses" ADD COLUMN "new_field" text;
  END IF;
END $$;
```

#### 4. 데이터베이스 리셋 (개발 환경만)

⚠️ **주의**: 모든 데이터가 삭제됩니다!

```bash
# Supabase Dashboard에서 테이블 삭제
# 또는 SQL로 모든 테이블 삭제 후 재생성
```

---

### 상황 4: 마이그레이션 파일 충돌

**원인**:

- 여러 브랜치에서 동시에 스키마 변경
- 마이그레이션 파일 순서 충돌

**해결 방법**:

#### 1. 충돌 확인

```bash
# 두 브랜치의 마이그레이션 파일 비교
git diff branch1 branch2 -- drizzle/
```

#### 2. 마이그레이션 병합

```bash
# 1. 두 브랜치의 스키마 변경사항 확인
# 2. schema.ts 파일 병합
# 3. 새로운 마이그레이션 생성
npm run db:generate

# 4. 생성된 마이그레이션 파일 검토
# 5. 충돌하는 마이그레이션 파일 삭제
```

#### 3. 수동 병합

```bash
# 1. 두 브랜치의 스키마 변경사항을 모두 반영
# 2. 기존 마이그레이션 파일 삭제
rm drizzle/XXXX_*.sql

# 3. 새로운 마이그레이션 생성
npm run db:generate

# 4. _journal.json 확인
cat drizzle/meta/_journal.json
```

---

### 상황 5: Enum 타입 변경

**문제**: Enum 타입은 변경이 까다롭습니다.

**해결 방법**:

#### 1. Enum 값 추가

```sql
-- 기존 enum에 값 추가
ALTER TYPE "expense_type" ADD VALUE IF NOT EXISTS 'new_value';
```

#### 2. Enum 값 제거

⚠️ **주의**: 사용 중인 값은 제거할 수 없습니다!

```sql
-- 1. 먼저 해당 값을 사용하는 데이터 확인
SELECT * FROM expenses WHERE expense_type = 'old_value';

-- 2. 데이터 마이그레이션 (다른 값으로 변경)
UPDATE expenses SET expense_type = 'new_value' WHERE expense_type = 'old_value';

-- 3. Enum 재생성 (복잡함, 주의 필요)
-- 기존 enum 삭제 후 재생성 (모든 참조 제거 필요)
```

#### 3. Enum 이름 변경

```sql
-- 1. 새 enum 생성
CREATE TYPE "new_expense_type" AS ENUM('value1', 'value2');

-- 2. 컬럼 타입 변경
ALTER TABLE "expenses" ALTER COLUMN "expense_type" TYPE "new_expense_type"
USING "expense_type"::text::"new_expense_type";

-- 3. 기존 enum 삭제
DROP TYPE "expense_type";

-- 4. 새 enum 이름 변경
ALTER TYPE "new_expense_type" RENAME TO "expense_type";
```

---

### 상황 6: 외래키 제약조건 추가/제거

**문제**: Supabase Auth와 연동된 외래키는 Drizzle이 자동 생성하지 않을 수 있습니다.

**해결 방법**:

#### 1. 수동으로 외래키 추가

```sql
-- users 테이블이 auth.users를 참조하도록 설정
ALTER TABLE users
ADD CONSTRAINT users_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

#### 2. 마이그레이션 파일에 포함

`lib/db/migrations/` 폴더에 수동 마이그레이션 파일 생성:

```sql
-- lib/db/migrations/001_auth_foreign_key.sql
ALTER TABLE users
ADD CONSTRAINT users_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

### 상황 7: 컬럼 타입 변경

**문제**: 기존 데이터가 있는 경우 타입 변경이 실패할 수 있습니다.

**해결 방법**:

#### 1. 안전한 타입 변경

```sql
-- text -> integer (예시)
-- 1. 새 컬럼 추가
ALTER TABLE "expenses" ADD COLUMN "amount_new" integer;

-- 2. 데이터 마이그레이션
UPDATE "expenses" SET "amount_new" = CAST("amount" AS integer) WHERE "amount" IS NOT NULL;

-- 3. 기존 컬럼 삭제
ALTER TABLE "expenses" DROP COLUMN "amount";

-- 4. 새 컬럼 이름 변경
ALTER TABLE "expenses" RENAME COLUMN "amount_new" TO "amount";
```

#### 2. 조건부 타입 변경

```sql
DO $$
BEGIN
  -- 타입 변경 시도
  ALTER TABLE "expenses" ALTER COLUMN "amount" TYPE integer USING amount::integer;
EXCEPTION WHEN OTHERS THEN
  -- 실패 시 로그 출력
  RAISE NOTICE 'Type conversion failed: %', SQLERRM;
END $$;
```

---

## 문제 해결

### 문제 1: "relation already exists" 에러

**원인**: 테이블이 이미 존재함

**해결**:

```sql
-- 조건부 생성 사용
CREATE TABLE IF NOT EXISTS "expenses" (...);
```

또는 마이그레이션 파일에서:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'expenses') THEN
    CREATE TABLE "expenses" (...);
  END IF;
END $$;
```

---

### 문제 2: "column already exists" 에러

**원인**: 컬럼이 이미 존재함

**해결**:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'new_field'
  ) THEN
    ALTER TABLE "expenses" ADD COLUMN "new_field" text;
  END IF;
END $$;
```

---

### 문제 3: "constraint already exists" 에러

**원인**: 제약조건이 이미 존재함

**해결**:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'constraint_name'
  ) THEN
    ALTER TABLE "expenses" ADD CONSTRAINT "constraint_name" ...;
  END IF;
END $$;
```

---

### 문제 4: "index already exists" 에러

**원인**: 인덱스가 이미 존재함

**해결**:

```sql
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses" USING btree ("date");
```

---

### 문제 5: 마이그레이션 파일이 너무 많아짐

**해결**:

#### 옵션 A: 초기 마이그레이션으로 통합 (개발 환경)

```bash
# 1. 현재 데이터베이스 상태 확인
npm run db:studio

# 2. 모든 마이그레이션 파일 삭제
rm drizzle/*.sql

# 3. 스키마에서 현재 상태로 마이그레이션 재생성
npm run db:generate

# 4. _journal.json 초기화 (주의: 데이터 손실 가능)
# 수동으로 첫 번째 마이그레이션만 남기고 나머지 삭제
```

#### 옵션 B: Squash 마이그레이션 (프로덕션 준비)

```bash
# 1. 현재 스키마 상태로 새로운 초기 마이그레이션 생성
# 2. 기존 마이그레이션 파일들을 하나로 통합
# 3. _journal.json 업데이트
```

---

## 프로덕션 배포 전 체크리스트

### 1. 마이그레이션 파일 검토

- [ ] 모든 마이그레이션 파일이 올바르게 생성되었는지 확인
- [ ] 마이그레이션 파일에 에러가 없는지 확인
- [ ] 조건부 실행 로직이 적절한지 확인 (IF NOT EXISTS 등)

### 2. 데이터 안전성 확인

- [ ] 데이터 손실 가능성이 있는 변경사항 확인
- [ ] 기존 데이터 마이그레이션 로직 포함 여부 확인
- [ ] 기본값 설정이 적절한지 확인

### 3. 제약조건 확인

- [ ] 외래키 제약조건이 올바르게 설정되었는지 확인
- [ ] NOT NULL 제약조건이 기존 데이터와 충돌하지 않는지 확인
- [ ] UNIQUE 제약조건이 기존 데이터와 충돌하지 않는지 확인

### 4. 인덱스 확인

- [ ] 필요한 인덱스가 모두 생성되었는지 확인
- [ ] 중복 인덱스가 없는지 확인
- [ ] 인덱스 성능에 영향을 주지 않는지 확인

### 5. 테스트

- [ ] 로컬 환경에서 마이그레이션 테스트
- [ ] 스테이징 환경에서 마이그레이션 테스트
- [ ] 롤백 계획 수립

### 6. 문서화

- [ ] 마이그레이션 변경사항 문서화
- [ ] 팀원에게 변경사항 공유
- [ ] 배포 계획 수립

---

## 유용한 명령어

### Drizzle Studio 실행

```bash
npm run db:studio
```

데이터베이스 상태를 시각적으로 확인할 수 있습니다.

### 마이그레이션 생성

```bash
npm run db:generate
```

### 마이그레이션 적용 (Push)

```bash
npm run db:push
```

### 마이그레이션 적용 (Migrate)

```bash
npm run db:migrate
```

---

## 참고 자료

- [Drizzle ORM 공식 문서](https://orm.drizzle.team/)
- [Drizzle Kit 문서](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL 마이그레이션 가이드](https://www.postgresql.org/docs/current/ddl-alter.html)

---

## 자주 묻는 질문 (FAQ)

### Q: 개발 중에 마이그레이션 파일을 삭제해도 되나요?

**A**: 개발 환경에서는 가능하지만, 프로덕션 배포 전에는 마이그레이션 히스토리를 유지하는 것이 좋습니다.

### Q: `db:push`와 `db:migrate`의 차이는?

**A**:

- `db:push`: 스키마를 직접 데이터베이스에 푸시 (개발 환경용)
- `db:migrate`: 마이그레이션 파일을 순차적으로 실행 (프로덕션용)

### Q: 마이그레이션 파일을 수정해도 되나요?

**A**: 아직 적용하지 않은 마이그레이션 파일은 수정 가능합니다. 이미 적용된 마이그레이션은 수정하지 마세요.

### Q: 스키마 변경 후 코드도 수정해야 하나요?

**A**: 네, 스키마 변경 후 TypeScript 타입이 자동으로 업데이트되므로 코드에서 타입 에러가 발생할 수 있습니다. 관련 코드를 함께 수정해야 합니다.

---

## 문제 발생 시 연락처

문제가 해결되지 않으면:

1. 에러 메시지를 자세히 확인
2. Drizzle 공식 문서 확인
3. 팀원과 상의
