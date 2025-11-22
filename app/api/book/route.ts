import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * 가계부 목록 조회 API
 * GET /api/book
 *
 * 현재 사용자가 소유한 개인 가계부 목록을 반환합니다.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 현재 사용자 세션 확인
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 현재 사용자가 소유한 개인 가계부 목록 조회
    const userBooks = await db
      .select({
        id: books.id,
        name: books.name,
        type: books.type,
        ownerId: books.ownerId,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
      })
      .from(books)
      .where(and(eq(books.ownerId, authUser.id), eq(books.type, "personal")))
      .orderBy(books.createdAt);

    return NextResponse.json({
      books: userBooks,
    });
  } catch (error) {
    console.error("가계부 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "가계부 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
