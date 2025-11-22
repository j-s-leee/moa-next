import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { categories, books } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * 카테고리 순서 변경 API
 * PUT /api/book/[bookId]/category/reorder
 * 
 * 카테고리의 순서를 변경합니다.
 * 요청 본문에 카테고리 ID 배열을 순서대로 전달합니다.
 */
export async function PUT(
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
    const { categoryIds } = body

    // 유효성 검사
    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: '카테고리 ID 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    if (categoryIds.length === 0) {
      return NextResponse.json(
        { error: '카테고리 ID 배열이 비어있습니다.' },
        { status: 400 }
      )
    }

    // 모든 카테고리가 해당 가계부에 속하는지 확인
    const existingCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.bookId, bookId),
          inArray(categories.id, categoryIds)
        )
      )

    if (existingCategories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: '일부 카테고리를 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 400 }
      )
    }

    // 순서 업데이트 (트랜잭션으로 처리)
    const updates = categoryIds.map((categoryId: string, index: number) => {
      return db
        .update(categories)
        .set({
          order: index,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(categories.id, categoryId),
            eq(categories.bookId, bookId)
          )
        )
    })

    // 순차적으로 업데이트 실행
    for (const update of updates) {
      await update
    }

    // 업데이트된 카테고리 목록 반환
    const updatedCategories = await db
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
          eq(categories.bookId, bookId),
          inArray(categories.id, categoryIds)
        )
      )
      .orderBy(categories.order)

    return NextResponse.json({
      message: '카테고리 순서가 변경되었습니다.',
      categories: updatedCategories,
    })
  } catch (error) {
    console.error('카테고리 순서 변경 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '카테고리 순서 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

