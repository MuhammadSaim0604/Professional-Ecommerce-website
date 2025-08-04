import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type?: 'product-card' | 'category-card' | 'banner' | 'flash-sale';
  count?: number;
}

const LoadingSkeleton = memo(({ type = 'product-card', count = 1 }: LoadingSkeletonProps) => {
  const renderProductCardSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );

  const renderCategoryCardSkeleton = () => (
    <div className="flex flex-col items-center space-y-2">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );

  const renderBannerSkeleton = () => (
    <Skeleton className="h-96 w-full rounded-lg" />
  );

  const renderFlashSaleSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'product-card':
        return renderProductCardSkeleton();
      case 'category-card':
        return renderCategoryCardSkeleton();
      case 'banner':
        return renderBannerSkeleton();
      case 'flash-sale':
        return renderFlashSaleSkeleton();
      default:
        return renderProductCardSkeleton();
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
});

LoadingSkeleton.displayName = "LoadingSkeleton";

export default LoadingSkeleton;