import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { incomes, books, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isValidDateString } from "@/lib/utils/date";
import { DateTime } from "luxon";

/**
 * 수입 조회 API
 * GET /api/book/[bookId]/income/[id]
 * 
 * 특정 수입을 조회합니다.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string; id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

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

    const { bookId, id } = await params;

    // 가계부 소유권 확인
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.ownerId, authUser.id)))
      .limit(1);

    if (!book) {
      return NextResponse.json(
        { error: "가계부를 찾을 수 없거나 접근 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 수입 조회
    const [income] = await db
      .select()
      .from(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.bookId, bookId)))
      .limit(1);

    if (!income) {
      return NextResponse.json(
        { error: "수입을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 카테고리 정보 조회
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, income.categoryId))
      .limit(1);

    // 카테고리 정보 포함하여 반환
    return NextResponse.json({
      ...income,
      category: category
        ? {
            id: category.id,
            name: category.name,
            icon: category.icon,
            type: category.type,
          }
        : null,
    });
  } catch (error) {
    console.error("수입 조회 오류:", error);
    return NextResponse.json(
      { error: "수입 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 수입 수정 API
 * PUT /api/book/[bookId]/income/[id]
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ bookId: string; id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

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

    const { bookId, id } = await params;

    // 가계부 소유권 확인
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.ownerId, authUser.id)))
      .limit(1);

    if (!book) {
      return NextResponse.json(
        { error: "가계부를 찾을 수 없거나 접근 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 수입 존재 확인
    const [income] = await db
      .select()
      .from(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.bookId, bookId)))
      .limit(1);

    if (!income) {
      return NextResponse.json(
        { error: "수입을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const {
      categoryId,
      amount,
      date,
      period,
      source,
      incomeType,
      startDate,
      endDate,
      transferredFromBookId,
    } = body;

    // 업데이트할 필드 구성
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (categoryId !== undefined) {
      // 카테고리 확인 (해당 가계부에 속하는지)
      const [category] = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, categoryId),
            eq(categories.bookId, bookId),
            eq(categories.type, "income") // 수입 카테고리만 허용
          )
        )
        .limit(1);

      if (!category) {
        return NextResponse.json(
          { error: "카테고리를 찾을 수 없거나 해당 가계부에 속하지 않습니다." },
          { status: 404 }
        );
      }
      updateData.categoryId = categoryId;
    }

    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json(
          { error: "금액은 0보다 큰 숫자여야 합니다." },
          { status: 400 }
        );
      }
      updateData.amount = Math.round(amount);
    }

    if (period !== undefined) {
      if (period !== "monthly" && period !== "yearly") {
        return NextResponse.json(
          { error: "기간은 monthly 또는 yearly여야 합니다." },
          { status: 400 }
        );
      }
      updateData.period = period;
    }

    if (source !== undefined) {
      // source는 선택사항이므로 null 허용
      if (source === null) {
        updateData.source = null;
      } else if (typeof source === "string") {
        updateData.source = source.trim() || null;
      } else {
        return NextResponse.json(
          { error: "수입 출처는 문자열이어야 합니다." },
          { status: 400 }
        );
      }
    }

    if (incomeType !== undefined) {
      if (incomeType !== "actual" && incomeType !== "transfer") {
        return NextResponse.json(
          { error: "수입 타입은 actual 또는 transfer여야 합니다." },
          { status: 400 }
        );
      }
      updateData.incomeType = incomeType;
    }

    if (date !== undefined) {
      if (date === null) {
        updateData.date = null;
      } else {
        try {
          if (typeof date !== "string" || !isValidDateString(date)) {
            return NextResponse.json(
              { error: "날짜는 YYYY-MM-DD 형식이어야 합니다." },
              { status: 400 }
            );
          }
          const dateTime = DateTime.fromISO(date);
          if (!dateTime.isValid) {
            return NextResponse.json(
              { error: "잘못된 날짜 형식입니다." },
              { status: 400 }
            );
          }
          updateData.date = dateTime.toFormat("yyyy-MM-dd");
        } catch (error) {
          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "잘못된 날짜 형식입니다.",
            },
            { status: 400 }
          );
        }
      }
    }

    if (startDate !== undefined) {
      if (startDate === null) {
        updateData.startDate = null;
      } else {
        try {
          if (typeof startDate !== "string" || !isValidDateString(startDate)) {
            return NextResponse.json(
              { error: "시작 날짜는 YYYY-MM-DD 형식이어야 합니다." },
              { status: 400 }
            );
          }
          const startDateTime = DateTime.fromISO(startDate);
          if (!startDateTime.isValid) {
            return NextResponse.json(
              { error: "잘못된 시작 날짜 형식입니다." },
              { status: 400 }
            );
          }
          updateData.startDate = startDateTime.toFormat("yyyy-MM-dd");
        } catch (error) {
          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "잘못된 시작 날짜 형식입니다.",
            },
            { status: 400 }
          );
        }
      }
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.endDate = null;
      } else {
        try {
          if (typeof endDate !== "string" || !isValidDateString(endDate)) {
            return NextResponse.json(
              { error: "종료 날짜는 YYYY-MM-DD 형식이어야 합니다." },
              { status: 400 }
            );
          }
          const endDateTime = DateTime.fromISO(endDate);
          if (!endDateTime.isValid) {
            return NextResponse.json(
              { error: "잘못된 종료 날짜 형식입니다." },
              { status: 400 }
            );
          }
          const finalStartDate =
            updateData.startDate || income.startDate
              ? DateTime.fromISO(updateData.startDate || income.startDate!)
              : null;
          if (finalStartDate && endDateTime < finalStartDate) {
            return NextResponse.json(
              { error: "종료 날짜는 시작 날짜보다 이후여야 합니다." },
              { status: 400 }
            );
          }
          updateData.endDate = endDateTime.toFormat("yyyy-MM-dd");
        } catch (error) {
          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "잘못된 종료 날짜 형식입니다.",
            },
            { status: 400 }
          );
        }
      }
    }

    if (transferredFromBookId !== undefined) {
      if (transferredFromBookId === null) {
        updateData.transferredFromBookId = null;
      } else {
        // 이체인 경우 출처 가계부 확인
        const [transferredFromBook] = await db
          .select()
          .from(books)
          .where(
            and(eq(books.id, transferredFromBookId), eq(books.ownerId, authUser.id))
          )
          .limit(1);

        if (!transferredFromBook) {
          return NextResponse.json(
            { error: "출처 가계부를 찾을 수 없거나 접근 권한이 없습니다." },
            { status: 404 }
          );
        }
        updateData.transferredFromBookId = transferredFromBookId;
      }
    }

    // 수입 업데이트
    const [updatedIncome] = await db
      .update(incomes)
      .set(updateData)
      .where(and(eq(incomes.id, id), eq(incomes.bookId, bookId)))
      .returning({
        id: incomes.id,
        bookId: incomes.bookId,
        categoryId: incomes.categoryId,
        amount: incomes.amount,
        date: incomes.date,
        period: incomes.period,
        source: incomes.source,
        incomeType: incomes.incomeType,
        transferredFromBookId: incomes.transferredFromBookId,
        startDate: incomes.startDate,
        endDate: incomes.endDate,
        createdAt: incomes.createdAt,
        updatedAt: incomes.updatedAt,
      });

    if (!updatedIncome) {
      return NextResponse.json(
        { error: "수입 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 카테고리 정보 조회
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, updatedIncome.categoryId))
      .limit(1);

    // 카테고리 정보 포함하여 반환
    return NextResponse.json({
      ...updatedIncome,
      category: category
        ? {
            id: category.id,
            name: category.name,
            icon: category.icon,
            type: category.type,
          }
        : null,
    });
  } catch (error) {
    console.error("수입 수정 오류:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "수입 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 수입 삭제 API
 * DELETE /api/book/[bookId]/income/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bookId: string; id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

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

    const { bookId, id } = await params;

    // 가계부 소유권 확인
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.ownerId, authUser.id)))
      .limit(1);

    if (!book) {
      return NextResponse.json(
        { error: "가계부를 찾을 수 없거나 접근 권한이 없습니다." },
        { status: 404 }
      );
    }

    // 수입 존재 확인
    const [income] = await db
      .select()
      .from(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.bookId, bookId)))
      .limit(1);

    if (!income) {
      return NextResponse.json(
        { error: "수입을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 수입 삭제
    await db
      .delete(incomes)
      .where(and(eq(incomes.id, id), eq(incomes.bookId, bookId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("수입 삭제 오류:", error);
    return NextResponse.json(
      { error: "수입 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

