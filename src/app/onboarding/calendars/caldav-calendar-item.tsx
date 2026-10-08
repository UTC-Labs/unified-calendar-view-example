"use client";

import { ConnectCalDavAccountDialog } from "@/components/connect-caldav-account-dialog";
import { cn } from "@/lib/utils";
import { CalendarDaysIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

export function CalDavCalendarOnboardingItem() {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        className="group relative flex w-full items-start space-x-3 py-4 text-left"
        onClick={() => setOpen(true)}
      >
        <div className="shrink-0">
          <span
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-lg shadow-sm",
            )}
          >
            <CalendarDaysIcon aria-hidden="true" className="size-6" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900">
            CalDAV Calendar
          </div>
          <p className="text-sm text-gray-500">
            Connect Fastmail, Nextcloud, Zoho or any other CalDAV server.
          </p>
        </div>
        <div className="shrink-0 self-center">
          <ChevronRightIcon
            aria-hidden="true"
            className="size-5 text-gray-400 group-hover:text-gray-500"
          />
        </div>
      </button>
      <ConnectCalDavAccountDialog open={open} onOpenChange={setOpen} />
    </li>
  );
}
