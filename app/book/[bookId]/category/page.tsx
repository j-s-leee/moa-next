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
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  // 카테고리 목록 조회
  useEffect(() => {
    if (!bookId) return;

    async function fetchCategories() {
      setIsLoading(true);
      try {
        // 지출 카테고리 조회
        const expenseResponse = await fetch(
          `/api/book/${bookId}/category?type=expense`
        );
        if (expenseResponse.ok) {
          const expenseData = await expenseResponse.json();
          setExpenseCategories(expenseData.categories || []);
        }

        // 수입 카테고리 조회
        const incomeResponse = await fetch(
          `/api/book/${bookId}/category?type=income`
        );
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          setIncomeCategories(incomeData.categories || []);
        }
      } catch (error) {
        console.error("카테고리 조회 오류:", error);
        toast.error("카테고리를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, [bookId]);

  const handleEdit = (category: Category) => {
    // TODO: 카테고리 수정 모달/다이얼로그 구현
    router.push(`/book/${bookId}/category/edit/${category.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!bookId) return;

    try {
      const response = await fetch(`/api/book/${bookId}/category/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "삭제 실패");
      }

      toast.success("카테고리가 삭제되었습니다.");

      // 목록에서 제거
      setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
      setIncomeCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("카테고리 삭제 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "카테고리 삭제 중 오류가 발생했습니다."
      );
    }
  };

  const handleReorder = async (newOrder: Category[]) => {
    if (!bookId || isReordering) return;

    setIsReordering(true);
    try {
      const categoryIds = newOrder.map((c) => c.id);
      const response = await fetch(`/api/book/${bookId}/category/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "순서 변경 실패");
      }

      // 현재 탭에 따라 상태 업데이트
      if (activeTab === "expense") {
        setExpenseCategories(newOrder);
      } else {
        setIncomeCategories(newOrder);
      }
    } catch (error) {
      console.error("카테고리 순서 변경 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "카테고리 순서 변경 중 오류가 발생했습니다."
      );
      // 오류 발생 시 목록 다시 조회
      if (bookId) {
        const response = await fetch(
          `/api/book/${bookId}/category?type=${activeTab}`
        );
        if (response.ok) {
          const data = await response.json();
          if (activeTab === "expense") {
            setExpenseCategories(data.categories || []);
          } else {
            setIncomeCategories(data.categories || []);
          }
        }
      }
    } finally {
      setIsReordering(false);
    }
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
