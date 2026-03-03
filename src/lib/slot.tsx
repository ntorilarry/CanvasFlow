"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const SlotInternal = React.forwardRef<
  HTMLElement,
  SlotProps & { children: React.ReactElement }
>(({ children, className, ...props }) => {
  const childClassName = (children.props as React.HTMLAttributes<HTMLElement>)
    ?.className;

  const mergedProps = {
    ...props,
    ...(children.props as Record<string, unknown>),
    className: cn(childClassName, className),
  };

  return React.cloneElement(children, mergedProps);
});
SlotInternal.displayName = "SlotInternal";

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ asChild, children, className, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <SlotInternal ref={ref} className={className} {...props}>
          {children}
        </SlotInternal>
      );
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Slot.displayName = "Slot";
