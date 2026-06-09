import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, riderProfiles } from "@db/schema";

export const riderRouter = createRouter({
  getProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const profile = await db.query.riderProfiles.findFirst({
      where: eq(riderProfiles.userId, userId),
    });

    if (!profile) {
      return null;
    }

    return profile;
  }),

  createOrUpdateProfile: authedQuery
    .input(
      z.object({
        homeAddress: z.string().optional(),
        homeLat: z.number().optional(),
        homeLng: z.number().optional(),
        workAddress: z.string().optional(),
        workLat: z.number().optional(),
        workLng: z.number().optional(),
        preferredPaymentMethod: z.enum(["card", "cash", "wallet"]).optional(),
        emergencyContact: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Update user phone if provided
      if (input.phone) {
        await db
          .update(users)
          .set({ phone: input.phone })
          .where(eq(users.id, userId));
      }

      const existing = await db.query.riderProfiles.findFirst({
        where: eq(riderProfiles.userId, userId),
      });

      if (existing) {
        await db
          .update(riderProfiles)
          .set({
            ...(input.homeAddress !== undefined && { homeAddress: input.homeAddress }),
            ...(input.homeLat !== undefined && { homeLat: input.homeLat.toString() }),
            ...(input.homeLng !== undefined && { homeLng: input.homeLng.toString() }),
            ...(input.workAddress !== undefined && { workAddress: input.workAddress }),
            ...(input.workLat !== undefined && { workLat: input.workLat.toString() }),
            ...(input.workLng !== undefined && { workLng: input.workLng.toString() }),
            ...(input.preferredPaymentMethod !== undefined && { preferredPaymentMethod: input.preferredPaymentMethod }),
            ...(input.emergencyContact !== undefined && { emergencyContact: input.emergencyContact }),
          })
          .where(eq(riderProfiles.userId, userId));
      } else {
        await db.insert(riderProfiles).values({
          userId,
          homeAddress: input.homeAddress ?? null,
          homeLat: input.homeLat?.toString() ?? null,
          homeLng: input.homeLng?.toString() ?? null,
          workAddress: input.workAddress ?? null,
          workLat: input.workLat?.toString() ?? null,
          workLng: input.workLng?.toString() ?? null,
          preferredPaymentMethod: input.preferredPaymentMethod ?? "card",
          emergencyContact: input.emergencyContact ?? null,
        });
      }

      // Mark onboarding complete
      await db
        .update(users)
        .set({ isOnboardingComplete: true })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const profile = await db.query.riderProfiles.findFirst({
      where: eq(riderProfiles.userId, userId),
    });

    if (!profile) {
      return { totalRides: 0, totalSpent: 0, rating: 5.0 };
    }

    return {
      totalRides: profile.totalRides,
      totalSpent: Number(profile.totalSpent),
      rating: Number(profile.rating),
    };
  }),
});
