import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/**
 * 사용자 프로필 조회 API
 * GET /api/user/profile
 */
export async function GET() {
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

    // 데이터베이스에서 사용자 프로필 조회
    const [userProfile] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1)

    if (!userProfile) {
      return NextResponse.json(
        { error: '사용자 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      avatarUrl: userProfile.avatarUrl,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    })
  } catch (error) {
    console.error('프로필 조회 오류:', error)
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 사용자 프로필 수정 API
 * PUT /api/user/profile
 */
export async function PUT(request: Request) {
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

    // 요청 본문 파싱
    const body = await request.json()
    const { name, avatarUrl } = body

    // 유효성 검사
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json(
        { error: '이름은 문자열이어야 합니다.' },
        { status: 400 }
      )
    }

    if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: '프로필 이미지 URL은 문자열이어야 합니다.' },
        { status: 400 }
      )
    }

    // 업데이트할 필드 구성
    const updateData: {
      name?: string
      avatarUrl?: string
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    if (name !== undefined) {
      updateData.name = name.trim() || null
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl.trim() || null
    }

    // 프로필 업데이트
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, authUser.id))
      .returning()

    if (!updatedUser) {
      return NextResponse.json(
        { error: '프로필 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    })
  } catch (error) {
    console.error('프로필 수정 오류:', error)
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '프로필 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

