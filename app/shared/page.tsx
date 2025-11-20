import { AppLayout } from "@/components/app-layout";

export default function SharedPage() {
  return (
    <AppLayout
      breadcrumbs={[
        { label: "홈", href: "/home" },
        { label: "공동관리" },
      ]}
    >
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">공동 가계부</p>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">멤버 관리</p>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">공동 예산</p>
        </div>
      </div>
      <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min p-6">
        <h2 className="text-2xl font-semibold mb-4">공동 관리</h2>
        <p className="text-muted-foreground">공동 가계부 및 멤버 관리가 여기에 표시됩니다.</p>
      </div>
    </AppLayout>
  );
}

