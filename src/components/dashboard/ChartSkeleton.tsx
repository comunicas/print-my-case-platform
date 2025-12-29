import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="flex-1 px-4 md:px-6 pb-4 md:pb-6">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}
