import { AppleLogoIcon } from "@/components/icons/apple-logo";
import { GoogleLogoIcon } from "@/components/icons/google-logo";
import { MicrosoftLogoIcon } from "@/components/icons/microsoft-logo";
import { CalendarAccountProvider } from "@prisma/client";
import { CalendarDaysIcon } from "lucide-react";
import type { ComponentProps } from "react";

type ProviderLogoIconProps = ComponentProps<"svg"> & {
  provider: CalendarAccountProvider;
};

export function ProviderLogoIcon({
  provider,
  ...props
}: ProviderLogoIconProps) {
  if (provider === CalendarAccountProvider.GOOGLE) {
    return <GoogleLogoIcon {...props} />;
  } else if (provider === CalendarAccountProvider.MICROSOFT) {
    return <MicrosoftLogoIcon {...props} />;
  } else if (provider === CalendarAccountProvider.APPLE) {
    return <AppleLogoIcon {...props} />;
  } else if (provider === CalendarAccountProvider.CALDAV) {
    return <CalendarDaysIcon {...props} />;
  } else {
    return null;
  }
}
