import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { expenses, books, categories, budgets } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * 지출 수정 API
 * PUT /api/book/[bookId]/expense/[id]
 * 
 * 기존 지출을 수정합니다.
 * 예산은 자동으로 재연결됩니다 (카테고리나 날짜가 변경된 경우).
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

    // 기존 지출 확인
    const [existingExpense] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.bookId, bookId)
        )
      )
      .limit(1)

    if (!existingExpense) {
      return NextResponse.json(
        { error: '지출을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { categoryId, amount, date, description } = body

    // 유효성 검사
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { error: '금액은 0보다 큰 숫자여야 합니다.' },
          { status: 400 }
        )
      }
    }

    let expenseDate = existingExpense.date
    if (date !== undefined) {
      expenseDate = new Date(date)
      if (isNaN(expenseDate.getTime())) {
        return NextResponse.json(
          { error: '잘못된 날짜 형식입니다.' },
          { status: 400 }
        )
      }
    }

    let finalCategoryId = existingExpense.categoryId
    if (categoryId !== undefined) {
      if (typeof categoryId !== 'string') {
        return NextResponse.json(
          { error: '카테고리는 문자열이어야 합니다.' },
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

      finalCategoryId = categoryId
    }

    // 예산 자동 재연결 로직
    // 카테고리나 날짜가 변경된 경우 예산 재검색
    let budgetId = existingExpense.budgetId

    if (categoryId !== undefined || date !== undefined) {
      // 같은 가계부의 같은 카테고리에 대한 예산 찾기
      const [activeBudget] = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.bookId, bookId),
            eq(budgets.categoryId, finalCategoryId),
            lte(budgets.startDate, expenseDate),
            gte(budgets.endDate, expenseDate)
          )
        )
        .limit(1)

      budgetId = activeBudget?.id || null
    }

    // 지출 업데이트
    const updateData: {
      categoryId?: string
      amount?: number
      date?: Date
      description?: string | null
      budgetId?: string | null
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    if (categoryId !== undefined) {
      updateData.categoryId = finalCategoryId
    }
    if (amount !== undefined) {
      updateData.amount = Math.round(amount)
    }
    if (date !== undefined) {
      updateData.date = expenseDate
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    if (categoryId !== undefined || date !== undefined) {
      updateData.budgetId = budgetId
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning({
        id: expenses.id,
        bookId: expenses.bookId,
        categoryId: expenses.categoryId,
        amount: expenses.amount,
        date: expenses.date,
        description: expenses.description,
        userId: expenses.userId,
        budgetId: expenses.budgetId,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })

    if (!updatedExpense) {
      return NextResponse.json(
        { error: '지출 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 카테고리 정보 조회
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, updatedExpense.categoryId))
      .limit(1)

    // 카테고리 정보 포함하여 반환
    return NextResponse.json({
      ...updatedExpense,
      category: category
        ? {
            id: category.id,
            name: category.name,
            icon: category.icon,
            type: category.type,
          }
        : null,
    })
  } catch (error) {
    console.error('지출 수정 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '지출 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 지출 삭제 API
 * DELETE /api/book/[bookId]/expense/[id]
 * 
 * 기존 지출을 삭제합니다.
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

    // 기존 지출 확인
    const [existingExpense] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.bookId, bookId)
        )
      )
      .limit(1)

    if (!existingExpense) {
      return NextResponse.json(
        { error: '지출을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 지출 삭제
    await db
      .delete(expenses)
      .where(eq(expenses.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('지출 삭제 오류:', error)
    return NextResponse.json(
      { error: '지출 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

