import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Skeleton variants for different content types
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

function CarouselSkeleton({ itemCount = 3, itemWidth = "w-80" }: { itemCount?: number; itemWidth?: string }) {
  return (
    <div className="flex gap-4 px-4">
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className={cn("flex-shrink-0", itemWidth)}>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function GridSkeleton({ itemCount = 9, columns = 3 }: { itemCount?: number; columns?: number }) {
  return (
    <div className={cn("grid gap-3", `grid-cols-${columns}`)}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  )
}

function TrackerSkeleton() {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-5 w-48" />
      </div>
      
      <div className="p-4 space-y-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <Skeleton className="h-32 w-full rounded-lg" />
        
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <Skeleton className="w-5 h-5 mb-2" />
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
        
        <div className="space-y-3 pt-2 border-t">
          <Skeleton className="h-8 w-24" />
          <div className="p-3 bg-muted/30 rounded-lg">
            <Skeleton className="h-3 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  CardSkeleton, 
  CarouselSkeleton, 
  GridSkeleton, 
  TrackerSkeleton 
}