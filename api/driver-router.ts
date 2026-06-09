import { z } from "zod";
import { eq, and, gte, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, driverProfiles, rides, earnings } from "@db/schema";

export const driverRouter = createRouter({
  getProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const profile = await db.query.driverProfiles.findFirst({
      where: eq(driverProfiles.userId, userId),
    });

    if (!profile) return null;

    return profile;
  }),

  createOrUpdateProfile: authedQuery
    .input(
      z.object({
        licenseNumber: z.string().optional(),
        licenseExpiry: z.string().optional(),
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleYear: z.number().optional(),
        vehicleColor: z.string().optional(),
        vehiclePlate: z.string().optional(),
        vehicleType: z.enum(["economy", "comfort", "premium", "xl"]).optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      if (input.phone) {
        await db
          .update(users)
          .set({ phone: input.phone })
          .where(eq(users.id, userId));
      }

      const existing = await db.query.driverProfiles.findFirst({
        where: eq(driverProfiles.userId, userId),
      });

      if (existing) {
        await db
          .update(driverProfiles)
          .set({
            ...(input.licenseNumber !== undefined && { licenseNumber: input.licenseNumber }),
            ...(input.licenseExpiry !== undefined && { licenseExpiry: new Date(input.licenseExpiry) }),
            ...(input.vehicleMake !== undefined && { vehicleMake: input.vehicleMake }),
            ...(input.vehicleModel !== undefined && { vehicleModel: input.vehicleModel }),
            ...(input.vehicleYear !== undefined && { vehicleYear: input.vehicleYear }),
            ...(input.vehicleColor !== undefined && { vehicleColor: input.vehicleColor }),
            ...(input.vehiclePlate !== undefined && { vehiclePlate: input.vehiclePlate }),
            ...(input.vehicleType !== undefined && { vehicleType: input.vehicleType }),
          })
          .where(eq(driverProfiles.userId, userId));
      } else {
        await db.insert(driverProfiles).values({
          userId,
          licenseNumber: input.licenseNumber ?? null,
          licenseExpiry: input.licenseExpiry ? new Date(input.licenseExpiry) : null,
          vehicleMake: input.vehicleMake ?? null,
          vehicleModel: input.vehicleModel ?? null,
          vehicleYear: input.vehicleYear ?? null,
          vehicleColor: input.vehicleColor ?? null,
          vehiclePlate: input.vehiclePlate ?? null,
          vehicleType: input.vehicleType ?? "economy",
          documentsVerified: true,
        });
      }

      // Set user role to driver
      await db
        .update(users)
        .set({ role: "driver", isOnboardingComplete: true })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  toggleOnline: authedQuery
    .input(z.object({ isOnline: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db
        .update(driverProfiles)
        .set({
          isOnline: input.isOnline,
          isAvailable: input.isOnline,
        })
        .where(eq(driverProfiles.userId, userId));

      return { success: true, isOnline: input.isOnline };
    }),

  updateLocation: authedQuery
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        heading: z.number().optional(),
        speed: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db
        .update(driverProfiles)
        .set({
          currentLat: input.lat.toString(),
          currentLng: input.lng.toString(),
          heading: input.heading?.toString() ?? null,
          speed: input.speed?.toString() ?? null,
        })
        .where(eq(driverProfiles.userId, userId));

      return { success: true };
    }),

  toggleAvailability: authedQuery
    .input(z.object({ isAvailable: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db
        .update(driverProfiles)
        .set({ isAvailable: input.isAvailable })
        .where(eq(driverProfiles.userId, userId));

      return { success: true };
    }),

  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const profile = await db.query.driverProfiles.findFirst({
      where: eq(driverProfiles.userId, ctx.user.id),
    });

    if (!profile) {
      return {
        isOnline: false,
        isAvailable: false,
        todayEarnings: 0,
        totalRides: 0,
        rating: 5.0,
        totalEarnings: 0,
        acceptanceRate: 100,
      };
    }

    // Get today's date string
    const today = new Date().toISOString().split("T")[0];

    const todayEarningsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(earnings)
      .where(
        and(
          eq(earnings.driverId, profile.id),
          eq(earnings.date, today)
        )
      );

    return {
      isOnline: profile.isOnline,
      isAvailable: profile.isAvailable,
      todayEarnings: Number(todayEarningsResult[0]?.total ?? 0),
      totalRides: profile.totalRides,
      rating: Number(profile.rating),
      totalEarnings: Number(profile.totalEarnings),
      acceptanceRate: Number(profile.acceptanceRate),
    };
  }),

  getEarnings: authedQuery
    .input(
      z.object({
        period: z.enum(["day", "week", "month"]).default("week"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const profile = await db.query.driverProfiles.findFirst({
        where: eq(driverProfiles.userId, ctx.user.id),
      });

      if (!profile) return [];

      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "day":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const result = await db
        .select({
          date: earnings.date,
          amount: sql<number>`COALESCE(SUM(amount), 0)`,
          rideCount: sql<number>`COUNT(*)`,
        })
        .from(earnings)
        .where(
          and(
            eq(earnings.driverId, profile.id),
            gte(earnings.date, startDate.toISOString().split("T")[0])
          )
        )
        .groupBy(earnings.date)
        .orderBy(earnings.date);

      return result;
    }),

  getNearbyRequests: authedQuery.query(async () => {
    const db = getDb();

    // Get rides in "searching" status
    const pendingRides = await db.query.rides.findMany({
      where: eq(rides.status, "searching"),
      orderBy: (rides, { desc }) => [desc(rides.createdAt)],
      limit: 20,
    });

    return pendingRides;
  }),
});
