import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { notifications } from "@db/schema";

export const notificationRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const notifs = await db.query.notifications.findMany({
      where: eq(notifications.userId, ctx.user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    return notifs.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
      data: n.data ? JSON.parse(n.data as string) : undefined,
    }));
  }),

  markAsRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id));

      return { success: true };
    }),

  markAllAsRead: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .delete(notifications)
        .where(eq(notifications.id, input.id));

      return { success: true };
    }),
});
