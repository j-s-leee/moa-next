"use client"

import { useState } from "react"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CategoryData {
  name: string
  spent: number
  budget?: number
  budgetPeriod?: "monthly" | "yearly"
  color: string
}

interface CategorySpendingOverviewProps {
  categories: CategoryData[]
}

export function CategorySpendingOverview({ categories }: CategorySpendingOverviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0)

  if (categories.length === 0) {
    return null
  }

  const sortedCategories = categories.sort((a, b) => b.spent - a.spent)

  const handleCategoryClick = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index)
  }

  return (
    <TooltipProvider>
      <Item variant="outline" className="bg-card dark:border-none">
        <ItemHeader>
          <ItemTitle>카테고리별 지출 분포</ItemTitle>
        </ItemHeader>
        <ItemContent>
          {/* Stacked Progress Bar */}
          <div className="relative w-full h-6 bg-muted rounded-sm overflow-hidden flex gap-0.5">
            {sortedCategories.map((category, index) => {
              const percentage = (category.spent / totalSpent) * 100

              // Skip if percentage is too small to show
              if (percentage < 0.5) return null

              const isSelected = selectedIndex === index

              return (
                <Tooltip key={index} open={isSelected ? true : undefined}>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full transition-all hover:opacity-80 cursor-pointer touch-manipulation"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category.color,
                      }}
                      onClick={() => handleCategoryClick(index)}
                      onTouchStart={() => handleCategoryClick(index)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-muted-foreground text-xs">
                        ₩{category.spent.toLocaleString()} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {categories.map((category, index) => {
              const percentage = (category.spent / totalSpent) * 100

              return (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="text-muted-foreground">{category.name}</span>
                  <span className="font-medium text-foreground">{percentage.toFixed(1)}%</span>
                </div>
              )
            })}
          </div>
        </ItemContent>
      </Item>
    </TooltipProvider>
  )
}
