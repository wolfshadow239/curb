import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VehicleTypeInfo } from "@contracts/constants";
import {
  User,
  Car,
  MapPin,
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Star,
} from "lucide-react";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<"user" | "driver">("user");
  const [phone, setPhone] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState<"economy" | "comfort" | "premium" | "xl">("economy");
  const [licenseNumber, setLicenseNumber] = useState("");

  const riderMutation = trpc.rider.createOrUpdateProfile.useMutation({
    onSuccess: () => {
      refresh();
      navigate("/ride");
    },
  });

  const driverMutation = trpc.driver.createOrUpdateProfile.useMutation({
    onSuccess: () => {
      refresh();
      navigate("/drive");
    },
  });

  const handleComplete = () => {
    if (role === "user") {
      riderMutation.mutate({
        phone: phone || undefined,
        homeAddress: homeAddress || undefined,
        workAddress: workAddress || undefined,
      });
    } else {
      driverMutation.mutate({
        phone: phone || undefined,
        vehicleMake: vehicleMake || undefined,
        vehicleModel: vehicleModel || undefined,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
        vehicleColor: vehicleColor || undefined,
        vehiclePlate: vehiclePlate || undefined,
        vehicleType,
        licenseNumber: licenseNumber || undefined,
      });
    }
  };

  const steps = [
    { title: "Choose Your Role", description: "Are you riding or driving?" },
    { title: "Personal Info", description: "Basic details" },
    ...(role === "user"
      ? [{ title: "Saved Locations", description: "Home and work addresses" }]
      : [{ title: "Vehicle Info", description: "Your vehicle details" }]),
    { title: "All Set!", description: "Ready to go" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((_step, i) => (
              <div key={i} className={`flex flex-col items-center ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    i < step ? "bg-primary text-primary-foreground border-primary" : i === step ? "border-primary text-primary" : "border-muted-foreground/30"
                  }`}
                >
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{steps[step].title}</CardTitle>
            <CardDescription>{steps[step].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 0: Choose Role */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole("user")}
                  className={`p-6 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                    role === "user" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${role === "user" ? "bg-primary/20" : "bg-muted"}`}>
                    <User className={`w-7 h-7 ${role === "user" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="font-semibold mb-1">I Ride</h3>
                  <p className="text-xs text-muted-foreground">Book rides to get around</p>
                </button>
                <button
                  onClick={() => setRole("driver")}
                  className={`p-6 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                    role === "driver" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${role === "driver" ? "bg-primary/20" : "bg-muted"}`}>
                    <Car className={`w-7 h-7 ${role === "driver" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="font-semibold mb-1">I Drive</h3>
                  <p className="text-xs text-muted-foreground">Earn money driving</p>
                </button>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-0000" type="tel" />
                </div>
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Your phone is used for ride coordination and safety.
                </div>
              </div>
            )}

            {/* Step 2: Rider Locations */}
            {step === 2 && role === "user" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" />Home Address</label>
                  <Input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="123 Main St, City, State" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" />Work Address</label>
                  <Input value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} placeholder="555 Office Blvd, City, State" />
                </div>
                <p className="text-xs text-muted-foreground">These can be changed later in your profile.</p>
              </div>
            )}

            {/* Step 2: Vehicle Info */}
            {step === 2 && role === "driver" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><label className="text-sm font-medium">Make</label><Input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="Toyota" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Model</label><Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Camry" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Year</label><Input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="2023" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Color</label><Input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="Silver" /></div>
                </div>
                <div className="space-y-2"><label className="text-sm font-medium">License Plate</label><Input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="ABC123" /></div>
                <div className="space-y-2"><label className="text-sm font-medium">License Number</label><Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL12345678" /></div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vehicle Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["economy", "comfort", "premium", "xl"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setVehicleType(type)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          vehicleType === type ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {VehicleTypeInfo[type].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">You&apos;re All Set!</h3>
                <p className="text-muted-foreground mb-2">
                  {role === "user" ? "Start booking rides and exploring the city." : "Go online and start accepting ride requests."}
                </p>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Welcome to Curb!</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" />Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={riderMutation.isPending || driverMutation.isPending}>
                  {(riderMutation.isPending || driverMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Get Started
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
