import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Car,
  Shield,
  Clock,
  MapPin,
  Star,
  CreditCard,
  MessageSquare,
  ChevronRight,
  Zap,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
              <Zap className="w-4 h-4 text-amber-400" />
              Now available in 50+ cities
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Your Ride,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Your Way
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-xl leading-relaxed">
              Book a ride in seconds. Track your driver in real-time. Pay seamlessly.
              Experience the future of urban transportation.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link to={user?.role === "driver" ? "/drive" : "/ride"}>
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 text-base">
                    {user?.role === "driver" ? "Go to Dashboard" : "Book a Ride"}
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 text-base">
                    Get Started
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              )}
              <Link to="/ride">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 text-base"
                >
                  Estimate Fare
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "10M+", label: "Rides Completed" },
              { value: "50+", label: "Cities Covered" },
              { value: "4.8", label: "Average Rating" },
              { value: "30s", label: "Avg. Pickup Time" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Curb Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Getting from A to B has never been easier. Three simple steps to your destination.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Set Your Destination",
                description: "Enter your pickup and drop-off locations. Get an instant fare estimate for all vehicle types.",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Match with a Driver",
                description: "Our intelligent algorithm finds the nearest available driver. Track their arrival in real-time.",
                icon: Car,
              },
              {
                step: "03",
                title: "Enjoy the Ride",
                description: "Sit back and relax. Pay seamlessly through the app and rate your experience.",
                icon: Star,
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-card rounded-2xl p-8 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="text-5xl font-bold text-primary/10 mb-4">{item.step}</div>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Curb</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Designed for the modern commuter. Every feature crafted for your comfort and safety.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Real-Time Tracking",
                description: "Watch your driver approach on the map. Know exactly when they'll arrive.",
              },
              {
                icon: Shield,
                title: "Safety First",
                description: "Verified drivers, SOS button, share trip details with trusted contacts.",
              },
              {
                icon: CreditCard,
                title: "Seamless Payments",
                description: "Pay with card, cash, or wallet. Automatic receipts for every trip.",
              },
              {
                icon: MessageSquare,
                title: "In-App Chat",
                description: "Communicate with your driver without sharing your phone number.",
              },
              {
                icon: Award,
                title: "Loyalty Rewards",
                description: "Earn points on every ride. Unlock exclusive discounts and perks.",
              },
              {
                icon: TrendingUp,
                title: "Fare Estimates",
                description: "Know the price upfront. No surge surprises, ever.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300"
              >
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ride Options for Every Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From everyday commutes to special occasions, choose the perfect ride.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "CurbX", desc: "Everyday rides at great prices", price: "$8-12", icon: Car, color: "bg-emerald-500" },
              { name: "CurbComfort", desc: "Newer cars with extra legroom", price: "$12-18", icon: Car, color: "bg-blue-500" },
              { name: "CurbBlack", desc: "Luxury vehicles with top drivers", price: "$20-30", icon: Car, color: "bg-slate-800" },
              { name: "CurbXL", desc: "Spacious rides for groups up to 6", price: "$18-25", icon: Users, color: "bg-amber-500" },
            ].map((v) => (
              <div key={v.name} className="bg-card rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className={`${v.color} h-2`} />
                <div className="p-6">
                  <div className={`w-10 h-10 ${v.color}/10 rounded-lg flex items-center justify-center mb-4`}>
                    <v.icon className={`w-5 h-5 ${v.color.replace("bg-", "text-")}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{v.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{v.desc}</p>
                  <div className="text-sm font-medium text-primary">{v.price} <span className="text-muted-foreground font-normal">/ avg trip</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8 md:p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Drive with Curb
                </h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  Earn on your own schedule. Be your own boss and make money driving with the most rider-friendly platform.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { value: "$1,200", label: "Avg. weekly earnings" },
                    { value: "Flexible", label: "Work on your time" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/10 rounded-xl p-4">
                      <div className="text-xl font-bold text-cyan-400">{s.value}</div>
                      <div className="text-sm text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                {!isAuthenticated && (
                  <Link to="/login">
                    <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                      Sign Up to Drive
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="hidden md:block h-full">
                <img
                  src="/driver-hero.jpg"
                  alt="Drive with Curb"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-white">Curb</span>
              </div>
              <p className="text-sm leading-relaxed">
                The most reliable way to get around town. Safe, affordable, and always on time.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Riders</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/ride" className="hover:text-white transition-colors">Book a Ride</Link></li>
                <li><Link to="/ride/history" className="hover:text-white transition-colors">Ride History</Link></li>
                <li><Link to="/profile" className="hover:text-white transition-colors">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Drivers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/drive" className="hover:text-white transition-colors">Driver Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign Up to Drive</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-pointer">About Us</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Careers</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Support</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">2026 Curb, Inc. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-white transition-colors cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
