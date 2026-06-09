import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Clock,
  Star,
  Search,
  Car,
  Navigation,
  Receipt,
} from "lucide-react";

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
  searching: "bg-amber-500",
  driver_assigned: "bg-blue-500",
  driver_arriving: "bg-cyan-500",
  picked_up: "bg-emerald-600",
  in_progress: "bg-emerald-600",
  declined: "bg-slate-400",
};

export function RideHistoryPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: rides, isLoading } = trpc.ride.getHistory.useQuery();
  const utils = trpc.useUtils();

  const { data: selectedRide } = trpc.ride.getById.useQuery(
    { id: selectedRideId ?? 0 },
    { enabled: !!selectedRideId }
  );

  const reviewMutation = trpc.review.create.useMutation({
    onSuccess: () => {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setReviewDialogOpen(false);
      setComment("");
      setRating(5);
      utils.ride.getHistory.invalidate();
    },
  });

  const filteredRides = rides?.filter((ride) =>
    ride.pickup.address.toLowerCase().includes(search.toLowerCase()) ||
    ride.dropoff.address.toLowerCase().includes(search.toLowerCase()) ||
    ride.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    ride.riderName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmitReview = () => {
    if (!selectedRide) return;
    const revieweeId = selectedRide.driverId === selectedRide.riderId
      ? selectedRide.driverId
      : selectedRide.driverId ?? selectedRide.riderId;
    reviewMutation.mutate({
      rideId: selectedRide.id,
      revieweeId,
      rating,
      comment: comment || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ride History</h1>
          <p className="text-muted-foreground text-sm">View all your past rides</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search rides..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : filteredRides?.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rides Yet</h3>
            <p className="text-muted-foreground">Your ride history will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRides?.map((ride) => (
            <Card key={ride.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedRideId(ride.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${statusColors[ride.status] ?? "bg-slate-400"}`} />
                      <Badge variant="outline" className="text-xs capitalize">{ride.status.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                        <span className="truncate">{ride.pickup.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate">{ride.dropoff.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ride.estimatedDuration ?? "--"} min</span>
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{ride.distance?.toFixed(1) ?? "--"} mi</span>
                      <span className="capitalize">{ride.rideType}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-lg">${ride.finalFare?.toFixed(2) ?? ride.fare?.toFixed(2) ?? "--"}</p>
                    {ride.review && (
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs">{ride.review.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ride Detail Dialog */}
      <Dialog open={!!selectedRideId} onOpenChange={() => setSelectedRideId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" />Ride Receipt</DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">${selectedRide.finalFare?.toFixed(2) ?? selectedRide.fare?.toFixed(2) ?? "--"}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRide.createdAt ? new Date(selectedRide.createdAt).toLocaleString() : ""}
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm font-medium">{selectedRide.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dropoff</p>
                    <p className="text-sm font-medium">{selectedRide.dropoff.address}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Base fare</span><span>${(selectedRide.fare ? selectedRide.fare * 0.3 : 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Distance</span><span>${(selectedRide.fare ? selectedRide.fare * 0.5 : 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>${(selectedRide.fare ? selectedRide.fare * 0.2 : 0).toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span>${selectedRide.finalFare?.toFixed(2) ?? selectedRide.fare?.toFixed(2) ?? "--"}</span></div>
              </div>
              {selectedRide.status === "completed" && !selectedRide.review && (
                <Button className="w-full" onClick={() => setReviewDialogOpen(true)}>
                  <Star className="w-4 h-4 mr-2" />Rate This Ride
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rate Your Ride</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1">
                  <Star className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)"
              className="w-full min-h-[80px] p-3 rounded-md border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="w-full" onClick={handleSubmitReview} disabled={reviewMutation.isPending}>
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
