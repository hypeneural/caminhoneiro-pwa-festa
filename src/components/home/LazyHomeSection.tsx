import { ReactNode, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyHomeSectionProps {
  children: ReactNode;
  minHeight?: string;
  rootMargin?: string;
}

export function LazyHomeSection({
  children,
  minHeight = "min-h-56",
  rootMargin = "720px"
}: LazyHomeSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;

    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return (
    <div ref={ref} className={shouldRender ? undefined : minHeight}>
      {shouldRender ? children : <Skeleton className={`${minHeight} w-full rounded-2xl`} />}
    </div>
  );
}
