-- Supabase Auth 연동: users 테이블이 auth.users를 참조하도록 설정
-- 이 파일은 마이그레이션 후 수동으로 실행해야 합니다.

-- users 테이블이 auth.users를 참조하도록 외래키 제약 추가
ALTER TABLE users
ADD CONSTRAINT users_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- budgets 테이블의 self-reference 외래키 추가 (예산 이력 관리)
ALTER TABLE budgets
ADD CONSTRAINT budgets_previous_budget_id_fkey
FOREIGN KEY (previous_budget_id) REFERENCES budgets(id) ON DELETE SET NULL;

