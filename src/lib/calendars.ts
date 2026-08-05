import { env } from "@/env";
import { stateToB64 } from "@/lib/utils";
import { getOAuthUrl } from "@apiroc/unified-calendar-api-node-sdk/oauth";
import { CalendarAccountProvider } from "@prisma/client";

export function getConnectCalendarUrl({
  provider,
  userId,
  loginHint,
}: {
  provider: CalendarAccountProvider;
  userId: string;
  loginHint?: string;
}) {
  const state = stateToB64({ userId });

  switch (provider) {
    case CalendarAccountProvider.GOOGLE:
    case CalendarAccountProvider.MICROSOFT:
      return getOAuthUrl(env.NEXT_PUBLIC_APIROC_APP_ID, provider, {
        redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/api/connect`,
        state,
        loginHint,
        unifiedApiBaseUrl: env.NEXT_PUBLIC_APIROC_URL,
      });
    default:
      throw new Error(
        `OAuth connect URL not supported for provider: ${provider}`,
      );
  }
}
