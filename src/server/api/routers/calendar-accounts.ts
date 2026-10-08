import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { apirocClient } from "@/server/lib/apiroc/client";
import { TRPCError } from "@trpc/server";
import type {
  CalendarAccountProvider,
  CalendarAccountStatus,
} from "@prisma/client";
import type { EndUserAccount } from "@apiroc/unified-calendar-api-node-sdk";
import type { db as dbClient } from "@/server/db";
import { z } from "zod";

export const calendarAccountsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.calendarAccount.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        calendars: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.calendarAccount.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  connectApple: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const appId = env.NEXT_PUBLIC_APIROC_APP_ID;

      let endUserAccount;
      try {
        endUserAccount = await apirocClient.basicAuth.connect(appId, "apple", {
          email: input.email,
          password: input.password,
        });
      } catch (error) {
        console.error("Apple connect error:", error);
        // Surface the API's message (e.g. "Provider not found" when iCloud is
        // not enabled for the app), not a guess about the credentials.
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error && error.message
              ? error.message
              : "Failed to connect Apple account. Please check your email and app-specific password.",
        });
      }

      return saveBasicAuthAccount({
        db: ctx.db,
        user: ctx.session.user,
        endUserAccount,
        provider: "APPLE",
      });
    }),

  connectCalDav: protectedProcedure
    .input(
      z.object({
        serverUrl: z.string().min(1),
        // Some servers (e.g. Nextcloud) use a plain username.
        email: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const appId = env.NEXT_PUBLIC_APIROC_APP_ID;

      let endUserAccount;
      try {
        endUserAccount = await apirocClient.basicAuth.connect(appId, "caldav", {
          serverUrl: input.serverUrl,
          email: input.email,
          password: input.password,
        });
      } catch (error) {
        console.error("CalDAV connect error:", error);
        // Surface the API's message: it says whether the URL, the
        // credentials or the server was the problem.
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error && error.message
              ? error.message
              : "Failed to connect CalDAV account. Please check the server URL and your credentials.",
        });
      }

      return saveBasicAuthAccount({
        db: ctx.db,
        user: ctx.session.user,
        endUserAccount,
        provider: "CALDAV",
        serverUrl: endUserAccount.serverUrl ?? input.serverUrl,
      });
    }),
});

/**
 * Stores a Basic Auth (iCloud / CalDAV) account connected through Apiroc and
 * mirrors its calendars locally.
 */
async function saveBasicAuthAccount({
  db,
  user,
  endUserAccount,
  provider,
  serverUrl = "",
}: {
  db: typeof dbClient;
  user: { id: string; onboardingCompletedAt?: Date | null };
  endUserAccount: EndUserAccount;
  provider: CalendarAccountProvider;
  serverUrl?: string;
}) {
  const userId = user.id;

  const calendarAccount = await db.calendarAccount.upsert({
    where: {
      email_provider_userId: {
        email: endUserAccount.email,
        userId,
        provider,
      },
    },
    update: {
      status: endUserAccount.status as CalendarAccountStatus,
      unifiedAccountId: endUserAccount.id,
      serverUrl,
    },
    create: {
      email: endUserAccount.email,
      provider,
      userId,
      unifiedAccountId: endUserAccount.id,
      status: endUserAccount.status as CalendarAccountStatus,
      serverUrl,
    },
  });

  const existingCalendars = await db.calendar.findMany({
    where: { calendarAccountId: calendarAccount.id },
  });

  if (!user.onboardingCompletedAt) {
    await db.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });
  }

  const calendars = await apirocClient.calendars.list(endUserAccount.id);

  for (const calendar of calendars.data) {
    await db.calendar.upsert({
      where: {
        unifiedCalendarId_calendarAccountId: {
          unifiedCalendarId: calendar.id,
          calendarAccountId: calendarAccount.id,
        },
      },
      update: {
        name: calendar.name,
        color: calendar.hexColor,
        timezone: calendar.timeZone,
        isPrimary: calendar.isPrimary,
      },
      create: {
        name: calendar.name ?? "",
        color: calendar.hexColor,
        timezone: calendar.timeZone,
        isPrimary: calendar.isPrimary,
        unifiedCalendarId: calendar.id,
        userId,
        calendarAccountId: calendarAccount.id,
      },
    });
  }

  const calendarIdsToDelete = existingCalendars
    .filter(
      (calendar) =>
        !calendars.data.some((c) => c.id === calendar.unifiedCalendarId),
    )
    .map((calendar) => calendar.id);

  if (calendarIdsToDelete.length > 0) {
    await db.calendar.deleteMany({
      where: { id: { in: calendarIdsToDelete } },
    });
  }

  return calendarAccount;
}
