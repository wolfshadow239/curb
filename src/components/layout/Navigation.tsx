import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import {
  Car,
  Home,
  History,
  User,
  LogOut,
  Menu,
  Shield,
  CircleDollarSign,
  ChevronDown,
  MapPin,
} from "lucide-react";

export function Navigation() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { label: "Home", path: "/", icon: Home },
      ];
    }

    const items = [{ label: "Home", path: "/", icon: Home }];

    if (user?.role === "user" || user?.role === "admin") {
      items.push({ label: "Ride", path: "/ride", icon: Car });
    }

    if (user?.role === "driver" || user?.role === "admin") {
      items.push({ label: "Drive", path: "/drive", icon: CircleDollarSign });
    }

    if (user?.role === "admin") {
      items.push({ label: "Admin", path: "/admin", icon: Shield });
    }

    items.push({ label: "History", path: "/ride/history", icon: History });

    return items;
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    switch (user?.role) {
      case "admin":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Admin</Badge>;
      case "driver":
        return <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-blue-600">Driver</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Rider</Badge>;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Curb</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/ride"
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Book Ride
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 pl-1 pr-2 h-9">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {user.name?.charAt(0).toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium max-w-[100px] truncate">
                        {user.name ?? "User"}
                      </span>
                      {getRoleBadge()}
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name ?? "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/ride/history")}>
                      <History className="w-4 h-4 mr-2" />
                      Ride History
                    </DropdownMenuItem>
                    {(user.role === "user" || user.role === "admin") && (
                      <DropdownMenuItem onClick={() => navigate("/ride")}>
                        <Car className="w-4 h-4 mr-2" />
                        Book a Ride
                      </DropdownMenuItem>
                    )}
                    {(user.role === "driver" || user.role === "admin") && (
                      <DropdownMenuItem onClick={() => navigate("/drive")}>
                        <CircleDollarSign className="w-4 h-4 mr-2" />
                        Driver Dashboard
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/login">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">Curb</span>
                </SheetTitle>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}

                  {isAuthenticated && user && (
                    <>
                      <div className="border-t my-2" />
                      <Link
                        to="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <User className="w-5 h-5" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        Log Out
                      </button>
                    </>
                  )}

                  {!isAuthenticated && (
                    <>
                      <div className="border-t my-2" />
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
                      >
                        <User className="w-5 h-5" />
                        Get Started
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
