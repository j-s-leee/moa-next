import { CategoryList, categories } from "./category-list"
import { CategorySpendingOverview } from "./category-spending-overview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BudgetDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        

        {/* Period Tabs */}
        <div className="px-4">
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="monthly">월간</TabsTrigger>
              <TabsTrigger value="yearly">연간</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="mt-4 space-y-4">
              <CategorySpendingOverview categories={categories} period="monthly" />

              <CategoryList period="monthly" />
            </TabsContent>

            <TabsContent value="yearly" className="mt-4 space-y-4">
              <CategorySpendingOverview categories={categories} period="yearly" />

              <CategoryList period="yearly" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
