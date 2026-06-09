import { authRouter } from "./auth-router";
import { riderRouter } from "./rider-router";
import { driverRouter } from "./driver-router";
import { rideRouter } from "./ride-router";
import { paymentRouter } from "./payment-router";
import { reviewRouter } from "./review-router";
import { messageRouter } from "./message-router";
import { locationRouter } from "./location-router";
import { promotionRouter } from "./promotion-router";
import { notificationRouter } from "./notification-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  rider: riderRouter,
  driver: driverRouter,
  ride: rideRouter,
  payment: paymentRouter,
  review: reviewRouter,
  message: messageRouter,
  location: locationRouter,
  promotion: promotionRouter,
  notification: notificationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
