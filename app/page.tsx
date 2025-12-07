import { redirect } from "next/navigation";
import Image from "next/image";
import { SupabaseConnectionTest } from "@/components/supabase-connection-test";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  
  // 현재 사용자 세션 확인
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  // 로그인한 사용자인 경우 개인 가계부로 리다이렉트
  if (!authError && authUser) {
    let personalBookId: string | null = null;
    
    try {
      // 현재 사용자의 개인 가계부 조회
      const personalBooks = await db
        .select({
          id: books.id,
        })
        .from(books)
        .where(
          and(
            eq(books.ownerId, authUser.id),
            eq(books.type, "personal")
          )
        )
        .limit(1);

      if (personalBooks.length > 0) {
        personalBookId = personalBooks[0].id;
      }
    } catch (error) {
      console.error("가계부 조회 오류:", error);
      // 오류 발생 시 랜딩 페이지 표시
    }

    // 개인 가계부가 있으면 summary 페이지로 리다이렉트
    // redirect는 throw를 사용하므로 try-catch 밖에서 호출
    if (personalBookId) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      redirect(`/book/${personalBookId}/summary?year=${year}&month=${month}`);
    }
  }

  // 로그인하지 않은 사용자 또는 개인 가계부가 없는 경우 랜딩 페이지 표시
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex w-full flex-col items-center gap-8 text-center sm:items-start sm:text-left">
          <div className="flex flex-col items-center gap-6 sm:items-start">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              The Moa
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              개인 및 부부 공동 가계부 관리 서비스
            </p>
          </div>
          
          {/* Supabase 연결 테스트 */}
          <div className="w-full">
            <SupabaseConnectionTest />
          </div>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="/login"
          >
            로그인
          </a>
        </div>
      </main>
    </div>
  );
}
