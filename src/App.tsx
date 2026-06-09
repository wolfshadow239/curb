import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { RideBookingPage } from "./pages/RideBookingPage";
import { DriverDashboardPage } from "./pages/DriverDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { RideHistoryPage } from "./pages/RideHistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ActiveRidePage } from "./pages/ActiveRidePage";

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  if (!user.isOnboardingComplete && user.role !== "admin") return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/ride"
          element={
            <RoleGuard allowedRoles={["user", "admin"]}>
              <RideBookingPage />
            </RoleGuard>
          }
        />
        <Route
          path="/ride/active"
          element={
            <RoleGuard allowedRoles={["user", "admin"]}>
              <ActiveRidePage />
            </RoleGuard>
          }
        />
        <Route
          path="/ride/history"
          element={
            <RoleGuard allowedRoles={["user", "driver", "admin"]}>
              <RideHistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/drive"
          element={
            <RoleGuard allowedRoles={["driver", "admin"]}>
              <DriverDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <RoleGuard allowedRoles={["user", "driver", "admin"]}>
              <ProfilePage />
            </RoleGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
