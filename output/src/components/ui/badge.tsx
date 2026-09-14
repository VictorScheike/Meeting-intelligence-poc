import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils.ts";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        accent: "border-transparent bg-accent/10 text-accent",
        internal: "border-transparent bg-[#1e3a56]/10 text-[#1e3a56]",
        client: "border-transparent bg-accent/10 text-accent",
        technical: "border-transparent bg-[#5b4d3a]/10 text-[#5b4d3a]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
