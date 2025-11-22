"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

type ThemeMode = "light" | "dark" | "system";

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 클라이언트 사이드에서만 렌더링
  useEffect(() => {
    setMounted(true);
  }, []);

  // 현재 테마 모드 결정
  const currentMode: ThemeMode = (theme as ThemeMode) || "system";
  const isDark = resolvedTheme === "dark";

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current || !mounted) return;

    // 테마 순환: light -> dark -> system -> light
    const themeOrder: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = themeOrder.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [currentMode, setTheme, mounted, duration]);

  // 아이콘 결정
  const getIcon = () => {
    if (!mounted) return <Monitor />;
    if (currentMode === "system") return <Monitor />;
    if (currentMode === "dark") return <Sun />;
    return <Moon />;
  };

  // 접근성 라벨
  const getLabel = () => {
    if (!mounted) return "테마 전환";
    if (currentMode === "system") return "시스템 설정 따르기";
    if (currentMode === "dark") return "라이트 모드로 전환";
    return "다크 모드로 전환";
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      aria-label={getLabel()}
      {...props}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </button>
  );
};
