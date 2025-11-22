import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { books } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * 가계부 정보 조회 API
 * GET /api/book/[bookId]
 * 
 * 특정 가계부의 정보를 조회합니다.
 * 본인이 소유한 가계부만 조회 가능합니다.
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

    // 가계부 조회 (소유자 확인)
    const [book] = await db
      .select({
        id: books.id,
        name: books.name,
        type: books.type,
        ownerId: books.ownerId,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
      })
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

    return NextResponse.json(book)
  } catch (error) {
    console.error('가계부 조회 오류:', error)
    return NextResponse.json(
      { error: '가계부 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 가계부 정보 수정 API
 * PUT /api/book/[bookId]
 * 
 * 가계부의 이름을 수정합니다.
 * 본인이 소유한 가계부만 수정 가능합니다.
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

    // 요청 본문 파싱
    const body = await request.json()
    const { name } = body

    // 유효성 검사
    if (name === undefined) {
      return NextResponse.json(
        { error: '가계부 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '가계부 이름은 비어있을 수 없습니다.' },
        { status: 400 }
      )
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: '가계부 이름은 100자 이하여야 합니다.' },
        { status: 400 }
      )
    }

    // 가계부 존재 및 소유권 확인
    const [existingBook] = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.id, bookId),
          eq(books.ownerId, authUser.id)
        )
      )
      .limit(1)

    if (!existingBook) {
      return NextResponse.json(
        { error: '가계부를 찾을 수 없거나 수정 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 가계부 정보 업데이트
    const [updatedBook] = await db
      .update(books)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId))
      .returning({
        id: books.id,
        name: books.name,
        type: books.type,
        ownerId: books.ownerId,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
      })

    if (!updatedBook) {
      return NextResponse.json(
        { error: '가계부 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedBook)
  } catch (error) {
    console.error('가계부 수정 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '가계부 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

