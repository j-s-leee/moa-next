import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { budgets, books, categories, expenses } from '@/lib/db/schema'
import { eq, and, lte, gte, ne } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { parseDateStringToDate, isValidDateString, normalizeDateString, formatDateToString } from '@/lib/utils/date'

/**
 * 예산 수정 API
 * PUT /api/book/[bookId]/budget/[id]
 * 
 * 예산을 수정합니다.
 * 예산 수정 시 이전 예산을 previousBudgetId로 연결하여 이력을 관리합니다.
 * 
 * 요청 본문:
 * {
 *   amount?: number,
 *   startDate?: string (ISO date),
 *   endDate?: string (ISO date)
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ bookId: string; id: string }> }
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

    const { bookId, id } = await params

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

    // 기존 예산 확인
    const [existingBudget] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.bookId, bookId)
        )
      )
      .limit(1)

    if (!existingBudget) {
      return NextResponse.json(
        { error: '예산을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { amount, startDate, endDate } = body

    // 업데이트할 필드 구성
    // PgDateString은 string 타입이므로 문자열로 저장
    const updateData: {
      amount?: number
      startDate?: string
      endDate?: string
      previousBudgetId?: string
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    // 금액 수정
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { error: '금액은 0보다 큰 숫자여야 합니다.' },
          { status: 400 }
        )
      }
      updateData.amount = Math.round(amount)
    }

    // 날짜 수정
    // existingBudget의 날짜는 문자열이므로 그대로 사용
    let newStartDateStr = existingBudget.startDate
    let newEndDateStr = existingBudget.endDate
    let newStartDate: Date | null = null
    let newEndDate: Date | null = null

    if (startDate) {
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
        newStartDate = parseDateStringToDate(normalizedStartDate)
        newStartDateStr = normalizedStartDate
        updateData.startDate = normalizedStartDate
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : '잘못된 시작일 형식입니다.' },
          { status: 400 }
        )
      }
    } else {
      // 기존 날짜를 Date 객체로 변환 (비교용)
      newStartDate = parseDateStringToDate(existingBudget.startDate)
    }

    if (endDate) {
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
        newEndDate = parseDateStringToDate(normalizedEndDate)
        newEndDateStr = normalizedEndDate
        updateData.endDate = normalizedEndDate
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : '잘못된 종료일 형식입니다.' },
          { status: 400 }
        )
      }
    } else {
      // 기존 날짜를 Date 객체로 변환 (비교용)
      newEndDate = parseDateStringToDate(existingBudget.endDate)
    }

    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      return NextResponse.json(
        { error: '시작일은 종료일보다 이전이어야 합니다.' },
        { status: 400 }
      )
    }

    // 기간이 변경된 경우 중복 확인
    if (startDate || endDate) {
      const overlappingBudgets = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.bookId, bookId),
            eq(budgets.categoryId, existingBudget.categoryId),
            eq(budgets.period, existingBudget.period),
            // 자기 자신은 제외
            ne(budgets.id, id),
            // 기간이 겹치는 경우: PgDateString은 string 타입이므로 문자열로 비교
            lte(budgets.startDate, newEndDateStr),
            gte(budgets.endDate, newStartDateStr)
          )
        )
        .limit(1)

      if (overlappingBudgets.length > 0) {
        return NextResponse.json(
          { error: '해당 기간에 이미 예산이 설정되어 있습니다.' },
          { status: 400 }
        )
      }
    }

    // 예산 수정 시 previousBudgetId는 변경하지 않음
    // previousBudgetId는 예산 생성 시에만 설정되며, 수정 시에는 유지됨

    const [updatedBudget] = await db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
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

    if (!updatedBudget) {
      return NextResponse.json(
        { error: '예산 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 카테고리 정보 조회
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, updatedBudget.categoryId))
      .limit(1)

    // 카테고리 정보 포함하여 반환
    return NextResponse.json({
      ...updatedBudget,
      category: category ? {
        id: category.id,
        name: category.name,
        icon: category.icon,
        type: category.type,
      } : null,
    })
  } catch (error) {
    console.error('예산 수정 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '예산 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 예산 삭제 API
 * DELETE /api/book/[bookId]/budget/[id]
 * 
 * 예산을 삭제합니다.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bookId: string; id: string }> }
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

    const { bookId, id } = await params

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

    // 예산 확인
    const [existingBudget] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.id, id),
          eq(budgets.bookId, bookId)
        )
      )
      .limit(1)

    if (!existingBudget) {
      return NextResponse.json(
        { error: '예산을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 예산 삭제
    await db
      .delete(budgets)
      .where(eq(budgets.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('예산 삭제 오류:', error)
    return NextResponse.json(
      { error: '예산 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

