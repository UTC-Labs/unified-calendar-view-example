import { env } from "@/env";
import { UnifiedCalendarApi } from "@apiroc/unified-calendar-api-node-sdk";

export const apirocClient = new UnifiedCalendarApi({
  apiKey: env.APIROC_API_KEY,
  unifiedApiBaseUrl: env.NEXT_PUBLIC_APIROC_URL,
});
