import { z } from "zod";
import { eq, and, desc, sql, gte, count, avg } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, driverProfiles, rides, payments, reviews } from "@db/schema";
import type { RideStatusType } from "@contracts/types";

export const adminRouter = createRouter({
  getDashboardStats: adminQuery.query(async () => {
    const db = getDb();

    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Total users
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "user"));

    // Total drivers
    const totalDriversResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "driver"));

    // Active drivers
    const activeDriversResult = await db
      .select({ count: count() })
      .from(driverProfiles)
      .where(eq(driverProfiles.isOnline, true));

    // Total rides
    const totalRidesResult = await db
      .select({ count: count() })
      .from(rides);

    // Rides today
    const ridesTodayResult = await db
      .select({ count: count() })
      .from(rides)
      .where(gte(rides.createdAt, new Date(today)));

    // Revenue today
    const revenueTodayResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, new Date(today)),
          eq(payments.status, "completed")
        )
      );

    // Revenue this month
    const revenueMonthResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, monthStart),
          eq(payments.status, "completed")
        )
      );

    // Average rating
    const avgRatingResult = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews);

    // Completion rate
    const completedRidesResult = await db
      .select({ count: count() })
      .from(rides)
      .where(eq(rides.status, "completed"));

    const totalRidesCount = totalRidesResult[0]?.count ?? 0;
    const completedCount = completedRidesResult[0]?.count ?? 0;
    const completionRate = totalRidesCount > 0 ? (completedCount / totalRidesCount) * 100 : 0;

    // Top drivers
    const topDrivers = await db
      .select({
        id: driverProfiles.id,
        name: users.name,
        rating: driverProfiles.rating,
        totalRides: driverProfiles.totalRides,
        totalEarnings: driverProfiles.totalEarnings,
      })
      .from(driverProfiles)
      .innerJoin(users, eq(driverProfiles.userId, users.id))
      .orderBy(desc(driverProfiles.totalRides))
      .limit(5);

    // Recent rides
    const recentRides = await db.query.rides.findMany({
      orderBy: [desc(rides.createdAt)],
      limit: 10,
      with: {
        rider: { columns: { name: true } },
        driver: { columns: { name: true } },
      },
    });

    return {
      totalUsers: totalUsersResult[0]?.count ?? 0,
      totalDrivers: totalDriversResult[0]?.count ?? 0,
      activeDrivers: activeDriversResult[0]?.count ?? 0,
      totalRides: totalRidesCount,
      ridesToday: ridesTodayResult[0]?.count ?? 0,
      revenueToday: Number(revenueTodayResult[0]?.total ?? 0),
      revenueThisMonth: Number(revenueMonthResult[0]?.total ?? 0),
      averageRating: Number(avgRatingResult[0]?.avg ?? 0),
      completionRate: Math.round(completionRate * 100) / 100,
      topDrivers: topDrivers.map((d) => ({
        id: d.id,
        name: d.name ?? "Unknown",
        rating: Number(d.rating),
        totalRides: d.totalRides,
        earnings: Number(d.totalEarnings),
      })),
      recentRides: recentRides.map((r) => ({
        id: r.id,
        riderName: r.rider?.name ?? "Unknown",
        driverName: r.driver?.name ?? "Unassigned",
        status: r.status,
        fare: r.fare ? Number(r.fare) : 0,
        createdAt: r.createdAt,
      })),
    };
  }),

  getUsers: adminQuery
    .input(
      z
        .object({
          role: z.enum(["user", "driver", "admin"]).optional(),
          search: z.string().optional(),
          page: z.number().default(1),
          limit: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 20;

      const allUsers = await db.query.users.findMany({
        where: input?.role ? eq(users.role, input.role) : undefined,
        limit,
        orderBy: [desc(users.createdAt)],
      });

      return allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        role: u.role,
        isOnboardingComplete: u.isOnboardingComplete,
        createdAt: u.createdAt,
        lastSignInAt: u.lastSignInAt,
      }));
    }),

  getRides: adminQuery
    .input(
      z
        .object({
          status: z.enum([
            "searching",
            "driver_assigned",
            "driver_arriving",
            "picked_up",
            "in_progress",
            "completed",
            "cancelled",
            "declined",
          ]).optional(),
          page: z.number().default(1),
          limit: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 20;

      const allRides = await db.query.rides.findMany({
        where: input?.status ? eq(rides.status, input.status as RideStatusType) : undefined,
        orderBy: [desc(rides.createdAt)],
        limit,
        with: {
          rider: { columns: { name: true, email: true } },
          driver: { columns: { name: true, email: true } },
        },
      });

      return allRides.map((r) => ({
        id: r.id,
        riderName: r.rider?.name ?? "Unknown",
        driverName: r.driver?.name ?? "Unassigned",
        pickupAddress: r.pickupAddress,
        dropoffAddress: r.dropoffAddress,
        status: r.status,
        rideType: r.rideType,
        fare: r.fare ? Number(r.fare) : 0,
        finalFare: r.finalFare ? Number(r.finalFare) : undefined,
        distance: r.distance ? Number(r.distance) : undefined,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
      }));
    }),

  updateUserRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "driver", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
