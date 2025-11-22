import { createServerSupabaseClient } from '@/lib/supabase/server'
import { onUserSignUp } from '@/lib/db/seed-helpers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * OAuth 콜백 처리
 * OAuth 로그인 후 리다이렉트되는 경로
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    
    // OAuth 코드를 세션으로 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth 콜백 오류:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    if (data.user) {
      // 신규 사용자인 경우 시드 데이터 생성
      try {
        // 사용자 프로필이 이미 존재하는지 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // 신규 사용자인 경우에만 시드 데이터 생성
        if (!existingUser) {
          const email = data.user.email || data.user.user_metadata?.email || ''
          const name = data.user.user_metadata?.full_name || 
                      data.user.user_metadata?.name || 
                      data.user.user_metadata?.kakao_account?.profile?.nickname ||
                      null
          
          // OAuth 제공자에서 아바타 URL 가져오기
          const avatarUrl = data.user.user_metadata?.avatar_url ||
                           data.user.user_metadata?.picture ||
                           data.user.user_metadata?.kakao_account?.profile?.profile_image_url ||
                           null

          await onUserSignUp(data.user.id, email, name, avatarUrl)
        }
      } catch (seedError) {
        console.error('시드 데이터 생성 실패:', seedError)
        // 시드 데이터 생성 실패해도 로그인은 성공한 것으로 처리
      }
    }

    // 리다이렉트
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // 코드가 없으면 로그인 페이지로 리다이렉트
  return NextResponse.redirect(new URL('/login', request.url))
}

