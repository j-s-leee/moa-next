"use client"

import type React from "react"
import type { LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"

interface CategoryDonutChartProps {
  percentage: number
  color: string
  /** 아이콘 (Lucide 아이콘 이름 문자열, 이모지 문자열, 또는 Lucide 아이콘 컴포넌트) */
  icon: string | React.ReactNode
  isOverBudget?: boolean
}

export function CategoryDonutChart({ percentage, color, icon, isOverBudget = false }: CategoryDonutChartProps) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min((100 - percentage), 100) / 100) * circumference

  // 아이콘 렌더링 로직 (category/page.tsx와 동일한 방식)
  const renderIcon = () => {
    // React.ReactNode인 경우 (기존 호환성)
    if (typeof icon !== "string") {
      return icon
    }

    // 문자열인 경우: Lucide 아이콘 컴포넌트로 변환 시도
    const IconComponent = icon
      ? ((LucideIcons as any)[icon] as LucideIcon) || null
      : null

    if (IconComponent) {
      return <IconComponent className="w-5 h-5" />
    }

    // Lucide 아이콘이 아니면 이모지로 렌더링
    return <span className="text-lg">{icon || "📦"}</span>
  }

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted"
          opacity="0.2"
        />
        {/* Progress circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={isOverBudget ? "oklch(0.58 0.25 25)" : color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Icon in center */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: isOverBudget ? "oklch(0.58 0.25 25)" : color }}
      >
        {renderIcon()}
      </div>
    </div>
  )
}
