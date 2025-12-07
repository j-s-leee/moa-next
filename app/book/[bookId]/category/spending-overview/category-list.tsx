"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Utensils, Car, Heart, Home, Smartphone, Plus, AlertCircle, TrendingUp } from "lucide-react"
import { CategoryDonutChart } from "./category-donut-chart"

interface CategoryData {
  id: string
  name: string
  icon: React.ElementType
  spent: number
  budget?: number
  budgetPeriod?: "monthly" | "yearly"
  color: string
}

export const categories: CategoryData[] = [
  {
    id: "1",
    name: "식비",
    icon: Utensils,
    spent: 450000,
    budget: 600000,
    budgetPeriod: "monthly",
    color: "oklch(0.55 0.22 265)",
  },
  {
    id: "2",
    name: "통신",
    icon: Smartphone,
    spent: 97500,
    budget: 120000,
    budgetPeriod: "monthly",
    color: "oklch(0.50 0.20 200)",
  },
  {
    id: "3",
    name: "주거",
    icon: Home,
    spent: 350000,
    budget: 800000,
    budgetPeriod: "monthly",
    color: "oklch(0.45 0.20 300)",
  },
  {
    id: "4",
    name: "건강",
    icon: Heart,
    spent: 1500000,
    budget: 3000000,
    budgetPeriod: "yearly",
    color: "oklch(0.58 0.25 25)",
  },
  {
    id: "5",
    name: "쇼핑",
    icon: ShoppingBag,
    spent: 2200000,
    budget: 2000000,
    budgetPeriod: "yearly",
    color: "oklch(0.75 0.15 85)",
  },
  {
    id: "6",
    name: "교통",
    icon: Car,
    spent: 280000,
    // No budget set
    color: "oklch(0.65 0.25 160)",
  },
]

interface CategoryListProps {
  period: "monthly" | "yearly"
}

export function CategoryList({ period }: CategoryListProps) {
  const categoriesWithBudget = categories.filter((cat) => cat.budget && cat.budgetPeriod === period)
  const categoriesWithoutBudget = categories.filter((cat) => !cat.budget)

  return (
    <div className="space-y-4 pb-6">
      {/* Categories with budget */}
      {categoriesWithBudget.length > 0 && (
        <div className="space-y-3">
          {categoriesWithBudget.map((category) => {
            const percentage = category.budget ? Math.min((category.spent / category.budget) * 100, 100) : 0
            const isOverBudget = category.budget && category.spent > category.budget
            const remaining = category.budget ? category.budget - category.spent : 0

            const Icon = category.icon

            return (
              <Card key={category.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Donut Chart */}
                    <div className="shrink-0">
                      <CategoryDonutChart
                        percentage={percentage}
                        color={category.color}
                        icon={<Icon className="w-4 h-4" />}
                        isOverBudget={!!isOverBudget}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        {isOverBudget && (
                          <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                            <TrendingUp className="w-3 h-3" />
                            초과
                          </div>
                        )}
                      </div>

                      {/* Amounts */}
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-lg font-bold text-foreground">₩{category.spent.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">/ ₩{category.budget?.toLocaleString()}</span>
                      </div>

                      {/* Percentage and Remaining Amount */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {percentage.toFixed(0)}% 사용
                        </span>
                        <span className={remaining < 0 ? "text-destructive font-medium" : "text-accent font-medium"}>
                          {remaining >= 0
                            ? `₩${remaining.toLocaleString()} 남음`
                            : `₩${Math.abs(remaining).toLocaleString()} 초과`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {period === "monthly" && categoriesWithoutBudget.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-medium text-muted-foreground">예산 미설정</h3>
          </div>

          {categoriesWithoutBudget.map((category) => {
            const Icon = category.icon

            return (
              <Card key={category.id} className="border-dashed bg-muted/30 hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">₩{category.spent.toLocaleString()} 지출</p>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="flex items-center gap-1.5 bg-transparent">
                      <Plus className="w-3.5 h-3.5" />
                      예산 설정
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
