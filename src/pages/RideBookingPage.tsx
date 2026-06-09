import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypeInfo, Pricing } from "@contracts/constants";
import type { VehicleTypeType } from "@contracts/types";
import {
  MapPin,
  Crosshair,
  Clock,
  Users,
  ArrowRight,
  Navigation,
  Search,
  Loader2,
  Tag,
  X,
} from "lucide-react";

// Default to San Francisco coordinates
const DEFAULT_PICKUP = { lat: 37.7749, lng: -122.4194, address: "Union Square, San Francisco, CA" };
const DEFAULT_DROPOFF = { lat: 37.7897, lng: -122.3972, address: "Financial District, San Francisco, CA" };

export function RideBookingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pickup, setPickup] = useState(DEFAULT_PICKUP);
  const [dropoff, setDropoff] = useState(DEFAULT_DROPOFF);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTypeType>("economy");
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [step, setStep] = useState<"location" | "fare" | "booking">("location");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // ─── tRPC Queries ───
  const { data: fareData } = trpc.ride.estimateFare.useQuery(
    {
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
    },
    { enabled: step === "fare" || step === "booking" }
  );

  const { data: nearbyDrivers } = trpc.ride.findNearbyDrivers.useQuery(
    { lat: pickup.lat, lng: pickup.lng, radius: 5 },
    { enabled: step === "fare" || step === "booking", refetchInterval: 10000 }
  );

  const { data: promoValidation } = trpc.promotion.validate.useQuery(
    { code: promoCode, rideAmount: fareData?.estimates.find((e) => e.vehicleType === selectedVehicle)?.estimatedFare ?? 0 },
    { enabled: promoCode.length > 0 && step === "fare" }
  );

  // ─── Mutations ───
  const createRideMutation = trpc.ride.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "Ride booked!", description: `Your driver is on the way. OTP: ${data.otp}` });
      navigate("/ride/active");
    },
    onError: (err) => {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    },
  });

  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickup({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location",
          });
          setIsGettingLocation(false);
          toast({ title: "Location detected", description: "Using your current location as pickup." });
        },
        () => {
          setIsGettingLocation(false);
          toast({ title: "Location error", description: "Could not get your location.", variant: "destructive" });
        }
      );
    }
  }, [toast]);

  const handleBookRide = () => {
    createRideMutation.mutate({
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupAddress: pickup.address,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      dropoffAddress: dropoff.address,
      rideType: selectedVehicle,
      promoCode: promoCode || undefined,
    });
  };

  const selectedFare = fareData?.estimates.find((e) => e.vehicleType === selectedVehicle);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Map & Inputs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map Placeholder */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-slate-100 to-slate-200">
              {/* Simulated Map */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 800 500">
                  {/* Grid lines */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <g key={i}>
                      <line x1={i * 40} y1="0" x2={i * 40} y2="500" stroke="#cbd5e1" strokeWidth="0.5" />
                      <line x1="0" y1={i * 25} x2="800" y2={i * 25} stroke="#cbd5e1" strokeWidth="0.5" />
                    </g>
                  ))}
                  {/* Roads */}
                  <line x1="100" y1="0" x2="100" y2="500" stroke="#94a3b8" strokeWidth="8" />
                  <line x1="300" y1="0" x2="300" y2="500" stroke="#94a3b8" strokeWidth="6" />
                  <line x1="500" y1="0" x2="500" y2="500" stroke="#94a3b8" strokeWidth="8" />
                  <line x1="700" y1="0" x2="700" y2="500" stroke="#94a3b8" strokeWidth="6" />
                  <line x1="0" y1="125" x2="800" y2="125" stroke="#94a3b8" strokeWidth="6" />
                  <line x1="0" y1="250" x2="800" y2="250" stroke="#94a3b8" strokeWidth="8" />
                  <line x1="0" y1="375" x2="800" y2="375" stroke="#94a3b8" strokeWidth="6" />
                  {/* Water */}
                  <rect x="550" y="350" width="250" height="150" fill="#bfdbfe" opacity="0.5" rx="20" />
                  {/* Parks */}
                  <rect x="320" y="20" width="160" height="90" fill="#bbf7d0" opacity="0.6" rx="10" />
                  <rect x="120" y="280" width="150" height="80" fill="#bbf7d0" opacity="0.6" rx="10" />
                </svg>

                {/* Pickup Pin */}
                <div className="absolute" style={{ left: "48%", top: "52%" }}>
                  <div className="relative">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45" />
                  </div>
                </div>

                {/* Dropoff Pin */}
                <div className="absolute" style={{ left: "58%", top: "38%" }}>
                  <div className="relative">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45" />
                  </div>
                </div>

                {/* Nearby driver pins */}
                {nearbyDrivers?.slice(0, 5).map((driver, i) => (
                  <div
                    key={driver.driverId}
                    className="absolute transition-all duration-1000"
                    style={{ left: `${35 + i * 8}%`, top: `${40 + (i % 3) * 10}%` }}
                  >
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                      <Navigation className="w-3 h-3 text-white" style={{ transform: `rotate(${driver.heading ?? 0}deg)` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Map overlay info */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span>Pickup</span>
                  <span className="text-muted-foreground">|</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Dropoff</span>
                </div>
              </div>

              {nearbyDrivers && nearbyDrivers.length > 0 && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-md">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="font-medium">{nearbyDrivers.length} drivers nearby</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Location Inputs */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Pickup */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium">Pickup</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={pickup.address}
                      onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                      className="flex-1"
                      placeholder="Enter pickup location"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Crosshair className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="w-10 flex justify-center">
                  <div className="w-0.5 h-6 bg-border" />
                </div>
                <div className="flex-1" />
              </div>

              {/* Dropoff */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium">Dropoff</label>
                  <Input
                    value={dropoff.address}
                    onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
                    placeholder="Where to?"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {step === "location" ? (
                  <Button className="flex-1" size="lg" onClick={() => setStep("fare")}>
                    <Search className="w-4 h-4 mr-2" />
                    See Prices
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1" onClick={() => setStep("location")}>
                    <X className="w-4 h-4 mr-2" />
                    Change Locations
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Fare Estimates & Booking */}
        <div className="space-y-4">
          {(step === "fare" || step === "booking") && fareData && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Choose Your Ride</span>
                    <Badge variant="secondary" className="font-normal">
                      <Clock className="w-3 h-3 mr-1" />
                      {fareData.duration} min
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fareData.estimates.map((estimate) => (
                    <button
                      key={estimate.vehicleType}
                      onClick={() => setSelectedVehicle(estimate.vehicleType)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        selectedVehicle === estimate.vehicleType
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <img src="/car-premium.jpg" alt={estimate.label} className="w-10 h-10 object-cover rounded" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{estimate.label}</span>
                          <span className="font-bold text-lg">${estimate.estimatedFare.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{estimate.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {estimate.estimatedDuration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {estimate.seats}
                          </span>
                          {nearbyDrivers?.filter((d) => d.vehicleType === estimate.vehicleType).length ? (
                            <span className="text-emerald-600 font-medium">
                              {nearbyDrivers.filter((d) => d.vehicleType === estimate.vehicleType).length} nearby
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Promo Code */}
              <Card>
                <CardContent className="p-4">
                  {!showPromoInput ? (
                    <button onClick={() => setShowPromoInput(true)} className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Tag className="w-4 h-4" />
                      Add promo code
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Enter promo code" className="flex-1" />
                      <Button variant="ghost" size="icon" onClick={() => { setShowPromoInput(false); setPromoCode(""); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {promoValidation?.valid && promoValidation.discount !== undefined && (
                    <p className="text-xs text-emerald-600 mt-2">Discount: ${promoValidation.discount.toFixed(2)} off</p>
                  )}
                  {promoValidation && !promoValidation.valid && promoCode.length > 0 && (
                    <p className="text-xs text-red-500 mt-2">{promoValidation.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Fare Breakdown */}
              {selectedFare && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-sm">Fare Breakdown</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Base fare</span>
                        <span>${(Pricing.BASE_FARE * selectedFare.multiplier).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Distance ({selectedFare.estimatedDistance.toFixed(1)} mi)</span>
                        <span>${(selectedFare.estimatedDistance * Pricing.PER_MILE_RATE * selectedFare.multiplier).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Time ({selectedFare.estimatedDuration} min)</span>
                        <span>${(selectedFare.estimatedDuration * Pricing.PER_MINUTE_RATE * selectedFare.multiplier).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Booking fee</span>
                        <span>$1.50</span>
                      </div>
                      {promoValidation?.valid && promoValidation.discount !== undefined && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Promo discount</span>
                          <span>-${promoValidation.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span>
                          ${promoValidation?.valid && promoValidation.discount !== undefined
                            ? Math.max(0, selectedFare.estimatedFare - promoValidation.discount).toFixed(2)
                            : selectedFare.estimatedFare.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Book Button */}
              <Button className="w-full" size="lg" onClick={handleBookRide} disabled={createRideMutation.isPending}>
                {createRideMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    Book {VehicleTypeInfo[selectedVehicle].label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === "location" && (
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to Ride?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Enter your pickup and drop-off locations to see available rides and fares.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Clock className="w-3 h-3" />
                  <span>Average pickup time: 3-5 minutes</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
