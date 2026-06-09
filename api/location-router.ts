import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { savedLocations } from "@db/schema";

export const locationRouter = createRouter({
  save: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        address: z.string().min(1).max(500),
        lat: z.number(),
        lng: z.number(),
        type: z.enum(["home", "work", "favorite", "recent"]).default("favorite"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [location] = await db.insert(savedLocations).values({
        userId,
        name: input.name,
        address: input.address,
        lat: input.lat.toString(),
        lng: input.lng.toString(),
        type: input.type,
      });

      return { id: Number(location.insertId), success: true };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const locations = await db.query.savedLocations.findMany({
      where: eq(savedLocations.userId, ctx.user.id),
      orderBy: (savedLocations, { desc }) => [desc(savedLocations.createdAt)],
    });

    return locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      type: loc.type,
    }));
  }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .delete(savedLocations)
        .where(eq(savedLocations.id, input.id));

      return { success: true };
    }),
});
