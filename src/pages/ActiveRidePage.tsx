import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Phone,
  MessageSquare,
  Star,
  Shield,
  Navigation,
  Clock,
  X,
  Loader2,
  CheckCircle,
  Car,
  User,
} from "lucide-react";

type RideStatus = "searching" | "driver_assigned" | "driver_arriving" | "picked_up" | "in_progress" | "completed";

const statusConfig: Record<RideStatus, { label: string; color: string; icon: typeof Car }> = {
  searching: { label: "Finding Driver", color: "bg-amber-500", icon: Clock },
  driver_assigned: { label: "Driver Assigned", color: "bg-blue-500", icon: Car },
  driver_arriving: { label: "Driver Arriving", color: "bg-cyan-500", icon: Navigation },
  picked_up: { label: "Picked Up", color: "bg-emerald-500", icon: CheckCircle },
  in_progress: { label: "On the Way", color: "bg-emerald-600", icon: Navigation },
  completed: { label: "Completed", color: "bg-slate-500", icon: CheckCircle },
};

export function ActiveRidePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [etaSeconds, setEtaSeconds] = useState(180);

  const utils = trpc.useUtils();

  const { data: activeRide, isLoading } = trpc.ride.getActiveRide.useQuery(undefined, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (activeRide?.status === "driver_arriving" && etaSeconds > 0) {
      const timer = setInterval(() => setEtaSeconds((s) => Math.max(0, s - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [activeRide?.status, etaSeconds]);

  const cancelMutation = trpc.ride.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: "Ride cancelled", description: "Your ride has been cancelled." });
      setCancelDialogOpen(false);
      utils.ride.getActiveRide.invalidate();
      navigate("/ride");
    },
  });

  const messageMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setChatMessage("");
      utils.message.getForRide.invalidate({ rideId: activeRide?.id ?? 0 });
    },
  });

  const { data: messages } = trpc.message.getForRide.useQuery(
    { rideId: activeRide?.id ?? 0 },
    { enabled: !!activeRide && chatOpen }
  );

  const handleCancel = () => {
    if (!activeRide) return;
    cancelMutation.mutate({
      rideId: activeRide.id,
      status: "cancelled",
      reason: cancelReason,
    });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !activeRide) return;
    messageMutation.mutate({ rideId: activeRide.id, content: chatMessage });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your ride...</p>
      </div>
    );
  }

  if (!activeRide) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="text-center py-16">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Active Ride</h2>
            <p className="text-muted-foreground mb-6">You don&apos;t have any active rides right now.</p>
            <Button onClick={() => navigate("/ride")}>Book a Ride</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = activeRide.status as RideStatus;
  const config = statusConfig[status] ?? statusConfig.searching;
  const StatusIcon = config.icon;
  const etaMinutes = Math.floor(etaSeconds / 60);
  const etaSecs = etaSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Status Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className={`${config.color} h-1`} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center`}>
                <StatusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{config.label}</h2>
                {status === "driver_arriving" && (
                  <p className="text-sm text-muted-foreground">
                    Arriving in {etaMinutes}:{etaSecs.toString().padStart(2, "0")}
                  </p>
                )}
                {status === "in_progress" && <p className="text-sm text-muted-foreground">On the way to your destination</p>}
                {status === "searching" && <p className="text-sm text-muted-foreground">Looking for nearby drivers...</p>}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              OTP: <span className="font-mono font-bold ml-1">{activeRide.otp}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Driver Info */}
        {activeRide.driverId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={activeRide.driverAvatar ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-lg">
                    {activeRide.driverName?.charAt(0).toUpperCase() ?? "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{activeRide.driverName ?? "Your Driver"}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>4.8</span>
                  </div>
                </div>
              </div>

              {activeRide.vehicleInfo && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {activeRide.vehicleInfo.color} {activeRide.vehicleInfo.make} {activeRide.vehicleInfo.model}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 ml-6">Plate: {activeRide.vehicleInfo.plate}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" className="flex-1" size="sm" onClick={() => setChatOpen(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="text-sm font-medium">{activeRide.pickup.address}</p>
                </div>
              </div>
              <div className="ml-4 w-0.5 h-6 bg-border" />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dropoff</p>
                  <p className="text-sm font-medium">{activeRide.dropoff.address}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated fare</span>
              <span className="font-semibold">${activeRide.fare?.toFixed(2) ?? "--"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distance</span>
              <span>{activeRide.distance?.toFixed(1) ?? "--"} miles</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>{activeRide.estimatedDuration ?? "--"} min</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" size="lg">
          <Shield className="w-4 h-4 mr-2" />
          Safety Toolkit
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          size="lg"
          onClick={() => setCancelDialogOpen(true)}
          disabled={status === "in_progress" || status === "picked_up"}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel Ride
        </Button>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Ride?</DialogTitle>
            <DialogDescription>
              You may be charged a cancellation fee depending on how close your driver is.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Ride
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Ride"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat with Driver</DialogTitle>
          </DialogHeader>
          <div className="h-64 overflow-y-auto space-y-3 p-2 bg-muted/30 rounded-lg">
            {messages?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start a conversation!</p>
            )}
            {messages?.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === activeRide.riderId ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.senderId === activeRide.riderId ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={chatMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} size="icon">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
