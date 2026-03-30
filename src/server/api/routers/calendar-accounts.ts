import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { onecalClient } from "@/server/lib/onecal-unified/client";
import { TRPCError } from "@trpc/server";
import type { CalendarAccountStatus } from "@prisma/client";
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
      const userId = ctx.session.user.id;
      const appId = env.NEXT_PUBLIC_ONECAL_UNIFIED_APP_ID;

      let endUserAccount;
      try {
        endUserAccount = await onecalClient.basicAuth.connect(appId, "apple", {
          email: input.email,
          password: input.password,
        });
      } catch (error) {
        console.error("Apple connect error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Failed to connect Apple account. Please check your email and app-specific password.",
        });
      }

      const calendarAccount = await ctx.db.calendarAccount.upsert({
        where: {
          email_provider_userId: {
            email: endUserAccount.email,
            userId,
            provider: "APPLE",
          },
        },
        update: {
          status: endUserAccount.status as CalendarAccountStatus,
          unifiedAccountId: endUserAccount.id,
        },
        create: {
          email: endUserAccount.email,
          provider: "APPLE",
          userId,
          unifiedAccountId: endUserAccount.id,
          status: endUserAccount.status as CalendarAccountStatus,
        },
      });

      const existingCalendars = await ctx.db.calendar.findMany({
        where: { calendarAccountId: calendarAccount.id },
      });

      if (!ctx.session.user.onboardingCompletedAt) {
        await ctx.db.user.update({
          where: { id: userId },
          data: { onboardingCompletedAt: new Date() },
        });
      }

      const calendars = await onecalClient.calendars.list(endUserAccount.id);

      for (const calendar of calendars.data) {
        await ctx.db.calendar.upsert({
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
        await ctx.db.calendar.deleteMany({
          where: { id: { in: calendarIdsToDelete } },
        });
      }

      return calendarAccount;
    }),
});
