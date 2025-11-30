"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Check, Plus, Loader2, type LucideIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import { categorySchema, type CategoryFormData } from "@/lib/validations";
import { useCreateCategory } from "@/lib/react-query/queries";

// Lucide 아이콘 목록
const iconNames = [
  "UtensilsCrossed",
  "ShoppingCart",
  "Coffee",
  "Home",
  "Car",
  "Wallet",
  "PiggyBank",
  "Plane",
  "Train",
  "Bus",
  "Bike",
  "Gamepad2",
  "Film",
  "Music",
  "Book",
  "GraduationCap",
  "Briefcase",
  "Heart",
  "Gift",
  "Cake",
  "Pizza",
  "Beer",
  "Wine",
  "Dumbbell",
  "Stethoscope",
  "Pill",
  "Scissors",
  "Shirt",
  "Baby",
  "Dog",
  "Cat",
  "TreePine",
  "Sun",
  "Moon",
  "Cloud",
  "Droplet",
  "Flame",
  "Zap",
  "Star",
  "Diamond",
  "Crown",
  "Trophy",
  "Medal",
  "Award",
  "Target",
  "Flag",
  "MapPin",
  "Navigation",
  "Compass",
  "Globe",
  "Building",
  "Building2",
  "Store",
  "Hotel",
  "School",
  "Hospital",
  "CreditCard",
  "Receipt",
  "FileText",
  "Folder",
  "Image",
  "Video",
  "Camera",
  "Phone",
  "Mail",
  "MessageSquare",
  "Bell",
  "Settings",
  "User",
  "Users",
  "UserPlus",
  "Lock",
  "Key",
  "Shield",
  "AlertCircle",
  "CheckCircle",
  "XCircle",
  "Info",
  "HelpCircle",
  "Search",
  "Filter",
  "SortAsc",
  "SortDesc",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ChevronUp",
  "ChevronDown",
  "ChevronLeft",
  "ChevronRight",
  "Minus",
  "X",
  "Edit",
  "Trash2",
  "Copy",
  "Share",
  "Download",
  "Upload",
  "RefreshCw",
  "RotateCw",
  "Power",
  "Play",
  "Pause",
  "SkipForward",
  "SkipBack",
] as const;

type IconName = (typeof iconNames)[number];

function IconDrawer({
  selectedIconName,
  onSelectIcon,
  children,
}: {
  selectedIconName: string | null;
  onSelectIcon: (iconName: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const handleIconSelect = (iconName: IconName) => {
    onSelectIcon(iconName);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>아이콘 선택</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <div className="grid grid-cols-4 gap-3 pt-2">
            {iconNames.map((iconName) => {
              const Icon = (LucideIcons as any)[iconName] as
                | LucideIcon
                | undefined;
              if (!Icon) return null;

              const isSelected = selectedIconName === iconName;

              return (
                <button
                  key={iconName}
                  onClick={() => handleIconSelect(iconName)}
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
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isSelected ? "text-primary-foreground" : ""
                    )}
                  >
                    {iconName}
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

export default function AddCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");
  const typeParam = searchParams.get("type") as "expense" | "income" | null;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      icon: null,
      type: typeParam || "expense",
    },
  });

  const createCategory = useCreateCategory();

  useEffect(() => {
    if (!bookId) {
      toast.error("가계부 정보가 없습니다.");
      router.push("/book/category");
    }
  }, [bookId, router]);

  const handleBack = () => {
    router.push("/book/category");
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!bookId) {
      toast.error("가계부 정보가 없습니다.");
      return;
    }

    createCategory.mutate(
      {
        bookId,
        data: {
          name: data.name.trim(),
          icon: data.icon,
          type: data.type,
        },
      },
      {
        onSuccess: () => {
          router.push("/book/category");
        },
      }
    );
  };

  const selectedIconName = form.watch("icon");
  const selectedIcon = selectedIconName
    ? ((LucideIcons as any)[selectedIconName] as LucideIcon)
    : null;

  return (
    <AppLayout
      title="카테고리 추가"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack} disabled={createCategory.isPending}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={form.handleSubmit(onSubmit)}
          disabled={createCategory.isPending || !form.watch("name")?.trim()}
        >
          {createCategory.isPending ? (
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
          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <IconDrawer
                      selectedIconName={field.value || null}
                      onSelectIcon={field.onChange}
                    >
                      <Button type="button" variant="outline" size="icon" className="size-12">
                        {selectedIcon ? (
                          <selectedIcon className="size-6" />
                        ) : (
                          <Plus className="size-6" />
                        )}
                      </Button>
                    </IconDrawer>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="카테고리명을 입력하세요"
                      {...field}
                      disabled={form.formState.isSubmitting}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리 타입</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={field.value === "expense" ? "default" : "outline"}
                      onClick={() => field.onChange("expense")}
                      disabled={form.formState.isSubmitting}
                      className="flex-1"
                    >
                      지출
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "income" ? "default" : "outline"}
                      onClick={() => field.onChange("income")}
                      disabled={form.formState.isSubmitting}
                      className="flex-1"
                    >
                      수입
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </AppLayout>
  );
}
