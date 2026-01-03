import { Card, CardContent } from "@/components/ui/card";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";

interface PublicStockListSkeletonProps {
  count?: number;
  showQrIcon?: boolean;
}

const productWidths = ["w-28", "w-36", "w-32", "w-24", "w-40", "w-30"];

export function PublicStockListSkeleton({ 
  count = 6, 
  showQrIcon = false 
}: PublicStockListSkeletonProps) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <Card 
          key={i} 
          className="overflow-hidden animate-fade-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <CardContent className="flex items-center justify-between py-3 px-4">
            <div className="flex items-center gap-3">
              <SkeletonShimmer className="h-8 w-8 rounded-md flex-shrink-0" />
              <SkeletonShimmer className={`h-4 ${productWidths[i % productWidths.length]}`} />
            </div>
            
            <div className="flex items-center gap-2">
              <SkeletonShimmer className="h-5 w-20 rounded-full" />
              {showQrIcon && (
                <SkeletonShimmer className="h-4 w-4 rounded" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
