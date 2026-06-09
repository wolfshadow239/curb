import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { VehicleTypeInfo } from "@contracts/constants";
import {
  Power,
  DollarSign,
  Star,
  Car,
  Clock,
  TrendingUp,
  MapPin,
  Navigation,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
} from "lucide-react";

export function DriverDashboardPage() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);

  const utils = trpc.useUtils();

  const { data: stats } = trpc.driver.getStats.useQuery();
  const { data: nearbyRequests } = trpc.driver.getNearbyRequests.useQuery(undefined, {
    enabled: isOnline,
    refetchInterval: isOnline ? 10000 : false,
  });
  const { data: earnings } = trpc.driver.getEarnings.useQuery({ period: "week" });
  const { data: rideHistory } = trpc.ride.getHistory.useQuery();

  const toggleOnlineMutation = trpc.driver.toggleOnline.useMutation({
    onSuccess: (data) => {
      setIsOnline(data.isOnline);
      utils.driver.getStats.invalidate();
      toast({
        title: data.isOnline ? "You're online!" : "You're offline",
        description: data.isOnline ? "Ready to accept ride requests." : "You won't receive new requests.",
      });
    },
  });

  const acceptRideMutation = trpc.ride.accept.useMutation({
    onSuccess: () => {
      toast({ title: "Ride accepted!", description: "Head to the pickup location." });
      utils.ride.getHistory.invalidate();
      utils.driver.getNearbyRequests.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = trpc.ride.updateStatus.useMutation({
    onSuccess: () => {
      utils.ride.getHistory.invalidate();
      utils.driver.getStats.invalidate();
    },
  });

  const handleToggleOnline = () => {
    toggleOnlineMutation.mutate({ isOnline: !isOnline });
  };

  const activeRide = rideHistory?.find(
    (r) => r.status === "driver_assigned" || r.status === "driver_arriving" || r.status === "picked_up" || r.status === "in_progress"
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header with Online Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          <p className="text-muted-foreground">Manage your rides and earnings</p>
        </div>
        <div className="flex items-center gap-3 bg-card border rounded-full px-5 py-3 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          <span className="font-medium text-sm">{isOnline ? "Online" : "Offline"}</span>
          <Switch checked={isOnline} onCheckedChange={handleToggleOnline} disabled={toggleOnlineMutation.isPending} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Earnings", value: `$${stats?.todayEarnings.toFixed(2) ?? "0.00"}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Rides", value: stats?.totalRides.toString() ?? "0", icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Rating", value: stats?.rating.toFixed(1) ?? "5.0", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Acceptance Rate", value: `${stats?.acceptanceRate.toFixed(0) ?? "100"}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="rides" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
          <TabsTrigger value="rides">Ride Requests</TabsTrigger>
          <TabsTrigger value="active">Active Ride</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        {/* Ride Requests Tab */}
        <TabsContent value="rides" className="space-y-4">
          {!isOnline ? (
            <Card className="py-16 text-center">
              <CardContent>
                <Power className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Go Online to See Requests</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Toggle the online switch above to start receiving ride requests in your area.
                </p>
              </CardContent>
            </Card>
          ) : !nearbyRequests || nearbyRequests.length === 0 ? (
            <Card className="py-16 text-center">
              <CardContent>
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Requests Right Now</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Stay online. Ride requests will appear here when riders nearby need a driver.
                </p>
              </CardContent>
            </Card>
          ) : (
            nearbyRequests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {VehicleTypeInfo[request.rideType]?.label ?? request.rideType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(request.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                          <span className="truncate">{request.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="truncate">{request.dropoffAddress}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5" />
                          {request.distance ? Number(request.distance).toFixed(1) : "--"} mi
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {request.estimatedDuration ?? "--"} min
                        </span>
                        <span className="font-semibold text-foreground">${request.fare ? Number(request.fare).toFixed(2) : "--"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => acceptRideMutation.mutate({ rideId: request.id })}
                        disabled={acceptRideMutation.isPending}
                      >
                        {acceptRideMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Accept
                      </Button>
                      <Button variant="outline" size="sm">
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Active Ride Tab */}
        <TabsContent value="active">
          {!activeRide ? (
            <Card className="py-16 text-center">
              <CardContent>
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Ride</h3>
                <p className="text-muted-foreground">Accept a ride request to see it here.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Ride</span>
                  <Badge>{activeRide.status.replace("_", " ")}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-muted-foreground">Pickup:</span>
                    <span>{activeRide.pickup.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-muted-foreground">Dropoff:</span>
                    <span>{activeRide.dropoff.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{activeRide.riderName?.charAt(0) ?? "R"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{activeRide.riderName ?? "Rider"}</p>
                    <p className="text-xs text-muted-foreground">Check app for OTP</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeRide.status === "driver_assigned" && (
                    <Button
                      className="flex-1"
                      onClick={() => updateStatusMutation.mutate({ rideId: activeRide.id, status: "driver_arriving" })}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Start Navigation
                    </Button>
                  )}
                  {activeRide.status === "driver_arriving" && (
                    <Button
                      className="flex-1"
                      onClick={() => updateStatusMutation.mutate({ rideId: activeRide.id, status: "picked_up" })}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Pickup
                    </Button>
                  )}
                  {(activeRide.status === "picked_up" || activeRide.status === "in_progress") && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        updateStatusMutation.mutate({ rideId: activeRide.id, status: "completed" });
                        toast({ title: "Ride completed!", description: "Great job!" });
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Ride
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${stats?.totalEarnings.toFixed(2) ?? "0.00"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  ${earnings?.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2) ?? "0.00"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Rides This Week</p>
                <p className="text-2xl font-bold">{earnings?.reduce((sum, e) => sum + Number(e.rideCount), 0) ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Daily Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {earnings && earnings.length > 0 ? (
                <div className="space-y-3">
                  {earnings.map((e) => (
                    <div key={e.date} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24">{e.date}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (Number(e.amount) / 300) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">${Number(e.amount).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No earnings data yet. Start driving!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
