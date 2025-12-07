"use client";

import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item";

export interface InfoRow {
  label: string;
  amount: number;
}

export function InfoCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon?: React.ElementType;
  rows: InfoRow[];
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
        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="font-semibold">{row.amount.toLocaleString()}원</p>
            </div>
          ))}
        </div>
      </ItemContent>
    </Item>
  );
}

