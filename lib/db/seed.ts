/**
 * 데이터베이스 시드 데이터 스크립트
 * 
 * 사용법:
 *   npx tsx lib/db/seed.ts
 * 
 * 또는 package.json에 스크립트 추가 후:
 *   npm run db:seed
 */

import { db } from './index'
import { categories, books, users } from './schema'

/**
 * 기본 카테고리 데이터
 * 회원가입 시 개인 가계부에 자동으로 생성될 기본 카테고리들
 */
const defaultExpenseCategories = [
  { name: '식비', icon: '🍽️', order: 1 },
  { name: '교통비', icon: '🚗', order: 2 },
  { name: '주거비', icon: '🏠', order: 3 },
  { name: '통신비', icon: '📱', order: 4 },
  { name: '의료비', icon: '🏥', order: 5 },
  { name: '교육비', icon: '📚', order: 6 },
  { name: '의류비', icon: '👕', order: 7 },
  { name: '문화생활', icon: '🎬', order: 8 },
  { name: '취미', icon: '🎨', order: 9 },
  { name: '선물', icon: '🎁', order: 10 },
  { name: '기타', icon: '📦', order: 11 },
]

const defaultIncomeCategories = [
  { name: '급여', icon: '💰', order: 1 },
  { name: '부수입', icon: '💵', order: 2 },
  { name: '용돈', icon: '💴', order: 3 },
  { name: '기타', icon: '💶', order: 4 },
]

/**
 * 특정 가계부에 기본 카테고리 생성
 */
export async function seedDefaultCategories(bookId: string) {
  console.log(`📦 가계부 ${bookId}에 기본 카테고리 생성 중...`)

  // 지출 카테고리 생성
  const expenseCategoryData = defaultExpenseCategories.map((cat) => ({
    bookId,
    name: cat.name,
    icon: cat.icon,
    type: 'expense' as const,
    order: cat.order,
  }))

  await db.insert(categories).values(expenseCategoryData)
  console.log(`✅ ${expenseCategoryData.length}개의 지출 카테고리 생성 완료`)

  // 수입 카테고리 생성
  const incomeCategoryData = defaultIncomeCategories.map((cat) => ({
    bookId,
    name: cat.name,
    icon: cat.icon,
    type: 'income' as const,
    order: cat.order,
  }))

  await db.insert(categories).values(incomeCategoryData)
  console.log(`✅ ${incomeCategoryData.length}개의 수입 카테고리 생성 완료`)

  return {
    expenseCount: expenseCategoryData.length,
    incomeCount: incomeCategoryData.length,
  }
}

/**
 * 사용자 프로필 생성 (회원가입 시 호출)
 * Supabase Auth와 연동되어 있어야 함
 */
export async function seedUserProfile(userId: string, email: string, name?: string) {
  console.log(`👤 사용자 프로필 생성 중: ${email}`)

  await db.insert(users).values({
    id: userId,
    email,
    name: name || null,
  })

  console.log(`✅ 사용자 프로필 생성 완료`)
}

/**
 * 개인 가계부 생성 (회원가입 시 호출)
 */
export async function seedPersonalBook(userId: string, userName?: string) {
  console.log(`📖 개인 가계부 생성 중: ${userId}`)

  // 개인 가계부 생성
  const [book] = await db
    .insert(books)
    .values({
      name: userName ? `${userName}의 가계부` : '내 가계부',
      type: 'personal',
      ownerId: userId,
    })
    .returning()

  if (!book) {
    throw new Error('가계부 생성 실패')
  }

  console.log(`✅ 개인 가계부 생성 완료: ${book.id}`)

  // 기본 카테고리 생성
  await seedDefaultCategories(book.id)

  return book
}

/**
 * 테스트용 사용자 및 가계부 생성
 */
export async function seedTestData() {
  console.log('🧪 테스트 데이터 생성 시작...')

  // 테스트 사용자 ID (실제로는 Supabase Auth에서 생성된 ID를 사용해야 함)
  const testUserId = '00000000-0000-0000-0000-000000000000'
  const testUserEmail = 'test@example.com'

  try {
    // 사용자 프로필 생성
    await seedUserProfile(testUserId, testUserEmail, '테스트 사용자')

    // 개인 가계부 생성
    const book = await seedPersonalBook(testUserId, '테스트 사용자')

    console.log('✅ 테스트 데이터 생성 완료')
    console.log(`   - 사용자 ID: ${testUserId}`)
    console.log(`   - 가계부 ID: ${book.id}`)

    return { userId: testUserId, bookId: book.id }
  } catch (error) {
    console.error('❌ 테스트 데이터 생성 실패:', error)
    throw error
  }
}

// 스크립트로 직접 실행 시
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('✅ 시드 데이터 생성 완료')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 시드 데이터 생성 실패:', error)
      process.exit(1)
    })
}

