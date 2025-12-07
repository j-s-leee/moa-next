"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { budgetSchema, type BudgetFormData } from "@/lib/validations";
import { useCategories, useCreateBudget } from "@/lib/react-query/queries";

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
  const params = useParams();
  const bookId = params.bookId as string;

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      period: "monthly",
      isRecurring: true,
      startDate: new Date(),
      specificDate: new Date(),
    },
  });

  const period = form.watch("period");
  const isRecurring = form.watch("isRecurring");

  // 카테고리 목록 조회 (지출 카테고리만)
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories(bookId);
  
  const categories = (categoriesData?.categories || []).filter(
    (cat) => cat.type === "expense"
  ) as Category[];
  const isLoading = isLoadingCategories;

  const categoryId = form.watch("categoryId");
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const createBudget = useCreateBudget();

  const onSubmit = async (data: BudgetFormData) => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }

    // 날짜 계산
    let start: Date;
    let end: Date;

    if (data.isRecurring) {
      // 반복 예산: 시작일부터 미래까지 (2099-12-31)
      if (!data.startDate) {
        toast.error("시작일을 선택해주세요.");
        return;
      }
      start = new Date(data.startDate);
      start.setHours(0, 0, 0, 0);
      if (data.period === "monthly") {
        // 월의 첫 날로 설정
        start.setDate(1);
      } else {
        // 연도의 첫 날로 설정
        start.setMonth(0, 1);
      }
      end = new Date("2099-12-31T23:59:59.999Z");
    } else {
      // 비반복 예산: 특정 기간
      if (!data.specificDate) {
        toast.error("기간을 선택해주세요.");
        return;
      }
      if (data.period === "monthly") {
        start = new Date(data.specificDate);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end = new Date(data.specificDate);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // 해당 월의 마지막 날
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(data.specificDate);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(data.specificDate);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
      }
    }

    createBudget.mutate(
      {
        bookId: bookId,
        data: {
          categoryId: data.categoryId,
          period: data.period,
          amount: Number(data.amount),
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      },
      {
        onSuccess: () => {
          router.push(`/book/${bookId}/budgets`);
        },
      }
    );
  };

  const handleBack = () => {
    // 부모 라우트로 이동
    router.push(`/book/${bookId}/budgets`);
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
          onClick={form.handleSubmit(onSubmit)}
          disabled={createBudget.isPending || isLoading}
        >
          {createBudget.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          <span className="sr-only">저장</span>
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Tabs
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as "monthly" | "yearly")}
                  >
                    <TabsList className="mx-auto mb-6">
                      <TabsTrigger value="monthly">월간</TabsTrigger>
                      <TabsTrigger value="yearly">연간</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                <FormControl>
                  <CategoryDrawer
                    selectedCategoryId={field.value || null}
                    onSelectCategory={field.onChange}
                    categories={categories}
                  >
                    <Button
                      type="button"
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>금액</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="금액을 입력하세요"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="cursor-pointer">
                    {period === "monthly" ? "매월 자동 적용" : "매년 자동 적용"}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {isRecurring ? (
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시작 {period === "monthly" ? "월" : "연도"}</FormLabel>
                  <FormControl>
                    {period === "monthly" ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? `${field.value.getFullYear()}년 ${
                                  field.value.getMonth() + 1
                                }월`
                              : "시작 월 선택"}
                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            defaultMonth={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? `${field.value.getFullYear()}년`
                              : "시작 연도 선택"}
                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            defaultMonth={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="specificDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{period === "monthly" ? "적용 월" : "적용 연도"}</FormLabel>
                  <FormControl>
                    {period === "monthly" ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? `${field.value.getFullYear()}년 ${
                                  field.value.getMonth() + 1
                                }월`
                              : "월 선택"}
                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            defaultMonth={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? `${field.value.getFullYear()}년`
                              : "연도 선택"}
                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            defaultMonth={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </AppLayout>
  );
}
