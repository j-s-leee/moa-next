"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Check, ChevronDown, Loader2, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  type: "expense" | "income";
}

function CategoryDrawer({
  selectedCategoryId,
  onSelectCategory,
  categories,
  children,
}: {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  categories: Category[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId
  );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>카테고리 선택</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <div className="grid grid-cols-4 gap-3 pt-2">
            {categories.map((category) => {
              const IconComponent = category.icon
                ? (LucideIcons[category.icon as keyof typeof LucideIcons] as LucideIcon)
                : null;
              const isSelected = selectedCategoryId === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    onSelectCategory(category.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-md",
                      isSelected ? "bg-primary-foreground/20" : "bg-muted"
                    )}
                  >
                    {IconComponent ? (
                      <IconComponent
                        className={cn(
                          "h-6 w-6",
                          isSelected
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <span className="text-lg">{category.icon || "📦"}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isSelected ? "text-primary-foreground" : ""
                    )}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function AddBudgetPage() {
  const router = useRouter();
  const [bookId, setBookId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [type, setType] = useState<"monthly" | "yearly">("monthly");
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(true);

  // 반복 예산용
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  // 비반복 예산용
  const [specificDate, setSpecificDate] = useState<Date | undefined>(
    new Date()
  );

  // 가계부 ID 및 카테고리 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 개인 가계부 목록 조회
        const booksResponse = await fetch("/api/book");
        if (!booksResponse.ok) {
          throw new Error("가계부 목록 조회에 실패했습니다.");
        }
        const booksData = await booksResponse.json();
        const personalBook = booksData.books?.[0]; // 첫 번째 개인 가계부 사용

        if (!personalBook) {
          toast.error("가계부를 찾을 수 없습니다.");
          router.push("/book");
          return;
        }

        setBookId(personalBook.id);

        // 카테고리 목록 조회 (지출 카테고리만)
        const categoriesResponse = await fetch(
          `/api/book/${personalBook.id}/category?type=expense`
        );
        if (!categoriesResponse.ok) {
          throw new Error("카테고리 목록 조회에 실패했습니다.");
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      } catch (error) {
        console.error("데이터 로드 오류:", error);
        toast.error(
          error instanceof Error ? error.message : "데이터 로드에 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSave = async () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    if (!categoryId || !amount) {
      toast.error("카테고리와 금액을 입력해주세요.");
      return;
    }

    if (isRecurring && !startDate) {
      toast.error("시작일을 선택해주세요.");
      return;
    }

    if (!isRecurring && !specificDate) {
      toast.error("기간을 선택해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      // 날짜 계산
      let start: Date;
      let end: Date;

      if (isRecurring) {
        // 반복 예산: 시작일부터 미래까지 (2099-12-31)
        start = new Date(startDate!);
        start.setHours(0, 0, 0, 0);
        if (type === "monthly") {
          // 월의 첫 날로 설정
          start.setDate(1);
        } else {
          // 연도의 첫 날로 설정
          start.setMonth(0, 1);
        }
        end = new Date("2099-12-31T23:59:59.999Z");
      } else {
        // 비반복 예산: 특정 기간
        if (type === "monthly") {
          start = new Date(specificDate!);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end = new Date(specificDate!);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0); // 해당 월의 마지막 날
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(specificDate!);
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(specificDate!);
          end.setMonth(11, 31);
          end.setHours(23, 59, 59, 999);
        }
      }

      const response = await fetch(`/api/book/${bookId}/budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          period: type,
          amount: Number(amount),
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "예산 추가에 실패했습니다.");
      }

      toast.success("예산이 추가되었습니다.");
      router.push("/book/budget");
    } catch (error) {
      console.error("예산 추가 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "예산 추가에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    // 부모 라우트로 이동
    router.push("/book/budget");
  };

  return (
    <AppLayout
      title="예산 추가"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          <span className="sr-only">저장</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <Tabs
          value={type}
          onValueChange={(v) => setType(v as "monthly" | "yearly")}
        >
          <TabsList className="mx-auto mb-6">
            <TabsTrigger value="monthly">월간</TabsTrigger>
            <TabsTrigger value="yearly">연간</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <CategoryDrawer
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
            categories={categories}
          >
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              disabled={isLoading}
            >
              {selectedCategory ? (
                <>
                  {selectedCategory.icon &&
                  (LucideIcons[selectedCategory.icon as keyof typeof LucideIcons] as LucideIcon) ? (
                    <>
                      {(() => {
                        const IconComponent = LucideIcons[
                          selectedCategory.icon as keyof typeof LucideIcons
                        ] as LucideIcon;
                        return <IconComponent className="mr-2 h-4 w-4" />;
                      })()}
                      {selectedCategory.name}
                    </>
                  ) : (
                    <>
                      <span className="mr-2">{selectedCategory.icon || "📦"}</span>
                      {selectedCategory.name}
                    </>
                  )}
                </>
              ) : (
                "카테고리 선택"
              )}
            </Button>
          </CategoryDrawer>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">금액</Label>
          <Input
            id="amount"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="금액을 입력하세요"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="recurring" className="cursor-pointer">
            {type === "monthly" ? "매월 자동 적용" : "매년 자동 적용"}
          </Label>
          <Switch
            id="recurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
        </div>

        {isRecurring ? (
          <div className="space-y-2">
            <Label>시작 {type === "monthly" ? "월" : "연도"}</Label>
            {type === "monthly" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate
                      ? `${startDate.getFullYear()}년 ${
                          startDate.getMonth() + 1
                        }월`
                      : "시작 월 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    captionLayout="dropdown"
                    defaultMonth={startDate}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate
                      ? `${startDate.getFullYear()}년`
                      : "시작 연도 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    captionLayout="dropdown"
                    defaultMonth={startDate}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>{type === "monthly" ? "적용 월" : "적용 연도"}</Label>
            {type === "monthly" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !specificDate && "text-muted-foreground"
                    )}
                  >
                    {specificDate
                      ? `${specificDate.getFullYear()}년 ${
                          specificDate.getMonth() + 1
                        }월`
                      : "월 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={specificDate}
                    onSelect={setSpecificDate}
                    captionLayout="dropdown"
                    defaultMonth={specificDate}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !specificDate && "text-muted-foreground"
                    )}
                  >
                    {specificDate
                      ? `${specificDate.getFullYear()}년`
                      : "연도 선택"}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={specificDate}
                    onSelect={setSpecificDate}
                    captionLayout="dropdown"
                    defaultMonth={specificDate}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
