import { relations } from "drizzle-orm";
import {
  users,
  riderProfiles,
  driverProfiles,
  rides,
  rideEvents,
  payments,
  reviews,
  messages,
  savedLocations,
  promotions,
  userPromotions,
  earnings,
  notifications,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  riderProfile: one(riderProfiles, {
    fields: [users.id],
    references: [riderProfiles.userId],
  }),
  driverProfile: one(driverProfiles, {
    fields: [users.id],
    references: [driverProfiles.userId],
  }),
  ridesAsRider: many(rides, { relationName: "riderRides" }),
  ridesAsDriver: many(rides, { relationName: "driverRides" }),
  savedLocations: many(savedLocations),
  notifications: many(notifications),
}));

export const riderProfilesRelations = relations(riderProfiles, ({ one }) => ({
  user: one(users, {
    fields: [riderProfiles.userId],
    references: [users.id],
  }),
}));

export const driverProfilesRelations = relations(driverProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [driverProfiles.userId],
    references: [users.id],
  }),
  earnings: many(earnings),
}));

export const ridesRelations = relations(rides, ({ one, many }) => ({
  rider: one(users, {
    fields: [rides.riderId],
    references: [users.id],
    relationName: "riderRides",
  }),
  driver: one(users, {
    fields: [rides.driverId],
    references: [users.id],
    relationName: "driverRides",
  }),
  payment: one(payments),
  reviews: many(reviews),
  messages: many(messages),
  events: many(rideEvents),
}));

export const rideEventsRelations = relations(rideEvents, ({ one }) => ({
  ride: one(rides, {
    fields: [rideEvents.rideId],
    references: [rides.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  ride: one(rides, {
    fields: [payments.rideId],
    references: [rides.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  ride: one(rides, {
    fields: [reviews.rideId],
    references: [rides.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewee",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  ride: one(rides, {
    fields: [messages.rideId],
    references: [rides.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const savedLocationsRelations = relations(savedLocations, ({ one }) => ({
  user: one(users, {
    fields: [savedLocations.userId],
    references: [users.id],
  }),
}));

export const userPromotionsRelations = relations(userPromotions, ({ one }) => ({
  user: one(users, {
    fields: [userPromotions.userId],
    references: [users.id],
  }),
  promotion: one(promotions, {
    fields: [userPromotions.promotionId],
    references: [promotions.id],
  }),
}));

export const earningsRelations = relations(earnings, ({ one }) => ({
  driver: one(driverProfiles, {
    fields: [earnings.driverId],
    references: [driverProfiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
