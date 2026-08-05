import { env } from "@/env";
import { UnifiedCalendarApi } from "@onecal/unified-calendar-api-node-sdk";

export const onecalClient = new UnifiedCalendarApi({
  apiKey: env.APIROC_API_KEY,
  unifiedApiBaseUrl: env.NEXT_PUBLIC_APIROC_URL,
});
