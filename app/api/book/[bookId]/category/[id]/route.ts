import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { categories, books } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * 카테고리 정보 조회 API
 * GET /api/book/[bookId]/category/[id]
 * 
 * 특정 카테고리의 정보를 조회합니다.
 */
export async function GET(
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

    const { bookId, id: categoryId } = await params

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

    // 카테고리 조회
    const [category] = await db
      .select({
        id: categories.id,
        bookId: categories.bookId,
        name: categories.name,
        icon: categories.icon,
        type: categories.type,
        expenseType: categories.expenseType,
        autoDetectedType: categories.autoDetectedType,
        lastTypeCheckDate: categories.lastTypeCheckDate,
        order: categories.order,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.bookId, bookId)
        )
      )
      .limit(1)

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('카테고리 조회 오류:', error)
    return NextResponse.json(
      { error: '카테고리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 카테고리 수정 API
 * PUT /api/book/[bookId]/category/[id]
 * 
 * 카테고리 정보를 수정합니다.
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

    const { bookId, id: categoryId } = await params

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

    // 카테고리 존재 확인
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.bookId, bookId)
        )
      )
      .limit(1)

    if (!existingCategory) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { name, icon, expenseType } = body

    // 유효성 검사
    const updateData: {
      name?: string
      icon?: string | null
      expenseType?: string | null
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: '카테고리 이름은 비어있을 수 없습니다.' },
          { status: 400 }
        )
      }
      if (name.trim().length > 50) {
        return NextResponse.json(
          { error: '카테고리 이름은 50자 이하여야 합니다.' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (icon !== undefined) {
      if (icon !== null && (typeof icon !== 'string' || icon.trim().length === 0)) {
        return NextResponse.json(
          { error: '아이콘은 문자열이거나 null이어야 합니다.' },
          { status: 400 }
        )
      }
      updateData.icon = icon?.trim() || null
    }

    if (expenseType !== undefined && existingCategory.type === 'expense') {
      if (expenseType === null) {
        updateData.expenseType = null
      } else {
        const validExpenseTypes = ['fixed', 'variable', 'annual', 'one-time']
        if (!validExpenseTypes.includes(expenseType)) {
          return NextResponse.json(
            { error: '지출 타입이 유효하지 않습니다.' },
            { status: 400 }
          )
        }
        updateData.expenseType = expenseType
      }
    }

    // 카테고리 업데이트
    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning({
        id: categories.id,
        bookId: categories.bookId,
        name: categories.name,
        icon: categories.icon,
        type: categories.type,
        expenseType: categories.expenseType,
        autoDetectedType: categories.autoDetectedType,
        lastTypeCheckDate: categories.lastTypeCheckDate,
        order: categories.order,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })

    if (!updatedCategory) {
      return NextResponse.json(
        { error: '카테고리 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('카테고리 수정 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '카테고리 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 카테고리 삭제 API
 * DELETE /api/book/[bookId]/category/[id]
 * 
 * 카테고리를 삭제합니다.
 * 관련된 지출/예산이 있는 경우 확인이 필요할 수 있습니다.
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

    const { bookId, id: categoryId } = await params

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

    // 카테고리 존재 확인
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.bookId, bookId)
        )
      )
      .limit(1)

    if (!existingCategory) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 카테고리 삭제 (CASCADE로 관련 지출/예산도 함께 삭제됨)
    await db
      .delete(categories)
      .where(eq(categories.id, categoryId))

    return NextResponse.json(
      { message: '카테고리가 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('카테고리 삭제 오류:', error)
    return NextResponse.json(
      { error: '카테고리 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

