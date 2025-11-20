'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'

type TestResult = {
  success: boolean
  message: string
  details?: any
  error?: string
}

export function SupabaseConnectionTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const testClientSide = async () => {
    try {
      const supabase = createClientComponentClient()
      // 클라이언트가 정상적으로 생성되었는지 확인
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        return {
          success: false,
          message: '환경 변수가 설정되지 않았습니다',
          error: `URL: ${url ? '설정됨' : '없음'}, Key: ${key ? '설정됨' : '없음'}`,
        }
      }

      return {
        success: true,
        message: '클라이언트 컴포넌트에서 Supabase 클라이언트 생성 성공',
        details: {
          url: url.substring(0, 30) + '...',
          hasKey: true,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: '클라이언트 생성 실패',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const testServerSide = async () => {
    try {
      const response = await fetch('/api/test-supabase')
      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        message: '서버 API 호출 실패',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      // 클라이언트 사이드 테스트
      const clientResult = await testClientSide()

      // 서버 사이드 테스트
      const serverResult = await testServerSide()

      setResult({
        success: clientResult.success && serverResult.success,
        message: '연결 테스트 완료',
        details: {
          client: clientResult,
          server: serverResult,
        },
      })
    } catch (error) {
      setResult({
        success: false,
        message: '테스트 중 오류 발생',
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Supabase 연결 테스트
        </CardTitle>
        <CardDescription>
          Supabase 클라이언트가 정상적으로 연결되었는지 확인합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleTest} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              테스트 중...
            </>
          ) : (
            '연결 테스트 실행'
          )}
        </Button>

        {result && (
          <div
            className={`rounded-lg border p-4 ${
              result.success
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            }`}
          >
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <div className="flex-1 space-y-2">
                <p
                  className={`font-medium ${
                    result.success
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}
                >
                  {result.message}
                </p>
                {result.error && (
                  <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
                )}
                {result.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">상세 정보</summary>
                    <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-900">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            환경 변수 확인
          </p>
          <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <li>
              NEXT_PUBLIC_SUPABASE_URL:{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <span className="text-green-600 dark:text-green-400">✓ 설정됨</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">✗ 없음</span>
              )}
            </li>
            <li>
              NEXT_PUBLIC_SUPABASE_ANON_KEY:{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                <span className="text-green-600 dark:text-green-400">✓ 설정됨</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">✗ 없음</span>
              )}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

