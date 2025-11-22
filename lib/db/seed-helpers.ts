/**
 * 시드 데이터 헬퍼 함수
 * 회원가입 시 자동으로 호출되는 함수들
 */

import { db } from "./index";
import { users } from "./schema";
import { seedDefaultCategories, seedPersonalBook } from "./seed";

/**
 * 회원가입 완료 후 자동 실행 함수
 * Supabase Auth의 trigger나 서버 액션에서 호출
 */
export async function onUserSignUp(
  userId: string,
  email: string,
  name?: string,
  avatarUrl?: string
) {
  try {
    // 1. 사용자 프로필 생성
    await db.insert(users).values({
      id: userId,
      email,
      name: name || null,
      avatarUrl: avatarUrl || null,
    });

    // 2. 개인 가계부 생성 및 기본 카테고리 추가
    await seedPersonalBook(userId, name);

    console.log(`✅ 회원가입 완료: ${email}`);
  } catch (error) {
    console.error(`❌ 회원가입 처리 실패: ${email}`, error);
    throw error;
  }
}
