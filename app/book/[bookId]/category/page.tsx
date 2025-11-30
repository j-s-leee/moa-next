"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Loader2,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCategories, useDeleteCategory, useReorderCategories } from "@/lib/react-query/queries";

// 카테고리 타입 정의
interface Category {
  id: string;
  bookId: string;
  name: string;
  icon: string | null;
  type: "expense" | "income";
  expenseType: "fixed" | "variable" | "annual" | "one-time" | null;
  autoDetectedType: "fixed" | "variable" | null;
  lastTypeCheckDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 아이콘 동적 로드
  const IconComponent = category.icon
    ? ((LucideIcons as any)[category.icon] as LucideIcon) || null
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <Button
        {...attributes}
        {...listeners}
        variant="ghost"
        size="icon"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
        {IconComponent ? (
          <IconComponent className="h-5 w-5 text-muted-foreground" />
        ) : (
          <span className="text-lg">{category.icon || "📦"}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium">{category.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">수정</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">삭제</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 "{category.name}" 카테고리를 삭제하시겠습니까?
                <br />
                <br />
                이 작업은 되돌릴 수 없으며, 다음 데이터가 함께 삭제됩니다:
                <br />
                • 이 카테고리의 모든 지출 내역
                <br />• 이 카테고리의 모든 예산
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(category.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function CategoryList({
  categories,
  onEdit,
  onDelete,
  onReorder,
  isLoading,
}: {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onReorder: (newOrder: Category[]) => void;
  isLoading: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.style.overflow = "";
    document.body.style.touchAction = "";

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        카테고리가 없습니다.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  // 카테고리 목록 조회
  const { data: categoriesData, isLoading } = useCategories(bookId);
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  const expenseCategories = (categoriesData?.categories || []).filter(
    (cat) => cat.type === "expense"
  ) as Category[];
  const incomeCategories = (categoriesData?.categories || []).filter(
    (cat) => cat.type === "income"
  ) as Category[];

  const handleEdit = (category: Category) => {
    // TODO: 카테고리 수정 모달/다이얼로그 구현
    router.push(`/book/${bookId}/category/edit/${category.id}`);
  };

  const handleDelete = (id: string) => {
    if (!bookId) return;

    deleteCategory.mutate({ bookId, categoryId: id });
  };

  const handleReorder = (newOrder: Category[]) => {
    if (!bookId) return;

    const categoryIds = newOrder.map((c) => c.id);
    reorderCategories.mutate({ bookId, categoryIds });
  };

  const handleAdd = () => {
    if (!bookId) {
      toast.error("가계부를 찾을 수 없습니다.");
      return;
    }
    router.push(`/book/${bookId}/category/add?type=${activeTab}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/book`);
    }
  };

  const currentCategories =
    activeTab === "expense" ? expenseCategories : incomeCategories;

  return (
    <AppLayout
      title="카테고리 관리"
      leftAction={
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <Button variant="ghost" size="icon" onClick={handleAdd}>
          <Plus className="size-4" />
          <span className="sr-only">추가</span>
        </Button>
      }
    >
      <div className="">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "expense" | "income")}
        >
          <TabsList className="mx-auto mb-6">
            <TabsTrigger value="expense">지출</TabsTrigger>
            <TabsTrigger value="income">수입</TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold mb-3">개인 카테고리</h2>
              <CategoryList
                categories={expenseCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold mb-3">개인 카테고리</h2>
              <CategoryList
                categories={incomeCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
