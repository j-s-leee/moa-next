import { createServerSupabaseClient } from '@/lib/supabase/server'
import { onUserSignUp } from '@/lib/db/seed-helpers'
import { NextResponse } from 'next/server'

/**
 * 회원가입 API
 * 회원가입 후 자동으로 사용자 프로필 및 개인 가계부 생성
 */
export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호는 필수입니다.' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // 회원가입
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: '회원가입에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 회원가입 후 자동으로 사용자 프로필 및 개인 가계부 생성
    try {
      await onUserSignUp(data.user.id, email, name)
    } catch (seedError) {
      console.error('시드 데이터 생성 실패:', seedError)
      // 시드 데이터 생성 실패해도 회원가입은 성공한 것으로 처리
      // 나중에 수동으로 생성할 수 있도록 로그만 남김
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('회원가입 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

