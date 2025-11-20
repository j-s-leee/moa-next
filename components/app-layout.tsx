"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

// 메인 뎁스 라우트 목록
const MAIN_ROUTES = ["/summary", "/book", "/shared"];

function isMainRoute(pathname: string): boolean {
  return MAIN_ROUTES.includes(pathname);
}

export function AppLayout({
  children,
  breadcrumbs,
  title,
  leftAction,
  rightAction,
}: AppLayoutProps) {
  const pathname = usePathname();
  const isMain = isMainRoute(pathname);
  const isSubRoute = !isMain && pathname !== "/";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {isSubRoute && (title || leftAction || rightAction) ? (
          // 하위 라우트용 헤더: 중앙 타이틀, 좌우 액션 버튼
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex w-full items-center justify-between px-4">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {leftAction}
              </div>
              {title && (
                <h1 className="flex-1 text-center font-semibold truncate">
                  {title}
                </h1>
              )}
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                {rightAction}
              </div>
            </div>
          </header>
        ) : (
          // 메인 뎁스용 헤더: 사이드바 트리거 + 브레드크럼
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                        <BreadcrumbItem
                          className={index === 0 ? "hidden md:block" : ""}
                        >
                          {crumb.href ? (
                            <BreadcrumbLink href={crumb.href}>
                              {crumb.label}
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>
          </header>
        )}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
