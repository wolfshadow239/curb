import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  bigint,
  int,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 20 }),
  role: mysqlEnum("role", ["user", "driver", "admin"]).default("user").notNull(),
  isOnboardingComplete: boolean("is_onboarding_complete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Rider Profiles ───
export const riderProfiles = mysqlTable("rider_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  homeAddress: varchar("home_address", { length: 500 }),
  homeLat: decimal("home_lat", { precision: 10, scale: 8 }),
  homeLng: decimal("home_lng", { precision: 11, scale: 8 }),
  workAddress: varchar("work_address", { length: 500 }),
  workLat: decimal("work_lat", { precision: 10, scale: 8 }),
  workLng: decimal("work_lng", { precision: 11, scale: 8 }),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0").notNull(),
  totalRides: int("total_rides").default(0).notNull(),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00").notNull(),
  preferredPaymentMethod: mysqlEnum("preferred_payment_method", ["card", "cash", "wallet"]).default("card"),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type RiderProfile = typeof riderProfiles.$inferSelect;

// ─── Driver Profiles ───
export const driverProfiles = mysqlTable("driver_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  licenseNumber: varchar("license_number", { length: 100 }),
  licenseExpiry: timestamp("license_expiry"),
  vehicleMake: varchar("vehicle_make", { length: 100 }),
  vehicleModel: varchar("vehicle_model", { length: 100 }),
  vehicleYear: int("vehicle_year"),
  vehicleColor: varchar("vehicle_color", { length: 50 }),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }),
  vehicleType: mysqlEnum("vehicle_type", ["economy", "comfort", "premium", "xl"]).default("economy").notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  currentLat: decimal("current_lat", { precision: 10, scale: 8 }),
  currentLng: decimal("current_lng", { precision: 11, scale: 8 }),
  heading: decimal("heading", { precision: 5, scale: 2 }),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0").notNull(),
  totalRides: int("total_rides").default(0).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  todayEarnings: decimal("today_earnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  acceptanceRate: decimal("acceptance_rate", { precision: 5, scale: 2 }).default("100.00").notNull(),
  documentsVerified: boolean("documents_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type DriverProfile = typeof driverProfiles.$inferSelect;

// ─── Rides ───
export const rides = mysqlTable("rides", {
  id: serial("id").primaryKey(),
  riderId: bigint("rider_id", { mode: "number", unsigned: true }).notNull(),
  driverId: bigint("driver_id", { mode: "number", unsigned: true }),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 8 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 11, scale: 8 }).notNull(),
  pickupAddress: varchar("pickup_address", { length: 500 }).notNull(),
  dropoffLat: decimal("dropoff_lat", { precision: 10, scale: 8 }).notNull(),
  dropoffLng: decimal("dropoff_lng", { precision: 11, scale: 8 }).notNull(),
  dropoffAddress: varchar("dropoff_address", { length: 500 }).notNull(),
  status: mysqlEnum("status", [
    "searching",
    "driver_assigned",
    "driver_arriving",
    "picked_up",
    "in_progress",
    "completed",
    "cancelled",
    "declined",
  ]).default("searching").notNull(),
  rideType: mysqlEnum("ride_type", ["economy", "comfort", "premium", "xl"]).default("economy").notNull(),
  fare: decimal("fare", { precision: 10, scale: 2 }),
  baseFare: decimal("base_fare", { precision: 10, scale: 2 }),
  distanceFare: decimal("distance_fare", { precision: 10, scale: 2 }),
  timeFare: decimal("time_fare", { precision: 10, scale: 2 }),
  surgeMultiplier: decimal("surge_multiplier", { precision: 3, scale: 2 }).default("1.00").notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  finalFare: decimal("final_fare", { precision: 10, scale: 2 }),
  distance: decimal("distance", { precision: 6, scale: 2 }),
  estimatedDuration: int("estimated_duration"),
  actualDuration: int("actual_duration"),
  otp: varchar("otp", { length: 4 }),
  cancellationReason: varchar("cancellation_reason", { length: 255 }),
  cancelledBy: mysqlEnum("cancelled_by", ["rider", "driver", "system"]),
  routePolyline: text("route_polyline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  driverAssignedAt: timestamp("driver_assigned_at"),
  pickedUpAt: timestamp("picked_up_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
});

export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;

// ─── Ride Events (for timeline/tracking) ───
export const rideEvents = mysqlTable("ride_events", {
  id: serial("id").primaryKey(),
  rideId: bigint("ride_id", { mode: "number", unsigned: true }).notNull(),
  eventType: mysqlEnum("event_type", [
    "requested",
    "driver_assigned",
    "driver_arriving",
    "arrived_at_pickup",
    "picked_up",
    "route_updated",
    "dropped_off",
    "completed",
    "cancelled",
    "payment_processed",
  ]).notNull(),
  lat: decimal("lat", { precision: 10, scale: 8 }),
  lng: decimal("lng", { precision: 11, scale: 8 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Payments ───
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  rideId: bigint("ride_id", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "refunded"]).default("pending").notNull(),
  method: mysqlEnum("method", ["card", "cash", "wallet", "apple_pay", "google_pay"]).default("card").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundReason: varchar("refund_reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Payment = typeof payments.$inferSelect;

// ─── Reviews ───
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  rideId: bigint("ride_id", { mode: "number", unsigned: true }).notNull(),
  reviewerId: bigint("reviewer_id", { mode: "number", unsigned: true }).notNull(),
  revieweeId: bigint("reviewee_id", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  categories: json("categories"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ─── Messages (In-app chat) ───
export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  rideId: bigint("ride_id", { mode: "number", unsigned: true }).notNull(),
  senderId: bigint("sender_id", { mode: "number", unsigned: true }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

// ─── Saved Locations ───
export const savedLocations = mysqlTable("saved_locations", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 8 }).notNull(),
  lng: decimal("lng", { precision: 11, scale: 8 }).notNull(),
  type: mysqlEnum("type", ["home", "work", "favorite", "recent"]).default("favorite").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Promotions ───
export const promotions = mysqlTable("promotions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  discountType: mysqlEnum("discount_type", ["percentage", "fixed_amount"]).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  minRideAmount: decimal("min_ride_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  usageLimit: int("usage_limit"),
  usageCount: int("usage_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── User Promotions ───
export const userPromotions = mysqlTable("user_promotions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  promotionId: bigint("promotion_id", { mode: "number", unsigned: true }).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Earnings (Driver daily earnings breakdown) ───
export const earnings = mysqlTable("earnings", {
  id: serial("id").primaryKey(),
  driverId: bigint("driver_id", { mode: "number", unsigned: true }).notNull(),
  rideId: bigint("ride_id", { mode: "number", unsigned: true }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["ride_fare", "tip", "bonus", "promotion"]).default("ride_fare").notNull(),
  description: varchar("description", { length: 255 }),
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Notifications ───
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["ride_update", "promotion", "payment", "system", "chat"]).default("system").notNull(),
  data: json("data"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
