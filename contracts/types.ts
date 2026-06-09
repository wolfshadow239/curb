import type { UserRole, RideStatus, VehicleType, PaymentMethod } from "./constants";

// ─── Shared Types ───
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export type RideStatusType = (typeof RideStatus)[keyof typeof RideStatus];
export type VehicleTypeType = (typeof VehicleType)[keyof typeof VehicleType];
export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface FareEstimate {
  vehicleType: VehicleTypeType;
  label: string;
  description: string;
  seats: number;
  estimatedFare: number;
  minFare: number;
  maxFare: number;
  estimatedDuration: number;
  estimatedDistance: number;
  multiplier: number;
}

export interface NearbyDriver {
  driverId: number;
  userId: number;
  name: string;
  avatar?: string;
  vehicleType: VehicleTypeType;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
  rating: number;
  lat: number;
  lng: number;
  heading?: number;
  etaMinutes: number;
  distance: number;
}

export interface RideWithDetails {
  id: number;
  riderId: number;
  driverId?: number;
  riderName?: string;
  driverName?: string;
  driverAvatar?: string;
  driverPhone?: string;
  pickup: GeoLocation;
  dropoff: GeoLocation;
  status: RideStatusType;
  rideType: VehicleTypeType;
  fare?: number;
  finalFare?: number;
  distance?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  otp?: string;
  createdAt: Date;
  driverAssignedAt?: Date;
  pickedUpAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: "rider" | "driver" | "system";
  vehicleInfo?: {
    make?: string;
    model?: string;
    color?: string;
    plate?: string;
  };
  paymentStatus?: string;
  paymentMethod?: PaymentMethodType;
  review?: {
    rating: number;
    comment?: string;
  };
}

export interface DriverStatus {
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: GeoLocation;
  heading?: number;
  speed?: number;
  todayEarnings: number;
  totalRides: number;
  rating: number;
}

export interface ChatMessage {
  id: number;
  rideId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: "ride_update" | "promotion" | "payment" | "system" | "chat";
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

export interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  maxDiscount?: number;
  minRideAmount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
}

export interface EarningSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  rideCount: number;
  tips: number;
  bonuses: number;
}

export interface DailyEarning {
  date: string;
  amount: number;
  rideCount: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRides: number;
  ridesToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  averageRating: number;
  completionRate: number;
  topDrivers: Array<{
    id: number;
    name: string;
    rating: number;
    totalRides: number;
    earnings: number;
  }>;
  recentRides: Array<{
    id: number;
    riderName: string;
    driverName: string;
    status: string;
    fare: number;
    createdAt: Date;
  }>;
}
