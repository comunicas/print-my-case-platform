import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const TabSkeleton = React.forwardRef<HTMLDivElement>(
  (props, ref) => (
    <div ref={ref} className="space-y-4" {...props}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
);
TabSkeleton.displayName = "TabSkeleton";
