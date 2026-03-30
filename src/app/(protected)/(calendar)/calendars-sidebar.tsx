"use client";

import { AppleLogoIcon } from "@/components/icons/apple-logo";
import { ConnectAppleAccountDialog } from "@/components/connect-apple-account-dialog";
import { GoogleLogoIcon } from "@/components/icons/google-logo";
import { MicrosoftLogoIcon } from "@/components/icons/microsoft-logo";
import { ProviderLogoIcon } from "@/components/icons/provider-logo";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { getConnectCalendarUrl } from "@/lib/calendars";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  CalendarAccountProvider,
  CalendarAccountStatus,
  type CalendarAccount,
} from "@prisma/client";

import {
  ChevronRightIcon,
  EyeOffIcon,
  PlusIcon,
  RefreshCcwIcon,
  TrashIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { EventForm } from "@/app/(protected)/(calendar)/event-form";
import { useState } from "react";

export function CalendarsSidebar({ userId }: { userId: string }) {
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [appleDialogOpen, setAppleDialogOpen] = useState(false);
  const { data: calendarAccounts } = api.calendarAccounts.getAll.useQuery();
  const utils = api.useUtils();

  const { mutateAsync: setIsHidden } = api.calendars.setIsHidden.useMutation({
    onMutate: async ({ calendarId, isHidden }) => {
      // Cancel any outgoing refetches
      await utils.calendarAccounts.getAll.cancel();

      // Snapshot the previous value
      const previousData = utils.calendarAccounts.getAll.getData();

      // Optimistically update to the new value
      utils.calendarAccounts.getAll.setData(undefined, (old) => {
        if (!old) return old;

        return old.map((account) => ({
          ...account,
          calendars: account.calendars.map((calendar) =>
            calendar.id === calendarId ? { ...calendar, isHidden } : calendar,
          ),
        }));
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, { calendarId, isHidden }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        utils.calendarAccounts.getAll.setData(undefined, context.previousData);
      }
      console.error(err);
      toast.error("Failed to set calendar visibility");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      utils.calendarAccounts.getAll.invalidate();
    },
  });

  const { mutateAsync: deleteCalendarAccount } =
    api.calendarAccounts.delete.useMutation();

  const handleSetIsHidden = async (calendarId: string, isHidden: boolean) => {
    try {
      await setIsHidden({ calendarId, isHidden });
    } catch (error) {
      console.error(error);
      toast.error("Failed to set calendar visibility");
    }
  };

  const handleRefreshConnection = async (account: CalendarAccount) => {
    if (account.provider === CalendarAccountProvider.APPLE) {
      setAppleDialogOpen(true);
      return;
    }

    try {
      window.location.href = getConnectCalendarUrl({
        provider: account.provider,
        userId,
        loginHint: account.email,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh connection");
    }
  };

  const handleDeleteCalendarAccount = async (account: CalendarAccount) => {
    try {
      const result = confirm(
        "Are you sure you want to disconnect this calendar account?",
      );
      if (!result) {
        return;
      }

      await deleteCalendarAccount({ id: account.id });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete calendar account");
    }
  };

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Calendars</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(calendarAccounts || []).map((calendarAccount) => (
                <SidebarMenuItem key={calendarAccount.id}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton>
                        <ProviderLogoIcon provider={calendarAccount.provider} />
                        <span
                          className={cn("flex-shrink font-medium", {
                            "text-destructive":
                              calendarAccount.status ===
                              CalendarAccountStatus.EXPIRED,
                          })}
                        >
                          {calendarAccount.email}
                        </span>
                        {calendarAccount.status ===
                          CalendarAccountStatus.EXPIRED && (
                          <TriangleAlertIcon className="text-destructive ml-auto" />
                        )}
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
                      <DropdownMenuItem
                        onClick={() => handleRefreshConnection(calendarAccount)}
                      >
                        <RefreshCcwIcon />
                        Refresh Connection
                        {calendarAccount.status ===
                          CalendarAccountStatus.EXPIRED && (
                          <TriangleAlertIcon className="text-destructive ml-auto" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDeleteCalendarAccount(calendarAccount)
                        }
                      >
                        <TrashIcon />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {calendarAccount.calendars.map((calendar) => (
                    <SidebarMenuSub key={calendar.id}>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton
                          className={cn({
                            "opacity-50": calendar.isHidden,
                          })}
                          onClick={() => {
                            handleSetIsHidden(calendar.id, !calendar.isHidden);
                          }}
                        >
                          <div
                            className="bg-secondary size-3 flex-shrink-0 rounded"
                            style={{
                              backgroundColor: calendar.color ?? undefined,
                            }}
                          ></div>
                          {calendar.name}
                          {calendar.isHidden && (
                            <EyeOffIcon className="ml-auto" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ))}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <PlusIcon />
                      Connect calendar
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
                    <DropdownMenuItem asChild>
                      <a
                        href={getConnectCalendarUrl({
                          provider: CalendarAccountProvider.GOOGLE,
                          userId,
                        })}
                      >
                        <GoogleLogoIcon />
                        Google Calendar
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={getConnectCalendarUrl({
                          provider: CalendarAccountProvider.MICROSOFT,
                          userId,
                        })}
                      >
                        <MicrosoftLogoIcon />
                        Microsoft Calendar
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setAppleDialogOpen(true)}
                    >
                      <AppleLogoIcon />
                      Apple Calendar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet open={createEventOpen} onOpenChange={setCreateEventOpen}>
                  <SheetTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <PlusIcon />
                      Create event
                    </SidebarMenuButton>
                  </SheetTrigger>
                  <SheetContent side="right" className="fixed right-0 top-0 h-full w-full sm:w-[600px] sm:max-w-3xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Create New Event</SheetTitle>
                    </SheetHeader>
                    <EventForm
                      calendars={(calendarAccounts || []).flatMap((acc) =>
                        acc.calendars.map((cal) => ({
                          ...cal,
                          calendarAccount: {
                            unifiedAccountId: acc.unifiedAccountId,
                            email: acc.email
                          },
                        })),
                      )}
                      onSuccess={() => setCreateEventOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <ConnectAppleAccountDialog
        open={appleDialogOpen}
        onOpenChange={setAppleDialogOpen}
      />
    </Sidebar>
  );
}
