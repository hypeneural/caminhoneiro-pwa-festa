import { forwardRef } from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface AccessibleButtonProps extends ButtonProps {
  "aria-label": string;
  touchTarget?: boolean;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ className, touchTarget = true, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          touchTarget && "min-h-[44px] min-w-[44px]", // WCAG compliant touch targets
          className
        )}
        {...props}
      />
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";