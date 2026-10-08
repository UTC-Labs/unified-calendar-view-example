import { GoogleLogoIcon } from "@/components/icons/google-logo";
import { MicrosoftLogoIcon } from "@/components/icons/microsoft-logo";
import { AppleLogoIcon } from "@/components/icons/apple-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getConnectCalendarUrl } from "@/lib/calendars";
import { cn } from "@/lib/utils";
import { getServerSession } from "@/server/auth";
import { CalendarAccountProvider } from "@prisma/client";
import { ChevronRightIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { AppleCalendarOnboardingItem } from "./apple-calendar-item";
import { CalDavCalendarOnboardingItem } from "./caldav-calendar-item";

export default async function CalendarsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    throw redirect("/login");
  }

  const items = [
    {
      name: "Google Calendar",
      description: "Connect your Google Calendar.",
      href: getConnectCalendarUrl({
        provider: CalendarAccountProvider.GOOGLE,
        userId: session.user.id,
      }),
      icon: GoogleLogoIcon,
    },
    {
      name: "Microsoft Calendar",
      description: "Connect your Microsoft (Outlook) Calendar.",
      href: getConnectCalendarUrl({
        provider: CalendarAccountProvider.MICROSOFT,
        userId: session.user.id,
      }),
      icon: MicrosoftLogoIcon,
    },
  ];

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Connect your first calendar</CardTitle>
        <CardDescription>Connect your calendar to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul
          role="list"
          className="w-full divide-y divide-gray-200 border-t border-b border-gray-200"
        >
          {items.map((item, itemIdx) => (
            <li key={itemIdx}>
              <div className="group relative flex items-start space-x-3 py-4">
                <div className="shrink-0">
                  <span
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-lg shadow-sm",
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    <a href={item.href}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {item.name}
                    </a>
                  </div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="shrink-0 self-center">
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-5 text-gray-400 group-hover:text-gray-500"
                  />
                </div>
              </div>
            </li>
          ))}
          <AppleCalendarOnboardingItem />
          <CalDavCalendarOnboardingItem />
        </ul>
      </CardContent>
    </Card>
  );
}
