export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
  driverNotFound: "Driver not found",
  rideNotFound: "Ride not found",
  invalidRideStatus: "Invalid ride status transition",
  noDriversAvailable: "No drivers available in your area",
  paymentFailed: "Payment processing failed",
  promoCodeInvalid: "Invalid or expired promo code",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
  riderHome: "/ride",
  driverDashboard: "/drive",
  adminDashboard: "/admin",
} as const;

export const RideStatus = {
  SEARCHING: "searching",
  DRIVER_ASSIGNED: "driver_assigned",
  DRIVER_ARRIVING: "driver_arriving",
  PICKED_UP: "picked_up",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DECLINED: "declined",
} as const;

export const VehicleType = {
  ECONOMY: "economy",
  COMFORT: "comfort",
  PREMIUM: "premium",
  XL: "xl",
} as const;

export const PaymentMethod = {
  CARD: "card",
  CASH: "cash",
  WALLET: "wallet",
  APPLE_PAY: "apple_pay",
  GOOGLE_PAY: "google_pay",
} as const;

export const UserRole = {
  USER: "user",
  DRIVER: "driver",
  ADMIN: "admin",
} as const;

// Pricing constants
export const Pricing = {
  BASE_FARE: 2.50,
  PER_MILE_RATE: 1.75,
  PER_MINUTE_RATE: 0.35,
  BOOKING_FEE: 1.50,
  MINIMUM_FARE: 6.00,
  COMFORT_MULTIPLIER: 1.3,
  PREMIUM_MULTIPLIER: 2.0,
  XL_MULTIPLIER: 1.6,
  SURGE_THRESHOLD: 1.5,
  DRIVER_COMMISSION: 0.75,
} as const;

// Vehicle type display info
export const VehicleTypeInfo = {
  economy: { label: "CurbX", description: "Everyday rides at great prices", seats: 4, multiplier: 1 },
  comfort: { label: "CurbComfort", description: "Newer cars with extra legroom", seats: 4, multiplier: 1.3 },
  premium: { label: "CurbBlack", description: "Luxury vehicles with top drivers", seats: 4, multiplier: 2 },
  xl: { label: "CurbXL", description: "Spacious rides for groups up to 6", seats: 6, multiplier: 1.6 },
} as const;
