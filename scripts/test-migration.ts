/**
 * 마이그레이션 테스트 스크립트
 * 
 * 마이그레이션 후 year/month/day 컬럼이 제대로 추가되었는지 확인합니다.
 */

import { db } from '../lib/db';
import { expenses, budgets, incomes } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function testMigration() {
  console.log('🔍 마이그레이션 테스트 시작...\n');

  try {
    // 1. 컬럼 존재 확인
    console.log('1. 컬럼 존재 확인');
    const expensesColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'expenses'
      AND column_name IN ('year', 'month', 'day')
      ORDER BY column_name;
    `);
    console.log('   expenses 테이블:', expensesColumns.rows);

    const budgetsColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'budgets'
      AND column_name IN ('year', 'month')
      ORDER BY column_name;
    `);
    console.log('   budgets 테이블:', budgetsColumns.rows);

    const incomesColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'incomes'
      AND column_name IN ('year', 'month', 'day')
      ORDER BY column_name;
    `);
    console.log('   incomes 테이블:', incomesColumns.rows);

    // 2. 인덱스 존재 확인
    console.log('\n2. 인덱스 존재 확인');
    const indexes = await db.execute(sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE indexname LIKE '%year_month%'
      ORDER BY tablename, indexname;
    `);
    console.log('   인덱스:', indexes.rows);

    // 3. 데이터 샘플 확인 (expenses)
    console.log('\n3. 데이터 샘플 확인');
    const expenseSample = await db
      .select({
        id: expenses.id,
        date: expenses.date,
        year: expenses.year,
        month: expenses.month,
        day: expenses.day,
      })
      .from(expenses)
      .limit(5);
    console.log('   expenses 샘플:', expenseSample);

    // 4. 데이터 샘플 확인 (budgets)
    const budgetSample = await db
      .select({
        id: budgets.id,
        period: budgets.period,
        startDate: budgets.startDate,
        year: budgets.year,
        month: budgets.month,
      })
      .from(budgets)
      .limit(5);
    console.log('   budgets 샘플:', budgetSample);

    // 5. 데이터 샘플 확인 (incomes - 단일 거래만)
    const incomeSample = await db
      .select({
        id: incomes.id,
        date: incomes.date,
        year: incomes.year,
        month: incomes.month,
        day: incomes.day,
      })
      .from(incomes)
      .where(sql`${incomes.date} IS NOT NULL`)
      .limit(5);
    console.log('   incomes 샘플 (단일 거래):', incomeSample);

    // 6. 데이터 일관성 확인
    console.log('\n4. 데이터 일관성 확인');
    const inconsistentExpenses = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM expenses
      WHERE year IS NULL 
         OR month IS NULL 
         OR day IS NULL
         OR year != EXTRACT(YEAR FROM date)::smallint
         OR month != EXTRACT(MONTH FROM date)::smallint
         OR day != EXTRACT(DAY FROM date)::smallint;
    `);
    console.log('   expenses 불일치 데이터:', inconsistentExpenses.rows[0]);

    const inconsistentBudgets = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM budgets
      WHERE year IS NULL
         OR year != EXTRACT(YEAR FROM start_date)::smallint
         OR (period = 'monthly' AND month IS NULL)
         OR (period = 'monthly' AND month != EXTRACT(MONTH FROM start_date)::smallint)
         OR (period = 'yearly' AND month IS NOT NULL);
    `);
    console.log('   budgets 불일치 데이터:', inconsistentBudgets.rows[0]);

    console.log('\n✅ 마이그레이션 테스트 완료!');
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testMigration();

