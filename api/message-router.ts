import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { messages, rides, users } from "@db/schema";

export const messageRouter = createRouter({
  send: authedQuery
    .input(
      z.object({
        rideId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const senderId = ctx.user.id;

      // Verify ride participant
      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, input.rideId),
      });

      if (!ride) throw new Error("Ride not found");
      if (ride.riderId !== senderId && ride.driverId !== senderId) {
        throw new Error("Not a participant in this ride");
      }

      const [message] = await db.insert(messages).values({
        rideId: input.rideId,
        senderId,
        content: input.content,
      });

      return {
        id: Number(message.insertId),
        rideId: input.rideId,
        senderId,
        content: input.content,
        isRead: false,
        createdAt: new Date(),
      };
    }),

  getForRide: authedQuery
    .input(z.object({ rideId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, input.rideId),
      });

      if (!ride) return [];
      if (ride.riderId !== ctx.user.id && ride.driverId !== ctx.user.id) {
        return [];
      }

      const msgs = await db.query.messages.findMany({
        where: eq(messages.rideId, input.rideId),
        orderBy: [asc(messages.createdAt)],
      });

      // Enrich with sender names
      const enriched = await Promise.all(
        msgs.map(async (msg) => {
          const sender = await db.query.users.findFirst({
            where: eq(users.id, msg.senderId),
          });
          return {
            id: msg.id,
            rideId: msg.rideId,
            senderId: msg.senderId,
            senderName: sender?.name ?? "User",
            senderAvatar: sender?.avatar ?? undefined,
            content: msg.content,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
          };
        })
      );

      return enriched;
    }),

  markAsRead: authedQuery
    .input(z.object({ rideId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.rideId, input.rideId));

      return { success: true };
    }),
});
