"use client";

import * as React from "react";
import { IconInnerShadowTop, IconSettings } from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Book,
  ChartBar,
  ListChevronsUpDown,
  Users,
  Wallet,
} from "lucide-react";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://github.com/j-s-leee.png",
  },
  navPersonal: [
    {
      title: "요약",
      url: "/summary",
      icon: ChartBar,
    },
    {
      title: "내역",
      url: "/book",
      icon: Book,
      contextMenuItems: [],
    },
    {
      title: "카테고리 관리",
      url: "/book/category",
      icon: ListChevronsUpDown,
    },
    {
      title: "예산 관리",
      url: "/book/budget",
      icon: Wallet,
    },
  ],
  navShared: [
    {
      title: "공동관리",
      url: "/shared",
      icon: Users,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="size-5" />
                <span className="text-base font-semibold">The Moa</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain title="개인 가계부" items={data.navPersonal} />
        <NavMain title="공동 가계부" items={data.navShared} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
