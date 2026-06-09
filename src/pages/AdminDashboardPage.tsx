import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  Car,
  DollarSign,
  Star,
  TrendingUp,
  Activity,
  Shield,
  Search,
  BarChart3,
  MapPin,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

export function AdminDashboardPage() {
  const [userSearch, setUserSearch] = useState("");
  const [rideFilter, setRideFilter] = useState<string | undefined>(undefined);

  const { data: stats, isLoading: statsLoading } = trpc.admin.getDashboardStats.useQuery();
  const { data: users } = trpc.admin.getUsers.useQuery({ search: userSearch || undefined });
  const { data: rides } = trpc.admin.getRides.useQuery({ status: rideFilter as any });

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+12%", trendUp: true },
    { title: "Total Drivers", value: stats?.totalDrivers ?? 0, icon: Car, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+8%", trendUp: true },
    { title: "Active Drivers", value: stats?.activeDrivers ?? 0, icon: Activity, color: "text-amber-600", bg: "bg-amber-50", trend: "+15%", trendUp: true },
    { title: "Today's Revenue", value: `$${(stats?.revenueToday ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50", trend: "+23%", trendUp: true },
    { title: "Rides Today", value: stats?.ridesToday ?? 0, icon: BarChart3, color: "text-cyan-600", bg: "bg-cyan-50", trend: "+18%", trendUp: true },
    { title: "Avg. Rating", value: (stats?.averageRating ?? 0).toFixed(1), icon: Star, color: "text-rose-600", bg: "bg-rose-50", trend: "+0.2", trendUp: true },
  ];

  const rideStatusColors: Record<string, string> = {
    searching: "bg-amber-500",
    driver_assigned: "bg-blue-500",
    driver_arriving: "bg-cyan-500",
    picked_up: "bg-emerald-500",
    in_progress: "bg-emerald-600",
    completed: "bg-slate-500",
    cancelled: "bg-red-500",
    declined: "bg-slate-400",
  };

  if (statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of platform performance</p>
          </div>
        </div>
        <Badge variant="destructive" className="text-xs">Admin Access</Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trendUp ? "text-emerald-600" : "text-red-600"}`}>
                  <ArrowUpRight className="w-3 h-3" />
                  {card.trend}
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rides">Rides</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top Drivers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Top Drivers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.topDrivers.map((driver) => (
                  <div key={driver.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-primary/10 text-xs">{driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{driver.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {driver.rating}
                        </span>
                        <span>{driver.totalRides} rides</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${driver.earnings.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">earned</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Rides */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Rides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.recentRides.map((ride) => (
                  <div key={ride.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className={`w-2 h-2 rounded-full ${rideStatusColors[ride.status] ?? "bg-slate-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {ride.riderName} {ride.driverName !== "Unassigned" ? `→ ${ride.driverName}` : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ride.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">${ride.fare.toFixed(2)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-xl">
                  <p className="text-3xl font-bold text-primary">${stats?.revenueToday.toFixed(2) ?? "0.00"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Today</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-xl">
                  <p className="text-3xl font-bold text-primary">${(stats?.revenueThisMonth ?? 0 / 30).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Daily Avg (Month)</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-xl">
                  <p className="text-3xl font-bold text-primary">${stats?.revenueThisMonth.toFixed(2) ?? "0.00"}</p>
                  <p className="text-xs text-muted-foreground mt-1">This Month</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-xl">
                  <p className="text-3xl font-bold text-primary">{stats?.completionRate.toFixed(1) ?? "0.0"}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">All Users</CardTitle>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-primary/10 text-xs">{user.name?.charAt(0) ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name ?? "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge
                      variant={user.role === "admin" ? "destructive" : user.role === "driver" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.role}
                    </Badge>
                    <div className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rides Tab */}
        <TabsContent value="rides">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">All Rides</CardTitle>
              <div className="flex gap-2">
                {["all", "searching", "completed", "cancelled"].map((filter) => (
                  <Button
                    key={filter}
                    variant={rideFilter === filter || (filter === "all" && !rideFilter) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRideFilter(filter === "all" ? undefined : filter)}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rides?.map((ride) => (
                  <div key={ride.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className={`w-2 h-2 rounded-full ${rideStatusColors[ride.status] ?? "bg-slate-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{ride.id}</span>
                        <span className="text-sm text-muted-foreground">{ride.riderName} → {ride.driverName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ride.pickupAddress.substring(0, 30)}...
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">${ride.fare.toFixed(2)}</p>
                      <Badge variant="outline" className="text-[10px]">{ride.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
