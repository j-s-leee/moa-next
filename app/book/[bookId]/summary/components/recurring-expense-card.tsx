"use client";

import { InfoCard, type InfoRow } from "./info-card";

export function RecurringExpenseCard({
  recurringExpensesData,
}: {
  recurringExpensesData: {
    scheduled: { amount: number; date: Date }[];
    completed: { amount: number; date: Date }[];
  };
}) {
  const scheduledCount = recurringExpensesData.scheduled.length;
  const completedCount = recurringExpensesData.completed.length;
  const scheduledAmount = recurringExpensesData.scheduled.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const completedAmount = recurringExpensesData.completed.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const rows: InfoRow[] = [
    {
      label: `예정 ${scheduledCount}건`,
      amount: scheduledAmount,
    },
    {
      label: `완료 ${completedCount}건`,
      amount: completedAmount,
    },
  ];

  return <InfoCard title="정기지출" rows={rows} />;
}

