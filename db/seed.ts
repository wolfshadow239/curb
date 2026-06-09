import { getDb } from "../api/queries/connection";
import { users, driverProfiles, riderProfiles, rides, payments, reviews, promotions, earnings } from "./schema";
import { sql } from "drizzle-orm";

const db = getDb();

async function seed() {
  console.log("Seeding database...");

  // ─── Clear existing data ───
  await db.delete(earnings);
  await db.delete(reviews);
  await db.delete(payments);
  await db.delete(rides);
  await db.delete(driverProfiles);
  await db.delete(riderProfiles);
  await db.delete(promotions);
  await db.delete(users);

  // ─── Create sample riders ───
  const riderUsers = await db.insert(users).values([
    { unionId: "rider_1", name: "Alex Johnson", email: "alex@example.com", phone: "+1-555-0101", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", role: "user", isOnboardingComplete: true },
    { unionId: "rider_2", name: "Sarah Chen", email: "sarah@example.com", phone: "+1-555-0102", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", role: "user", isOnboardingComplete: true },
    { unionId: "rider_3", name: "Mike Williams", email: "mike@example.com", phone: "+1-555-0103", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", role: "user", isOnboardingComplete: true },
    { unionId: "rider_4", name: "Emma Davis", email: "emma@example.com", phone: "+1-555-0104", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma", role: "user", isOnboardingComplete: true },
    { unionId: "rider_5", name: "James Wilson", email: "james@example.com", phone: "+1-555-0105", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james", role: "user", isOnboardingComplete: true },
  ]);

  // ─── Create sample drivers ───
  const driverUsers = await db.insert(users).values([
    { unionId: "driver_1", name: "Robert Martinez", email: "robert@example.com", phone: "+1-555-0201", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=robert", role: "driver", isOnboardingComplete: true },
    { unionId: "driver_2", name: "Lisa Anderson", email: "lisa@example.com", phone: "+1-555-0202", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa", role: "driver", isOnboardingComplete: true },
    { unionId: "driver_3", name: "David Thompson", email: "david@example.com", phone: "+1-555-0203", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david", role: "driver", isOnboardingComplete: true },
    { unionId: "driver_4", name: "Jennifer Lee", email: "jennifer@example.com", phone: "+1-555-0204", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jennifer", role: "driver", isOnboardingComplete: true },
    { unionId: "driver_5", name: "Michael Brown", email: "michael@example.com", phone: "+1-555-0205", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael", role: "driver", isOnboardingComplete: true },
    { unionId: "driver_6", name: "Amanda Garcia", email: "amanda@example.com", phone: "+1-555-0206", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amanda", role: "driver", isOnboardingComplete: true },
  ]);

  // ─── Create admin ───
  await db.insert(users).values([
    { unionId: "admin_1", name: "Admin User", email: "admin@curb.com", phone: "+1-555-0001", role: "admin", isOnboardingComplete: true },
  ]);

  // ─── Create rider profiles ───
  const riderIds = [1, 2, 3, 4, 5];
  await db.insert(riderProfiles).values(
    riderIds.map((id) => ({
      userId: id,
      homeAddress: "123 Main St, San Francisco, CA",
      homeLat: "37.7749",
      homeLng: "-122.4194",
      workAddress: "555 Market St, San Francisco, CA",
      workLat: "37.7897",
      workLng: "-122.3972",
      rating: "4.8",
      totalRides: Math.floor(Math.random() * 100) + 10,
      totalSpent: (Math.random() * 1000 + 200).toFixed(2),
      preferredPaymentMethod: "card" as const,
    }))
  );

  // ─── Create driver profiles ───
  const driverData = [
    { userId: 6, make: "Toyota", model: "Camry", year: 2022, color: "Silver", plate: "ABC123", type: "comfort" as const, lat: "37.7755", lng: "-122.4183", rating: "4.9", rides: 342, earnings: 12450 },
    { userId: 7, make: "Honda", model: "Civic", year: 2021, color: "Black", plate: "DEF456", type: "economy" as const, lat: "37.7849", lng: "-122.4094", rating: "4.7", rides: 218, earnings: 8320 },
    { userId: 8, make: "BMW", model: "5 Series", year: 2023, color: "White", plate: "GHI789", type: "premium" as const, lat: "37.7698", lng: "-122.4269", rating: "5.0", rides: 156, earnings: 18900 },
    { userId: 9, make: "Tesla", model: "Model Y", year: 2023, color: "Red", plate: "JKL012", type: "comfort" as const, lat: "37.7808", lng: "-122.4145", rating: "4.8", rides: 267, earnings: 11200 },
    { userId: 10, make: "Mercedes", model: "Sprinter", year: 2022, color: "Gray", plate: "MNO345", type: "xl" as const, lat: "37.7712", lng: "-122.4231", rating: "4.9", rides: 189, earnings: 15600 },
    { userId: 11, make: "Toyota", model: "Prius", year: 2021, color: "Blue", plate: "PQR678", type: "economy" as const, lat: "37.7876", lng: "-122.4072", rating: "4.6", rides: 412, earnings: 9870 },
  ];

  await db.insert(driverProfiles).values(
    driverData.map((d) => ({
      userId: d.userId,
      licenseNumber: `DL${d.userId}987654`,
      licenseExpiry: new Date("2026-12-31"),
      vehicleMake: d.make,
      vehicleModel: d.model,
      vehicleYear: d.year,
      vehicleColor: d.color,
      vehiclePlate: d.plate,
      vehicleType: d.type,
      isOnline: true,
      isAvailable: true,
      currentLat: d.lat,
      currentLng: d.lng,
      rating: d.rating,
      totalRides: d.rides,
      totalEarnings: d.earnings.toFixed(2),
      todayEarnings: (Math.random() * 200 + 50).toFixed(2),
      documentsVerified: true,
    }))
  );

  // ─── Create sample completed rides ───
  const rideData = [
    { riderId: 1, driverId: 6, pickup: "37.7749,-122.4194", dropoff: "37.7897,-122.3972", pickupAddr: "123 Main St, SF", dropoffAddr: "555 Market St, SF", fare: 18.50, type: "comfort" as const },
    { riderId: 2, driverId: 7, pickup: "37.7849,-122.4094", dropoff: "37.7698,-122.4269", pickupAddr: "Embarcadero Center, SF", dropoffAddr: "Golden Gate Park, SF", fare: 24.75, type: "economy" as const },
    { riderId: 3, driverId: 8, pickup: "37.7698,-122.4269", dropoff: "37.7808,-122.4145", pickupAddr: "Haight-Ashbury, SF", dropoffAddr: "Union Square, SF", fare: 32.00, type: "premium" as const },
    { riderId: 4, driverId: 9, pickup: "37.7808,-122.4145", dropoff: "37.7712,-122.4231", pickupAddr: "Fisherman's Wharf, SF", dropoffAddr: "Lombard St, SF", fare: 15.25, type: "comfort" as const },
    { riderId: 5, driverId: 10, pickup: "37.7712,-122.4231", dropoff: "37.7876,-122.4072", pickupAddr: "Palace of Fine Arts, SF", dropoffAddr: "Chinatown, SF", fare: 28.50, type: "xl" as const },
    { riderId: 1, driverId: 11, pickup: "37.7876,-122.4072", dropoff: "37.7749,-122.4194", pickupAddr: "SFMOMA, SF", dropoffAddr: "123 Main St, SF", fare: 12.75, type: "economy" as const },
    { riderId: 2, driverId: 6, pickup: "37.7749,-122.4194", dropoff: "37.7849,-122.4094", pickupAddr: "Mission District, SF", dropoffAddr: "Financial District, SF", fare: 19.00, type: "comfort" as const },
    { riderId: 3, driverId: 7, pickup: "37.7849,-122.4094", dropoff: "37.7698,-122.4269", pickupAddr: "SoMa, SF", dropoffAddr: "Sunset District, SF", fare: 22.50, type: "economy" as const },
  ];

  const rideIds: number[] = [];
  for (const r of rideData) {
    const [result] = await db.insert(rides).values({
      riderId: r.riderId,
      driverId: r.driverId,
      pickupLat: r.pickup.split(",")[0],
      pickupLng: r.pickup.split(",")[1],
      pickupAddress: r.pickupAddr,
      dropoffLat: r.dropoff.split(",")[0],
      dropoffLng: r.dropoff.split(",")[1],
      dropoffAddress: r.dropoffAddr,
      status: "completed",
      rideType: r.type,
      fare: r.fare.toFixed(2),
      baseFare: "2.50",
      distanceFare: (r.fare * 0.6).toFixed(2),
      timeFare: (r.fare * 0.2).toFixed(2),
      surgeMultiplier: "1.00",
      discountAmount: "0.00",
      tipAmount: (r.fare * 0.15).toFixed(2),
      finalFare: (r.fare * 1.15).toFixed(2),
      distance: (Math.random() * 5 + 2).toFixed(2),
      estimatedDuration: Math.floor(Math.random() * 20 + 10),
      actualDuration: Math.floor(Math.random() * 20 + 10),
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      driverAssignedAt: new Date(Date.now() - 86400000),
      pickedUpAt: new Date(Date.now() - 86000000),
      completedAt: new Date(Date.now() - 85800000),
    });
    rideIds.push(Number(result.insertId));
  }

  // ─── Create payments for completed rides ───
  for (let i = 0; i < rideIds.length; i++) {
    await db.insert(payments).values({
      rideId: rideIds[i],
      amount: rideData[i].fare.toFixed(2),
      status: "completed",
      method: "card",
      stripePaymentIntentId: `pi_seed_${rideIds[i]}`,
    });
  }

  // ─── Create reviews ───
  for (let i = 0; i < rideIds.length; i++) {
    await db.insert(reviews).values({
      rideId: rideIds[i],
      reviewerId: rideData[i].riderId,
      revieweeId: rideData[i].driverId,
      rating: Math.floor(Math.random() * 2) + 4,
      comment: ["Great ride!", "Excellent driver, very professional.", "Clean car, smooth ride.", "On time and friendly!", "Perfect experience."][i % 5],
    });
  }

  // ─── Create earnings records ───
  const today = new Date().toISOString().split("T")[0];
  for (const d of driverData) {
    await db.insert(earnings).values({
      driverId: d.userId - 5, // driver profile ids start at 1
      rideId: null,
      amount: d.earnings.toFixed(2),
      type: "ride_fare",
      description: "Daily earnings",
      date: today,
    });
  }

  // ─── Create promotions ───
  await db.insert(promotions).values([
    { code: "WELCOME50", description: "50% off your first ride (up to $10)", discountType: "percentage", discountValue: "50.00", maxDiscount: "10.00", minRideAmount: "5.00", validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimit: 1000 },
    { code: "CURBCOMFORT", description: "$5 off CurbComfort rides", discountType: "fixed_amount", discountValue: "5.00", maxDiscount: null, minRideAmount: "15.00", validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimit: 500 },
    { code: "FRIDAY20", description: "20% off Friday rides", discountType: "percentage", discountValue: "20.00", maxDiscount: "8.00", minRideAmount: "10.00", validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimit: 200 },
    { code: "WEEKEND15", description: "15% off weekend rides", discountType: "percentage", discountValue: "15.00", maxDiscount: "12.00", minRideAmount: "8.00", validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimit: 300 },
    { code: "BLACKCAR10", description: "$10 off CurbBlack rides", discountType: "fixed_amount", discountValue: "10.00", maxDiscount: null, minRideAmount: "25.00", validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimit: 200 },
  ]);

  console.log("Seed completed successfully!");
  console.log(`Created ${riderIds.length} riders, ${driverData.length} drivers, ${rideIds.length} rides, and 5 promotions.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
