"use client";

import { useState } from "react";
import * as React from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Plus, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

// Lucide 아이콘 목록 (일부 주요 아이콘만 포함, 필요시 확장 가능)
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
  "Plus",
  "Minus",
  "X",
  "Check",
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
  onSelectIcon: (iconName: string, icon: LucideIcon) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const handleIconSelect = (iconName: IconName) => {
    const Icon = (LucideIcons as any)[iconName] as LucideIcon | undefined;
    if (Icon) {
      onSelectIcon(iconName, Icon);
      setOpen(false);
    }
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
  const [categoryName, setCategoryName] = useState("");
  const [selectedIconName, setSelectedIconName] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<LucideIcon | null>(null);

  const handleIconSelect = (iconName: string, icon: LucideIcon) => {
    setSelectedIconName(iconName);
    setSelectedIcon(icon);
  };

  const handleBack = () => {
    // 부모 라우트로 이동
    router.push("/book/category");
  };

  const handleSave = () => {
    // TODO: 저장 로직 구현
    console.log("저장", { categoryName, selectedIconName, selectedIcon });
    router.push("/book/category");
  };

  return (
    <AppLayout
      title="카테고리 추가"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Check className="size-4" />
          <span className="sr-only">저장</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <IconDrawer
            selectedIconName={selectedIconName}
            onSelectIcon={handleIconSelect}
          >
            <Button variant="outline" size="icon" className="size-12">
              {selectedIcon ? (
                <>
                  {React.createElement(selectedIcon, {
                    className: "size-6",
                  })}
                </>
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
          />
        </div>
      </div>
    </AppLayout>
  );
}
