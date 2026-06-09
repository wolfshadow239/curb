import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Car, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Car className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-xl text-slate-300 mb-2">Looks like you took a wrong turn</p>
        <p className="text-slate-400 mb-8">The page you are looking for does not exist.</p>
        <Button asChild size="lg">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
