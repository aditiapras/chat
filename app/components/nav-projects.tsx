import {
  Folder,
  MoreHorizontal,
  Pin,
  Share,
  TextCursor,
  Trash2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function NavProjects({
  threads,
}: {
  threads: {
    id: string;
    title: string | null;
    isGeneratingTitle?: boolean;
  }[];
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Threads</SidebarGroupLabel>
      <SidebarMenu>
        {threads.map((item) => (
          <SidebarMenuItem key={item.id}>
            <Tooltip delayDuration={1000} >
              <SidebarMenuButton asChild>
                <TooltipTrigger asChild>
                  <Link to={`/chat/${item.id}`}>
                    <div className="flex items-center gap-2 truncate">
                      {(!item.title || item.isGeneratingTitle) && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      <span
                        className={!item.title ? "text-muted-foreground" : ""}
                      >
                        {item.title || "Generating..."}
                      </span>
                    </div>
                  </Link>
                </TooltipTrigger>
              </SidebarMenuButton>
              <TooltipContent align="start">{item.title}</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Pin className="text-muted-foreground" />
                  <span>Pin Thread</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <TextCursor className="text-muted-foreground" />
                  <span>Rename Thread</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Thread</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
