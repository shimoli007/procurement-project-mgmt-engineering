import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-7xl font-bold text-muted-foreground/30">404</h1>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        Page Not Found
      </h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        The page you are looking for does not exist or has been moved. Please
        check the URL or navigate back to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
