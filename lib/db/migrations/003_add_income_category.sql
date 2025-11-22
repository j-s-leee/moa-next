-- 수입 테이블에 categoryId 필드 추가
ALTER TABLE incomes
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- 기존 수입 데이터에 대한 처리
-- 수입 카테고리가 없는 경우를 대비해 임시로 처리
-- 실제로는 수입 카테고리를 먼저 생성해야 함

-- categoryId를 NOT NULL로 변경하기 전에 기존 데이터 처리
-- 기존 수입이 있다면 기본 수입 카테고리를 찾아서 연결
-- 없으면 에러가 발생할 수 있으므로 주의

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS incomes_category_id_idx ON incomes(category_id);

-- categoryId를 NOT NULL로 설정 (기존 데이터가 없는 경우에만 가능)
-- ALTER TABLE incomes ALTER COLUMN category_id SET NOT NULL;

