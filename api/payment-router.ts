import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, rides } from "@db/schema";

export const paymentRouter = createRouter({
  createIntent: authedQuery
    .input(
      z.object({
        rideId: z.number(),
        amount: z.number(),
        method: z.enum(["card", "cash", "wallet", "apple_pay", "google_pay"]).default("card"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, input.rideId),
      });

      if (!ride) throw new Error("Ride not found");

      // Create payment record (mock Stripe integration)
      const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const [payment] = await db.insert(payments).values({
        rideId: input.rideId,
        amount: input.amount.toString(),
        status: "pending",
        method: input.method,
        stripePaymentIntentId: input.method !== "cash" ? mockPaymentIntentId : null,
      });

      return {
        clientSecret: input.method !== "cash" ? `${mockPaymentIntentId}_secret` : null,
        paymentId: Number(payment.insertId),
        status: "pending",
      };
    }),

  confirmPayment: authedQuery
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(payments)
        .set({ status: "completed" })
        .where(eq(payments.id, input.paymentId));

      return { success: true };
    }),

  getPaymentForRide: authedQuery
    .input(z.object({ rideId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const payment = await db.query.payments.findFirst({
        where: eq(payments.rideId, input.rideId),
      });

      if (!payment) return null;

      return {
        id: payment.id,
        amount: Number(payment.amount),
        status: payment.status,
        method: payment.method,
        createdAt: payment.createdAt,
      };
    }),
});
