import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Car,
  Star,
  MapPin,
  Phone,
  Mail,
  Shield,
  Save,
  Loader2,
  CircleDollarSign,
  History,
} from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: riderProfile } = trpc.rider.getProfile.useQuery(undefined, {
    enabled: user?.role === "user" || user?.role === "admin",
  });
  const { data: driverProfile } = trpc.driver.getProfile.useQuery(undefined, {
    enabled: user?.role === "driver" || user?.role === "admin",
  });
  const { data: riderStats } = trpc.rider.getStats.useQuery(undefined, {
    enabled: user?.role === "user" || user?.role === "admin",
  });

  const utils = trpc.useUtils();

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [homeAddress, setHomeAddress] = useState(riderProfile?.homeAddress ?? "");
  const [workAddress, setWorkAddress] = useState(riderProfile?.workAddress ?? "");
  const [emergencyContact, setEmergencyContact] = useState(riderProfile?.emergencyContact ?? "");

  const updateRiderMutation = trpc.rider.createOrUpdateProfile.useMutation({
    onSuccess: () => {
      toast({ title: "Profile updated!" });
      utils.rider.getProfile.invalidate();
    },
  });

  const handleSaveProfile = () => {
    updateRiderMutation.mutate({
      phone: phone || undefined,
      homeAddress: homeAddress || undefined,
      workAddress: workAddress || undefined,
      emergencyContact: emergencyContact || undefined,
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback className="text-3xl bg-primary/10">{user.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold">{user.name ?? "User"}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <Badge variant={user.role === "admin" ? "destructive" : user.role === "driver" ? "default" : "secondary"}>{user.role}</Badge>
                {riderStats && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{riderStats.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="rides">Ride Stats</TabsTrigger>
          {user.role === "driver" && <TabsTrigger value="vehicle">Vehicle</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" />Full Name</label>
                  <Input value={user.name ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" />Email</label>
                  <Input value={user.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" />Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1-555-0000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-muted-foreground" />Role</label>
                  <Input value={user.role} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {(user.role === "user" || user.role === "admin") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" />Saved Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Home Address</label>
                  <Input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="Enter your home address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Address</label>
                  <Input value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} placeholder="Enter your work address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Contact</label>
                  <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Emergency contact phone" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={updateRiderMutation.isPending}>
              {updateRiderMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="rides" className="space-y-4">
          {riderStats ? (
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><Car className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{riderStats.totalRides}</p><p className="text-xs text-muted-foreground">Total Rides</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><CircleDollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-2xl font-bold">${riderStats.totalSpent.toFixed(0)}</p><p className="text-xs text-muted-foreground">Total Spent</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Star className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">{riderStats.rating.toFixed(1)}</p><p className="text-xs text-muted-foreground">Your Rating</p></CardContent></Card>
            </div>
          ) : driverProfile ? (
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><Car className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{driverProfile.totalRides}</p><p className="text-xs text-muted-foreground">Total Rides</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><CircleDollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-2xl font-bold">${Number(driverProfile.totalEarnings).toFixed(0)}</p><p className="text-xs text-muted-foreground">Total Earnings</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Star className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">{Number(driverProfile.rating).toFixed(1)}</p><p className="text-xs text-muted-foreground">Your Rating</p></CardContent></Card>
            </div>
          ) : (
            <Card className="py-12 text-center"><CardContent><History className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No ride stats available yet.</p></CardContent></Card>
          )}
        </TabsContent>

        {user.role === "driver" && driverProfile && (
          <TabsContent value="vehicle" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Car className="w-4 h-4" />Vehicle Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">Vehicle Make</label><Input value={driverProfile.vehicleMake ?? "Not set"} disabled /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Vehicle Model</label><Input value={driverProfile.vehicleModel ?? "Not set"} disabled /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Year</label><Input value={driverProfile.vehicleYear?.toString() ?? "Not set"} disabled /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Color</label><Input value={driverProfile.vehicleColor ?? "Not set"} disabled /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">License Plate</label><Input value={driverProfile.vehiclePlate ?? "Not set"} disabled /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Vehicle Type</label><Input value={driverProfile.vehicleType} disabled /></div>
                </div>
                <Separator />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">License Number</label><Input value={driverProfile.licenseNumber ?? "Not set"} disabled /></div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Documents Verified</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${driverProfile.documentsVerified ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="text-sm">{driverProfile.documentsVerified ? "Verified" : "Pending Verification"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
