# 데이터베이스 마이그레이션

## 마이그레이션 생성

```bash
npm run db:generate
```

이 명령어는 `drizzle/` 폴더에 마이그레이션 파일을 생성합니다.

## 마이그레이션 적용

### 방법 1: Drizzle Push (개발 환경, 빠른 프로토타이핑)

```bash
npm run db:push
```

⚠️ 주의: 이 방법은 스키마를 직접 데이터베이스에 푸시하므로 프로덕션에서는 사용하지 마세요.

### 방법 2: 마이그레이션 파일 실행 (프로덕션 권장)

1. 생성된 마이그레이션 파일을 확인
2. Supabase SQL Editor에서 실행하거나
3. Drizzle Kit의 migrate 명령어 사용

## Supabase Auth 연동

`users` 테이블의 `id`는 `auth.users.id`를 참조합니다.

마이그레이션 후 다음 SQL을 실행하여 외래키 제약을 추가하세요:

```sql
-- users 테이블이 auth.users를 참조하도록 설정
ALTER TABLE users
ADD CONSTRAINT users_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## 초기 데이터

마이그레이션 후 기본 카테고리 시드 데이터를 추가할 수 있습니다.
(Phase 1.2에서 구현 예정)

