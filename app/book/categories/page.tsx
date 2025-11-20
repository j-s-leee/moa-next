"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  ShoppingCart,
  Coffee,
  Home,
  Car,
  Wallet,
  PiggyBank,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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

// 개인 카테고리
const initialPersonalExpenseCategories: {
  id: string;
  name: string;
  icon: LucideIcon;
}[] = [
  { id: "1", name: "식비", icon: UtensilsCrossed },
  { id: "2", name: "쇼핑", icon: ShoppingCart },
  { id: "3", name: "카페", icon: Coffee },
  { id: "4", name: "주거", icon: Home },
  { id: "5", name: "교통", icon: Car },
];

const initialPersonalIncomeCategories: {
  id: string;
  name: string;
  icon: LucideIcon;
}[] = [
  { id: "6", name: "급여", icon: Wallet },
  { id: "7", name: "용돈", icon: PiggyBank },
];

// 공동 카테고리
const initialSharedExpenseCategories: {
  id: string;
  name: string;
  icon: LucideIcon;
}[] = [
  { id: "8", name: "공동 식비", icon: UtensilsCrossed },
  { id: "9", name: "공동 쇼핑", icon: ShoppingCart },
];

const initialSharedIncomeCategories: {
  id: string;
  name: string;
  icon: LucideIcon;
}[] = [{ id: "10", name: "공동 수입", icon: Wallet }];

interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    icon: LucideIcon;
  };
  onEdit: (category: { id: string; name: string; icon: LucideIcon }) => void;
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

  const Icon = category.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium">{category.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(category)}
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">수정</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">삭제</span>
        </Button>
      </div>
    </div>
  );
}

function CategoryList({
  categories,
  onEdit,
  onDelete,
  onReorder,
}: {
  categories: { id: string; name: string; icon: LucideIcon }[];
  onEdit: (category: { id: string; name: string; icon: LucideIcon }) => void;
  onDelete: (id: string) => void;
  onReorder: (newOrder: { id: string; name: string; icon: LucideIcon }[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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

export default function CategoriesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [personalExpenseCategories, setPersonalExpenseCategories] = useState(
    initialPersonalExpenseCategories
  );
  const [personalIncomeCategories, setPersonalIncomeCategories] = useState(
    initialPersonalIncomeCategories
  );
  const [sharedExpenseCategories, setSharedExpenseCategories] = useState(
    initialSharedExpenseCategories
  );
  const [sharedIncomeCategories, setSharedIncomeCategories] = useState(
    initialSharedIncomeCategories
  );

  const handleEdit = (category: {
    id: string;
    name: string;
    icon: LucideIcon;
  }) => {
    // TODO: 카테고리 수정 모달/다이얼로그 구현
    console.log("수정", category);
  };

  const handleDelete = (id: string) => {
    // TODO: 삭제 확인 다이얼로그 구현
    if (confirm("정말 삭제하시겠습니까?")) {
      setPersonalExpenseCategories((prev) =>
        prev.filter((c) => c.id !== id)
      );
      setPersonalIncomeCategories((prev) =>
        prev.filter((c) => c.id !== id)
      );
      setSharedExpenseCategories((prev) => prev.filter((c) => c.id !== id));
      setSharedIncomeCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleAdd = () => {
    // TODO: 카테고리 추가 모달/다이얼로그 구현
    console.log("추가");
  };

  return (
    <AppLayout
      title="카테고리 관리"
      leftAction={
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">뒤로가기</span>
        </Button>
      }
      rightAction={
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          추가
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expense" | "income")}>
          <TabsList className="mx-auto mb-6">
            <TabsTrigger value="expense">지출</TabsTrigger>
            <TabsTrigger value="income">수입</TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">개인 카테고리</h2>
              <CategoryList
                categories={personalExpenseCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={setPersonalExpenseCategories}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3">공동 카테고리</h2>
              <CategoryList
                categories={sharedExpenseCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={setSharedExpenseCategories}
              />
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">개인 카테고리</h2>
              <CategoryList
                categories={personalIncomeCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={setPersonalIncomeCategories}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3">공동 카테고리</h2>
              <CategoryList
                categories={sharedIncomeCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={setSharedIncomeCategories}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

