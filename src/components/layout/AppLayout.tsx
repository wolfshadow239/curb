import { Outlet } from "react-router";
import { Navigation } from "./Navigation";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
