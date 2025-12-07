"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";

export function SummaryCard({
  title,
  amount,
  icon: Icon,
  subtitle,
}: {
  title: string;
  amount: number;
  icon?: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Item variant="outline" className="bg-card dark:border-none">
      <ItemHeader>
        <ItemTitle>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          {title}
        </ItemTitle>
      </ItemHeader>
      <ItemContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold">{amount.toLocaleString()}원</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </ItemContent>
    </Item>
  );
}

