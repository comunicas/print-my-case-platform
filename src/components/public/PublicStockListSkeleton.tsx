import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicStockListSkeletonProps {
  count?: number;
  showQrIcon?: boolean;
}

export function PublicStockListSkeleton({ 
  count = 6, 
  showQrIcon = false 
}: PublicStockListSkeletonProps) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Brand Logo Skeleton */}
              <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
              
              {/* Product Name Skeleton */}
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-32" />
              </div>
              
              {/* Status Badge Skeleton */}
              <Skeleton className="h-5 w-16 rounded-full" />
              
              {/* QR Icon Skeleton */}
              {showQrIcon && (
                <Skeleton className="h-4 w-4 rounded" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
