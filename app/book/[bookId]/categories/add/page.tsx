"use client";

import { useState } from "react";
import * as React from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Plus, Loader2, Smile, type LucideIcon } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";

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

// 인기 이모지 목록 (카테고리용)
const popularEmojis = [
  { emoji: "🍽️", name: "식비" },
  { emoji: "🚗", name: "교통" },
  { emoji: "🏠", name: "주거" },
  { emoji: "📱", name: "통신" },
  { emoji: "🏥", name: "의료" },
  { emoji: "📚", name: "교육" },
  { emoji: "👕", name: "의류" },
  { emoji: "🎬", name: "문화" },
  { emoji: "🎨", name: "취미" },
  { emoji: "🎁", name: "선물" },
  { emoji: "💰", name: "급여" },
  { emoji: "💵", name: "부수입" },
  { emoji: "💴", name: "용돈" },
  { emoji: "☕", name: "카페" },
  { emoji: "🍕", name: "음식" },
  { emoji: "✈️", name: "여행" },
  { emoji: "🏋️", name: "운동" },
  { emoji: "🎵", name: "음악" },
  { emoji: "🎮", name: "게임" },
  { emoji: "🛒", name: "쇼핑" },
  { emoji: "💊", name: "건강" },
  { emoji: "🐕", name: "반려동물" },
  { emoji: "📦", name: "기타" },
];

function IconDrawer({
  selectedIcon,
  onSelectIcon,
  children,
}: {
  selectedIcon: string | null;
  onSelectIcon: (icon: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [iconTab, setIconTab] = useState<"lucide" | "emoji">("lucide");

  const handleLucideIconSelect = (iconName: IconName) => {
    onSelectIcon(iconName);
    setOpen(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    onSelectIcon(emoji);
    setOpen(false);
  };

  // 선택된 아이콘 타입 확인
  const isLucideIcon = selectedIcon && iconNames.includes(selectedIcon as IconName);
  const isEmoji = selectedIcon && !isLucideIcon;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>아이콘 선택</DrawerTitle>
          <DrawerDescription>
            Lucide 아이콘 또는 이모지를 선택할 수 있습니다
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          <Tabs value={iconTab} onValueChange={(v) => setIconTab(v as "lucide" | "emoji")}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="lucide" className="flex-1">
                Lucide 아이콘
              </TabsTrigger>
              <TabsTrigger value="emoji" className="flex-1">
                이모지
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lucide" className="mt-0">
              <div className="grid grid-cols-4 gap-3">
                {iconNames.map((iconName) => {
                  const Icon = (LucideIcons as any)[iconName] as
                    | LucideIcon
                    | undefined;
                  if (!Icon) return null;

                  const isSelected = selectedIcon === iconName;

                  return (
                    <button
                      key={iconName}
                      onClick={() => handleLucideIconSelect(iconName)}
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
            </TabsContent>

            <TabsContent value="emoji" className="mt-0">
              <div className="grid grid-cols-4 gap-3">
                {popularEmojis.map((item) => {
                  const isSelected = selectedIcon === item.emoji;

                  return (
                    <button
                      key={item.emoji}
                      onClick={() => handleEmojiSelect(item.emoji)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-md text-2xl",
                          isSelected ? "bg-primary-foreground/20" : "bg-muted"
                        )}
                      >
                        {item.emoji}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium text-center leading-tight",
                          isSelected ? "text-primary-foreground" : ""
                        )}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default function AddCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;
  const typeParam = searchParams.get("type") as "expense" | "income" | null;

  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [categoryType, setCategoryType] = useState<"expense" | "income">(
    typeParam || "expense"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleIconSelect = (icon: string) => {
    setSelectedIcon(icon);
  };

  const handleBack = () => {
    router.push(`/book/${bookId}/categories`);
  };

  const handleSave = async () => {
    if (!bookId) {
      toast.error("가계부 정보가 없습니다.");
      return;
    }

    if (!categoryName.trim()) {
      toast.error("카테고리 이름을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/book/${bookId}/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          icon: selectedIcon,
          type: categoryType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "카테고리 생성 실패");
      }

      toast.success("카테고리가 생성되었습니다.");
      router.push(`/book/${bookId}/categories`);
    } catch (error) {
      console.error("카테고리 생성 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "카테고리 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 선택된 아이콘 렌더링용 컴포넌트
  const isLucideIcon = selectedIcon && iconNames.includes(selectedIcon as IconName);
  const SelectedIconComponent = isLucideIcon
    ? ((LucideIcons as any)[selectedIcon] as LucideIcon)
    : null;

  return (
    <AppLayout
      title="카테고리 추가"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack} disabled={isSaving}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isSaving || !categoryName.trim()}
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
        <div className="flex items-center gap-2">
          <IconDrawer
            selectedIcon={selectedIcon}
            onSelectIcon={handleIconSelect}
          >
            <Button variant="outline" size="icon" className="size-12">
              {SelectedIconComponent ? (
                <SelectedIconComponent className="size-6" />
              ) : selectedIcon ? (
                <span className="text-xl">{selectedIcon}</span>
              ) : (
                <Plus className="size-6" />
              )}
            </Button>
          </IconDrawer>

          <Input
            id="name"
            placeholder="카테고리명을 입력하세요"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={isSaving}
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">카테고리 타입</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={categoryType === "expense" ? "default" : "outline"}
              onClick={() => setCategoryType("expense")}
              disabled={isSaving}
              className="flex-1"
            >
              지출
            </Button>
            <Button
              type="button"
              variant={categoryType === "income" ? "default" : "outline"}
              onClick={() => setCategoryType("income")}
              disabled={isSaving}
              className="flex-1"
            >
              수입
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

