import { z } from "zod";
import { eq, avg } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reviews, rides, driverProfiles, riderProfiles } from "@db/schema";

export const reviewRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        rideId: z.number(),
        revieweeId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        categories: z
          .object({
            cleanliness: z.number().min(1).max(5).optional(),
            driving: z.number().min(1).max(5).optional(),
            punctuality: z.number().min(1).max(5).optional(),
            communication: z.number().min(1).max(5).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const reviewerId = ctx.user.id;

      // Check ride exists and is completed
      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, input.rideId),
      });

      if (!ride || ride.status !== "completed") {
        throw new Error("Ride must be completed before reviewing");
      }

      // Check not already reviewed
      const existing = await db.query.reviews.findFirst({
        where: eq(reviews.rideId, input.rideId),
      });

      if (existing) {
        throw new Error("Ride already reviewed");
      }

      await db.insert(reviews).values({
        rideId: input.rideId,
        reviewerId,
        revieweeId: input.revieweeId,
        rating: input.rating,
        comment: input.comment ?? null,
        categories: input.categories ? JSON.stringify(input.categories) : null,
      });

      // Update reviewee's average rating
      const revieweeRole = ride.riderId === input.revieweeId ? "rider" : "driver";

      if (revieweeRole === "driver") {
        const avgResult = await db
          .select({ avg: avg(reviews.rating) })
          .from(reviews)
          .where(eq(reviews.revieweeId, input.revieweeId));

        await db
          .update(driverProfiles)
          .set({ rating: avgResult[0]?.avg?.toString() ?? "5.0" })
          .where(eq(driverProfiles.userId, input.revieweeId));
      } else {
        const avgResult = await db
          .select({ avg: avg(reviews.rating) })
          .from(reviews)
          .where(eq(reviews.revieweeId, input.revieweeId));

        await db
          .update(riderProfiles)
          .set({ rating: avgResult[0]?.avg?.toString() ?? "5.0" })
          .where(eq(riderProfiles.userId, input.revieweeId));
      }

      return { success: true };
    }),

  getForRide: authedQuery
    .input(z.object({ rideId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const review = await db.query.reviews.findFirst({
        where: eq(reviews.rideId, input.rideId),
        with: {
          reviewer: true,
          reviewee: true,
        },
      });

      if (!review) return null;

      return {
        id: review.id,
        rideId: review.rideId,
        reviewerName: review.reviewer?.name ?? "Anonymous",
        reviewerAvatar: review.reviewer?.avatar ?? undefined,
        revieweeName: review.reviewee?.name ?? "Anonymous",
        rating: review.rating,
        comment: review.comment ?? undefined,
        categories: review.categories ? JSON.parse(review.categories as string) : undefined,
        createdAt: review.createdAt,
      };
    }),
});
