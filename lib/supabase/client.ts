import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

/**
 * 브라우저에서 사용하는 Supabase 클라이언트
 * 클라이언트 컴포넌트에서 사용
 */
export function createClientComponentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * 서버 컴포넌트에서 사용하는 Supabase 클라이언트
 * 쿠키 없이 사용하는 간단한 클라이언트
 */
export function createServerComponentClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

