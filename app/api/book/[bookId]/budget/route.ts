import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { budgets, books, categories, expenses } from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { parseDateStringToDate, isValidDateString, getMonthRange, getYearRange, formatDateTimeToString, formatDateToString, normalizeDateString } from '@/lib/utils/date'

/**
 * 예산 목록 조회 API
 * GET /api/book/[bookId]/budget?period=monthly|yearly&year=YYYY&month=MM
 * 
 * 특정 가계부의 예산 목록을 조회합니다.
 * period, year, month 쿼리 파라미터로 필터링 가능합니다.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 현재 사용자 세션 확인
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      )
    }

    const { bookId } = await params

    // 가계부 소유권 확인
    const [book] = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.id, bookId),
          eq(books.ownerId, authUser.id)
        )
      )
      .limit(1)

    if (!book) {
      return NextResponse.json(
        { error: '가계부를 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') as 'monthly' | 'yearly' | null
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')

    // 예산 조회 조건 구성
    const whereConditions = [eq(budgets.bookId, bookId)]

    if (periodParam === 'monthly' || periodParam === 'yearly') {
      whereConditions.push(eq(budgets.period, periodParam))
    }

    // 기간 필터링: 특정 년/월에 적용되는 예산 찾기
    if (yearParam) {
      const year = parseInt(yearParam, 10)
      if (!isNaN(year)) {
        if (monthParam) {
          // 월간 필터링: 해당 월의 1일 ~ 마지막일
          const month = parseInt(monthParam, 10)
          if (!isNaN(month) && month >= 1 && month <= 12) {
            const { start: startOfMonth, end: endOfMonth } = getMonthRange(year, month)
            
            // 예산의 startDate <= 월의 마지막일 AND 예산의 endDate >= 월의 1일
            // PgDateString은 string 타입이므로 문자열로 변환
            whereConditions.push(lte(budgets.startDate, formatDateTimeToString(endOfMonth)))
            whereConditions.push(gte(budgets.endDate, formatDateTimeToString(startOfMonth)))
          }
        } else {
          // 연간 필터링: 해당 년의 1월 1일 ~ 12월 31일
          const { start: startOfYear, end: endOfYear } = getYearRange(year)
          
          // 예산의 startDate <= 년의 마지막일 AND 예산의 endDate >= 년의 1일
          // PgDateString은 string 타입이므로 문자열로 변환
          whereConditions.push(lte(budgets.startDate, formatDateTimeToString(endOfYear)))
          whereConditions.push(gte(budgets.endDate, formatDateTimeToString(startOfYear)))
        }
      }
    }

    // 예산 목록 조회 (카테고리 정보 포함)
    const budgetList = await db
      .select({
        id: budgets.id,
        bookId: budgets.bookId,
        categoryId: budgets.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          type: categories.type,
          expenseType: categories.expenseType,
        },
        period: budgets.period,
        amount: budgets.amount,
        startDate: budgets.startDate,
        endDate: budgets.endDate,
        previousBudgetId: budgets.previousBudgetId,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(budgets.createdAt)

    return NextResponse.json({
      budgets: budgetList,
    })
  } catch (error) {
    console.error('예산 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '예산 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 예산 생성 API
 * POST /api/book/[bookId]/budget
 * 
 * 새로운 예산을 생성합니다.
 * 
 * 요청 본문:
 * {
 *   categoryId: string,
 *   period: 'monthly' | 'yearly',
 *   amount: number,
 *   startDate: string (ISO date),
 *   endDate: string (ISO date) - 반복 예산의 경우 미래 날짜 (예: 2099-12-31)
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 현재 사용자 세션 확인
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      )
    }

    const { bookId } = await params

    // 가계부 소유권 확인
    const [book] = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.id, bookId),
          eq(books.ownerId, authUser.id)
        )
      )
      .limit(1)

    if (!book) {
      return NextResponse.json(
        { error: '가계부를 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { categoryId, period, amount, startDate, endDate } = body

    // 유효성 검사
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { error: '카테고리는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!period || (period !== 'monthly' && period !== 'yearly')) {
      return NextResponse.json(
        { error: '예산 기간은 monthly 또는 yearly여야 합니다.' },
        { status: 400 }
      )
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: '금액은 0보다 큰 숫자여야 합니다.' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: '시작일은 필수입니다.' },
        { status: 400 }
      )
    }

    if (!endDate) {
      return NextResponse.json(
        { error: '종료일은 필수입니다.' },
        { status: 400 }
      )
    }

    let start: Date
    let end: Date

    try {
      if (typeof startDate !== 'string') {
        return NextResponse.json(
          { error: '시작일은 문자열 형식이어야 합니다.' },
          { status: 400 }
        )
      }
      // ISO 형식 또는 YYYY-MM-DD 형식을 YYYY-MM-DD로 정규화
      const normalizedStartDate = normalizeDateString(startDate)
      if (!isValidDateString(normalizedStartDate)) {
        return NextResponse.json(
          { error: '시작일은 YYYY-MM-DD 형식이어야 합니다.' },
          { status: 400 }
        )
      }
      start = parseDateStringToDate(normalizedStartDate)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '잘못된 시작일 형식입니다.' },
        { status: 400 }
      )
    }

    try {
      if (typeof endDate !== 'string') {
        return NextResponse.json(
          { error: '종료일은 문자열 형식이어야 합니다.' },
          { status: 400 }
        )
      }
      // ISO 형식 또는 YYYY-MM-DD 형식을 YYYY-MM-DD로 정규화
      const normalizedEndDate = normalizeDateString(endDate)
      if (!isValidDateString(normalizedEndDate)) {
        return NextResponse.json(
          { error: '종료일은 YYYY-MM-DD 형식이어야 합니다.' },
          { status: 400 }
        )
      }
      end = parseDateStringToDate(normalizedEndDate)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '잘못된 종료일 형식입니다.' },
        { status: 400 }
      )
    }

    if (start > end) {
      return NextResponse.json(
        { error: '시작일은 종료일보다 이전이어야 합니다.' },
        { status: 400 }
      )
    }

    // 카테고리 확인 (해당 가계부에 속하는지)
    const [category] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.bookId, bookId),
          eq(categories.type, 'expense') // 지출 카테고리만 허용
        )
      )
      .limit(1)

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없거나 해당 가계부에 속하지 않습니다.' },
        { status: 404 }
      )
    }

    // 같은 가계부의 같은 카테고리에 대해 중복 기간 예산 확인
    // 기간이 겹치는 예산이 있는지 확인
    // PgDateString은 string 타입이므로 Date를 문자열로 변환
    const overlappingBudgets = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.bookId, bookId),
          eq(budgets.categoryId, categoryId),
          eq(budgets.period, period),
          // 기간이 겹치는 경우: (startDate <= end AND endDate >= start)
          lte(budgets.startDate, formatDateToString(end)),
          gte(budgets.endDate, formatDateToString(start))
        )
      )
      .limit(1)

    if (overlappingBudgets.length > 0) {
      return NextResponse.json(
        { error: '해당 기간에 이미 예산이 설정되어 있습니다.' },
        { status: 400 }
      )
    }

    // 예산 생성
    // PgDateString은 string 타입이므로 Date를 문자열로 변환
    const [newBudget] = await db
      .insert(budgets)
      .values({
        bookId,
        categoryId,
        period,
        amount: Math.round(amount), // 소수점 제거
        startDate: formatDateToString(start),
        endDate: formatDateToString(end),
        updatedAt: new Date(),
      })
      .returning({
        id: budgets.id,
        bookId: budgets.bookId,
        categoryId: budgets.categoryId,
        period: budgets.period,
        amount: budgets.amount,
        startDate: budgets.startDate,
        endDate: budgets.endDate,
        previousBudgetId: budgets.previousBudgetId,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
      })

    if (!newBudget) {
      return NextResponse.json(
        { error: '예산 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 카테고리 정보 포함하여 반환
    return NextResponse.json(
      {
        ...newBudget,
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          type: category.type,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('예산 생성 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '예산 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

