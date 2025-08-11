import { AppSidebar } from "~/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "~/components/ui/sidebar";
import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import { ClerkLoading, ClerkLoaded, UserButton } from "@clerk/react-router";
import { Skeleton } from "~/components/ui/skeleton";
import { ScrollArea } from "~/components/ui/scroll-area";

export async function loader(args: Route.LoaderArgs) {
    const { userId, sessionClaims } = await getAuth(args);

    if (!userId) {
        return redirect("/sign-in");
    }
    return {
        userId,
        sessionClaims: {
            fullName: sessionClaims.fullName as string,
            imageUrl: sessionClaims.imageUrl as string,
            firstName: sessionClaims.firstName as string,
            email: sessionClaims.email as string,
        },
    };
}

export default function Page({ loaderData }: Route.ComponentProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center rounded-xl bg-gradient-to-t from-transparent via-background to-background gap-2 justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                    <div className="flex items-center gap-2 px-4 text-sm font-medium">
                        Hi, {loaderData.sessionClaims.firstName}
                        <ClerkLoading>
                            <Skeleton className="size-7 rounded-full" />
                        </ClerkLoading>
                        <ClerkLoaded>
                            <UserButton />
                        </ClerkLoaded>
                    </div>
                </header>
                {/* <ScrollArea> */}
                <Outlet />
                {/* </ScrollArea> */}
            </SidebarInset>
        </SidebarProvider>
    )
}
