import { CalendarsSidebar } from "@/app/(protected)/(calendar)/calendars-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getServerSession, requireServerSession } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireServerSession();
  void api.calendarAccounts.getAll.prefetch();

  return (
    <HydrateClient>
      <CalendarsSidebar userId={session.user.id} />
      <main className="flex min-h-screen w-full flex-col">
        <header className="flex items-center justify-between px-4 py-4">
          <SidebarTrigger />
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer">
              <Avatar>
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>
                  {session.user.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {children}
      </main>
    </HydrateClient>
  );
}
