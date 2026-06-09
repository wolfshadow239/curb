import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { promotions, userPromotions } from "@db/schema";

export const promotionRouter = createRouter({
  listActive: authedQuery.query(async () => {
    const db = getDb();
    const now = new Date();

    const activePromos = await db.query.promotions.findMany({
      where: and(
        eq(promotions.isActive, true),
        lte(promotions.validFrom, now),
        gte(promotions.validTo, now)
      ),
    });

    return activePromos.map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description,
      discountType: p.discountType,
      discountValue: Number(p.discountValue),
      maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : undefined,
      minRideAmount: Number(p.minRideAmount),
      validTo: p.validTo,
    }));
  }),

  validate: authedQuery
    .input(
      z.object({
        code: z.string(),
        rideAmount: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();

      const promo = await db.query.promotions.findFirst({
        where: and(
          eq(promotions.code, input.code.toUpperCase()),
          eq(promotions.isActive, true),
          lte(promotions.validFrom, now),
          gte(promotions.validTo, now)
        ),
      });

      if (!promo) {
        return { valid: false, message: "Invalid or expired promo code" };
      }

      if (Number(promo.minRideAmount) > input.rideAmount) {
        return {
          valid: false,
          message: `Minimum ride amount of $${promo.minRideAmount} required`,
        };
      }

      // Check usage limit
      if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
        return { valid: false, message: "Promo code usage limit reached" };
      }

      let discount = 0;
      if (promo.discountType === "percentage") {
        discount = input.rideAmount * (Number(promo.discountValue) / 100);
        if (promo.maxDiscount) {
          discount = Math.min(discount, Number(promo.maxDiscount));
        }
      } else {
        discount = Number(promo.discountValue);
      }

      return {
        valid: true,
        promoId: promo.id,
        discount: Math.round(discount * 100) / 100,
        code: promo.code,
        description: promo.description,
      };
    }),

  apply: authedQuery
    .input(z.object({ promoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db.insert(userPromotions).values({
        userId: ctx.user.id,
        promotionId: input.promoId,
        usedAt: new Date(),
      });

      // Increment usage count
      const promo = await db.query.promotions.findFirst({
        where: eq(promotions.id, input.promoId),
      });

      if (promo) {
        await db
          .update(promotions)
          .set({ usageCount: promo.usageCount + 1 })
          .where(eq(promotions.id, input.promoId));
      }

      return { success: true };
    }),
});
