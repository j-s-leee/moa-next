import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Drizzle ORM 데이터베이스 연결
 * 서버 사이드에서만 사용 (클라이언트 컴포넌트에서는 사용하지 않음)
 */
const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

// 연결 풀 생성 (서버 컴포넌트에서 재사용)
const client = postgres(connectionString, {
  max: 1, // 서버리스 환경에 최적화
})

export const db = drizzle(client, { schema })

