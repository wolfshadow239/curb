import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, driverProfiles, rides, rideEvents } from "@db/schema";
import { Pricing, VehicleTypeInfo } from "@contracts/constants";
import type { VehicleTypeType, FareEstimate } from "@contracts/types";

function calculateFare(distanceMiles: number, durationMinutes: number, vehicleType: VehicleTypeType, surge = 1): FareEstimate {
  const info = VehicleTypeInfo[vehicleType];
  const baseFare = Pricing.BASE_FARE * info.multiplier;
  const distanceFare = distanceMiles * Pricing.PER_MILE_RATE * info.multiplier;
  const timeFare = durationMinutes * Pricing.PER_MINUTE_RATE * info.multiplier;
  const subtotal = baseFare + distanceFare + timeFare + Pricing.BOOKING_FEE;
  const estimatedFare = Math.max(subtotal * surge, Pricing.MINIMUM_FARE * info.multiplier);
  const minFare = estimatedFare * 0.9;
  const maxFare = estimatedFare * 1.15;

  return {
    vehicleType,
    label: info.label,
    description: info.description,
    seats: info.seats,
    estimatedFare: Math.round(estimatedFare * 100) / 100,
    minFare: Math.round(minFare * 100) / 100,
    maxFare: Math.round(maxFare * 100) / 100,
    estimatedDuration: Math.round(durationMinutes),
    estimatedDistance: Math.round(distanceMiles * 100) / 100,
    multiplier: info.multiplier,
  };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateRouteDistanceTime(pickupLat: number, pickupLng: number, dropoffLat: number, dropoffLng: number): { distance: number; duration: number } {
  const straightLineDist = haversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
  // Real route is typically ~1.3x the straight-line distance
  const estimatedDistance = straightLineDist * 1.3;
  // Assume average speed of 25 mph in city
  const estimatedDuration = (estimatedDistance / 25) * 60;
  return {
    distance: Math.round(estimatedDistance * 100) / 100,
    duration: Math.round(estimatedDuration),
  };
}

export const rideRouter = createRouter({
  // ─── Estimate Fare ───
  estimateFare: publicQuery
    .input(
      z.object({
        pickupLat: z.number(),
        pickupLng: z.number(),
        dropoffLat: z.number(),
        dropoffLng: z.number(),
        surgeMultiplier: z.number().default(1),
      })
    )
    .query(({ input }) => {
      const { distance, duration } = estimateRouteDistanceTime(
        input.pickupLat,
        input.pickupLng,
        input.dropoffLat,
        input.dropoffLng
      );

      const vehicleTypes: VehicleTypeType[] = ["economy", "comfort", "premium", "xl"];
      const estimates: FareEstimate[] = vehicleTypes.map((vt) =>
        calculateFare(distance, duration, vt, input.surgeMultiplier)
      );

      return { estimates, distance, duration };
    }),

  // ─── Find Nearby Drivers ───
  findNearbyDrivers: publicQuery
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().default(5), // miles
        vehicleType: z.enum(["economy", "comfort", "premium", "xl"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const allOnlineDrivers = await db.query.driverProfiles.findMany({
        where: and(
          eq(driverProfiles.isOnline, true),
          eq(driverProfiles.isAvailable, true)
        ),
      });

      const nearbyDrivers = allOnlineDrivers
        .filter((driver) => {
          if (!driver.currentLat || !driver.currentLng) return false;
          const dist = haversineDistance(
            input.lat,
            input.lng,
            Number(driver.currentLat),
            Number(driver.currentLng)
          );
          return dist <= input.radius;
        })
        .map((driver) => {
          const dist = haversineDistance(
            input.lat,
            input.lng,
            Number(driver.currentLat),
            Number(driver.currentLng)
          );
          const etaMinutes = Math.round((dist / 25) * 60) + 2; // +2 min for preparation
          return { ...driver, distance: Math.round(dist * 100) / 100, etaMinutes };
        })
        .sort((a, b) => a.distance - b.distance);

      // Enrich with user info
      const enriched = await Promise.all(
        nearbyDrivers.slice(0, 10).map(async (driver) => {
          const user = await db.query.users.findFirst({
            where: eq(users.id, driver.userId),
          });
          return {
            driverId: driver.id,
            userId: driver.userId,
            name: user?.name ?? "Driver",
            avatar: user?.avatar ?? undefined,
            vehicleType: driver.vehicleType,
            vehicleMake: driver.vehicleMake ?? undefined,
            vehicleModel: driver.vehicleModel ?? undefined,
            vehicleColor: driver.vehicleColor ?? undefined,
            vehiclePlate: driver.vehiclePlate ?? undefined,
            rating: Number(driver.rating),
            lat: Number(driver.currentLat),
            lng: Number(driver.currentLng),
            heading: driver.heading ? Number(driver.heading) : undefined,
            etaMinutes: driver.etaMinutes,
            distance: driver.distance,
          };
        })
      );

      if (input.vehicleType) {
        return enriched.filter((d) => d.vehicleType === input.vehicleType);
      }

      return enriched;
    }),

  // ─── Create Ride ───
  create: authedQuery
    .input(
      z.object({
        pickupLat: z.number(),
        pickupLng: z.number(),
        pickupAddress: z.string(),
        dropoffLat: z.number(),
        dropoffLng: z.number(),
        dropoffAddress: z.string(),
        rideType: z.enum(["economy", "comfort", "premium", "xl"]).default("economy"),
        promoCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const riderId = ctx.user.id;

      const { distance, duration } = estimateRouteDistanceTime(
        input.pickupLat,
        input.pickupLng,
        input.dropoffLat,
        input.dropoffLng
      );

      const fareEstimate = calculateFare(distance, duration, input.rideType);

      // Generate OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      const [ride] = await db.insert(rides).values({
        riderId,
        pickupLat: input.pickupLat.toString(),
        pickupLng: input.pickupLng.toString(),
        pickupAddress: input.pickupAddress,
        dropoffLat: input.dropoffLat.toString(),
        dropoffLng: input.dropoffLng.toString(),
        dropoffAddress: input.dropoffAddress,
        status: "searching",
        rideType: input.rideType,
        fare: fareEstimate.estimatedFare.toString(),
        baseFare: (Pricing.BASE_FARE * fareEstimate.multiplier).toString(),
        distanceFare: (distance * Pricing.PER_MILE_RATE * fareEstimate.multiplier).toString(),
        timeFare: (duration * Pricing.PER_MINUTE_RATE * fareEstimate.multiplier).toString(),
        surgeMultiplier: "1.00",
        discountAmount: "0.00",
        tipAmount: "0.00",
        finalFare: fareEstimate.estimatedFare.toString(),
        distance: distance.toString(),
        estimatedDuration: duration,
        otp,
      });

      const rideId = Number(ride.insertId);

      // Create ride event
      await db.insert(rideEvents).values({
        rideId,
        eventType: "requested",
        lat: input.pickupLat.toString(),
        lng: input.pickupLng.toString(),
        metadata: JSON.stringify({ pickupAddress: input.pickupAddress, dropoffAddress: input.dropoffAddress }),
      });

      return { rideId, fare: fareEstimate.estimatedFare, otp };
    }),

  // ─── Get Ride Details ───
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, input.id),
        with: {
          rider: true,
          driver: true,
          reviews: true,
          payment: true,
        },
      });

      if (!ride) return null;

      const isParticipant = ride.riderId === ctx.user.id || ride.driverId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isParticipant && !isAdmin) {
        return null;
      }

      const driverProfile = ride.driverId
        ? await db.query.driverProfiles.findFirst({
            where: eq(driverProfiles.userId, ride.driverId),
          })
        : null;

      return {
        id: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId ?? undefined,
        riderName: ride.rider?.name ?? undefined,
        driverName: ride.driver?.name ?? undefined,
        driverAvatar: ride.driver?.avatar ?? undefined,
        driverPhone: ride.driver?.phone ?? undefined,
        pickup: {
          lat: Number(ride.pickupLat),
          lng: Number(ride.pickupLng),
          address: ride.pickupAddress,
        },
        dropoff: {
          lat: Number(ride.dropoffLat),
          lng: Number(ride.dropoffLng),
          address: ride.dropoffAddress,
        },
        status: ride.status,
        rideType: ride.rideType,
        fare: ride.fare ? Number(ride.fare) : undefined,
        finalFare: ride.finalFare ? Number(ride.finalFare) : undefined,
        distance: ride.distance ? Number(ride.distance) : undefined,
        estimatedDuration: ride.estimatedDuration ?? undefined,
        actualDuration: ride.actualDuration ?? undefined,
        otp: ride.otp ?? undefined,
        createdAt: ride.createdAt,
        driverAssignedAt: ride.driverAssignedAt ?? undefined,
        pickedUpAt: ride.pickedUpAt ?? undefined,
        completedAt: ride.completedAt ?? undefined,
        cancelledAt: ride.cancelledAt ?? undefined,
        cancellationReason: ride.cancellationReason ?? undefined,
        cancelledBy: ride.cancelledBy ?? undefined,
        vehicleInfo: driverProfile
          ? {
              make: driverProfile.vehicleMake ?? undefined,
              model: driverProfile.vehicleModel ?? undefined,
              color: driverProfile.vehicleColor ?? undefined,
              plate: driverProfile.vehiclePlate ?? undefined,
            }
          : undefined,
        paymentStatus: ride.payment?.status ?? undefined,
        paymentMethod: ride.payment?.method ?? undefined,
        review: ride.reviews[0]
          ? { rating: ride.reviews[0].rating, comment: ride.reviews[0].comment ?? undefined }
          : undefined,
      };
    }),

  // ─── Accept Ride (Driver) ───
  accept: authedQuery
    .input(z.object({ rideId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const driverUserId = ctx.user.id;

      const driverProfile = await db.query.driverProfiles.findFirst({
        where: eq(driverProfiles.userId, driverUserId),
      });

      if (!driverProfile) {
        throw new Error("Driver profile not found");
      }

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, input.rideId),
      });

      if (!ride || ride.status !== "searching") {
        throw new Error("Ride not available");
      }

      // Assign driver
      await db
        .update(rides)
        .set({
          driverId: driverUserId,
          status: "driver_assigned",
          driverAssignedAt: new Date(),
        })
        .where(eq(rides.id, input.rideId));

      // Set driver unavailable
      await db
        .update(driverProfiles)
        .set({ isAvailable: false })
        .where(eq(driverProfiles.userId, driverUserId));

      // Create event
      await db.insert(rideEvents).values({
        rideId: input.rideId,
        eventType: "driver_assigned",
        metadata: JSON.stringify({ driverId: driverUserId }),
      });

      return { success: true };
    }),

  // ─── Decline Ride ───
  decline: authedQuery
    .input(z.object({ rideId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(rides)
        .set({ status: "declined" })
        .where(eq(rides.id, input.rideId));

      // Make driver available again
      await db
        .update(driverProfiles)
        .set({ isAvailable: true })
        .where(eq(driverProfiles.userId, ctx.user.id));

      return { success: true };
    }),

  // ─── Update Status ───
  updateStatus: authedQuery
    .input(
      z.object({
        rideId: z.number(),
        status: z.enum([
          "driver_arriving",
          "picked_up",
          "in_progress",
          "completed",
          "cancelled",
        ]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const ride = await db.query.rides.findFirst({
        where: eq(rides.id, input.rideId),
      });

      if (!ride) throw new Error("Ride not found");

      const isParticipant = ride.riderId === userId || ride.driverId === userId;
      if (!isParticipant) throw new Error("Unauthorized");

      const updateData: Record<string, unknown> = { status: input.status };
      let eventType: string = input.status;
      let eventMetadata: string | undefined;

      switch (input.status) {
        case "driver_arriving":
          updateData.driverAssignedAt = new Date();
          eventType = "driver_arriving";
          break;
        case "picked_up":
          updateData.pickedUpAt = new Date();
          eventType = "picked_up";
          break;
        case "in_progress":
          eventType = "picked_up";
          break;
        case "completed":
          updateData.completedAt = new Date();
          eventType = "dropped_off";
          break;
        case "cancelled":
          updateData.cancelledAt = new Date();
          updateData.cancellationReason = input.reason ?? null;
          updateData.cancelledBy = ride.riderId === userId ? "rider" : "driver";
          eventType = "cancelled";
          eventMetadata = JSON.stringify({ reason: input.reason, cancelledBy: ride.riderId === userId ? "rider" : "driver" });
          // Make driver available again
          if (ride.driverId) {
            await db
              .update(driverProfiles)
              .set({ isAvailable: true })
              .where(eq(driverProfiles.userId, ride.driverId));
          }
          break;
      }

      await db.update(rides).set(updateData).where(eq(rides.id, input.rideId));

      await db.insert(rideEvents).values({
        rideId: input.rideId,
        eventType: eventType as typeof rideEvents.$inferInsert.eventType,
        ...(eventMetadata && { metadata: eventMetadata }),
      });

      return { success: true };
    }),

  // ─── Add Tip ───
  addTip: authedQuery
    .input(
      z.object({
        rideId: z.number(),
        amount: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(rides)
        .set({
          tipAmount: input.amount.toString(),
          finalFare: sql`fare + ${input.amount}`,
        })
        .where(eq(rides.id, input.rideId));

      return { success: true };
    }),

  // ─── Get Ride History ───
  getHistory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Get all rides for this user (as rider or driver)
    const userRides = await db.query.rides.findMany({
      where: sql`${rides.riderId} = ${userId} OR ${rides.driverId} = ${userId}`,
      orderBy: [desc(rides.createdAt)],
      limit: 50,
      with: {
        rider: { columns: { id: true, name: true, avatar: true } },
        driver: { columns: { id: true, name: true, avatar: true } },
        payment: true,
        reviews: true,
      },
    });

    return userRides.map((ride) => ({
      id: ride.id,
      riderId: ride.riderId,
      driverId: ride.driverId ?? undefined,
      riderName: ride.rider?.name ?? undefined,
      driverName: ride.driver?.name ?? undefined,
      driverAvatar: ride.driver?.avatar ?? undefined,
      pickup: {
        lat: Number(ride.pickupLat),
        lng: Number(ride.pickupLng),
        address: ride.pickupAddress,
      },
      dropoff: {
        lat: Number(ride.dropoffLat),
        lng: Number(ride.dropoffLng),
        address: ride.dropoffAddress,
      },
      status: ride.status,
      rideType: ride.rideType,
      fare: ride.fare ? Number(ride.fare) : undefined,
      finalFare: ride.finalFare ? Number(ride.finalFare) : undefined,
      distance: ride.distance ? Number(ride.distance) : undefined,
      estimatedDuration: ride.estimatedDuration ?? undefined,
      createdAt: ride.createdAt,
      completedAt: ride.completedAt ?? undefined,
      cancelledAt: ride.cancelledAt ?? undefined,
      paymentStatus: ride.payment?.status ?? undefined,
      review: ride.reviews[0]
        ? { rating: ride.reviews[0].rating, comment: ride.reviews[0].comment ?? undefined }
        : undefined,
    }));
  }),

  // ─── Get Active Ride ───
  getActiveRide: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const activeStatuses = ["searching", "driver_assigned", "driver_arriving", "picked_up", "in_progress"] as const;

    // Get the most recent ride for this user
    const ride = await db.query.rides.findFirst({
      where: sql`${rides.riderId} = ${userId} OR ${rides.driverId} = ${userId}`,
      orderBy: [desc(rides.createdAt)],
    });

    if (ride && activeStatuses.includes(ride.status as typeof activeStatuses[number])) {
      // Fetch rider and driver names separately
      const rider = await db.query.users.findFirst({
        where: eq(users.id, ride.riderId),
      });
      const driver = ride.driverId
        ? await db.query.users.findFirst({
            where: eq(users.id, ride.driverId),
          })
        : null;
      const driverProfile = ride.driverId
        ? await db.query.driverProfiles.findFirst({
            where: eq(driverProfiles.userId, ride.driverId),
          })
        : null;

      return {
        id: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId ?? undefined,
        riderName: rider?.name ?? undefined,
        driverName: driver?.name ?? undefined,
        driverAvatar: driver?.avatar ?? undefined,
        driverPhone: driver?.phone ?? undefined,
        pickup: {
          lat: Number(ride.pickupLat),
          lng: Number(ride.pickupLng),
          address: ride.pickupAddress,
        },
        dropoff: {
          lat: Number(ride.dropoffLat),
          lng: Number(ride.dropoffLng),
          address: ride.dropoffAddress,
        },
        status: ride.status,
        rideType: ride.rideType,
        fare: ride.fare ? Number(ride.fare) : undefined,
        finalFare: ride.finalFare ? Number(ride.finalFare) : undefined,
        distance: ride.distance ? Number(ride.distance) : undefined,
        estimatedDuration: ride.estimatedDuration ?? undefined,
        otp: ride.otp ?? undefined,
        createdAt: ride.createdAt,
        driverAssignedAt: ride.driverAssignedAt ?? undefined,
        pickedUpAt: ride.pickedUpAt ?? undefined,
        vehicleInfo: driverProfile
          ? {
              make: driverProfile.vehicleMake ?? undefined,
              model: driverProfile.vehicleModel ?? undefined,
              color: driverProfile.vehicleColor ?? undefined,
              plate: driverProfile.vehiclePlate ?? undefined,
            }
          : undefined,
        paymentStatus: undefined,
      };
    }

    return null;
  }),
});
