import { Copy, FileSearch, Mail } from "lucide-react";
import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu.tsx";

type BriefContextMenuProps = {
  children: ReactNode;
  className?: string;
  canShowSource?: boolean;
  onCopy: () => void;
  onEmail: () => void;
  onShowSource: () => void;
};

export function BriefContextMenu({
  children,
  className,
  canShowSource = false,
  onCopy,
  onEmail,
  onShowSource,
}: BriefContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onCopy}>
          <Copy />
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={onEmail}>
          <Mail />
          Send email
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!canShowSource} onClick={onShowSource}>
          <FileSearch />
          Show note source
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
