import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { categories, books } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * 카테고리 목록 조회 API
 * GET /api/book/[bookId]/category?type=expense|income
 * 
 * 특정 가계부의 카테고리 목록을 조회합니다.
 * type 쿼리 파라미터로 지출/수입 카테고리를 필터링할 수 있습니다.
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

    // 쿼리 파라미터에서 type 추출
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'expense' | 'income' | null

    // 카테고리 조회
    const whereConditions = [eq(categories.bookId, bookId)]
    if (type === 'expense' || type === 'income') {
      whereConditions.push(eq(categories.type, type))
    }

    const categoryList = await db
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
      .where(and(...whereConditions))
      .orderBy(categories.order)

    return NextResponse.json({
      categories: categoryList,
    })
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '카테고리 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 카테고리 생성 API
 * POST /api/book/[bookId]/category
 * 
 * 새로운 카테고리를 생성합니다.
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
    const { name, icon, type, expenseType } = body

    // 유효성 검사
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '카테고리 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: '카테고리 이름은 50자 이하여야 합니다.' },
        { status: 400 }
      )
    }

    if (!type || (type !== 'expense' && type !== 'income')) {
      return NextResponse.json(
        { error: '카테고리 타입은 expense 또는 income이어야 합니다.' },
        { status: 400 }
      )
    }

    if (icon !== undefined && typeof icon !== 'string' && icon !== null) {
      return NextResponse.json(
        { error: '아이콘은 문자열이거나 null이어야 합니다.' },
        { status: 400 }
      )
    }

    if (expenseType !== undefined && type === 'expense') {
      const validExpenseTypes = ['fixed', 'variable', 'annual', 'one-time']
      if (!validExpenseTypes.includes(expenseType)) {
        return NextResponse.json(
          { error: '지출 타입이 유효하지 않습니다.' },
          { status: 400 }
        )
      }
    }

    // 같은 가계부 내에서 동일한 이름의 카테고리 확인 (선택적 - 중복 허용 가능)
    // 필요시 추가

    // 최대 order 값 조회하여 다음 순서 결정 (같은 타입의 카테고리만 고려)
    const maxOrderCategories = await db
      .select({ order: categories.order })
      .from(categories)
      .where(
        and(
          eq(categories.bookId, bookId),
          eq(categories.type, type)
        )
      )
      .orderBy(categories.order)

    const maxOrder = maxOrderCategories.length > 0 
      ? Math.max(...maxOrderCategories.map(c => c.order || 0))
      : -1

    const nextOrder = maxOrder + 1

    // 카테고리 생성
    const [newCategory] = await db
      .insert(categories)
      .values({
        bookId,
        name: name.trim(),
        icon: icon?.trim() || null,
        type,
        expenseType: type === 'expense' ? expenseType || null : null,
        order: nextOrder,
        updatedAt: new Date(),
      })
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

    if (!newCategory) {
      return NextResponse.json(
        { error: '카테고리 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('카테고리 생성 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '카테고리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

