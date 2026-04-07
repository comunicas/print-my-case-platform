import { cn } from "@/lib/utils";

type SkeletonShimmerProps = React.HTMLAttributes<HTMLDivElement>;

function SkeletonShimmer({ className, ...props }: SkeletonShimmerProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { SkeletonShimmer };
