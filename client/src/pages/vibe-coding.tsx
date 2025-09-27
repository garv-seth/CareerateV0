import { Link, useRoute } from "wouter";
import { AppShell } from "@/components/AppShell";
import CaraWorkshop from "@/components/CaraWorkshop";

export default function VibeCoding() {
  const [, params] = useRoute("/projects/:id/coding");
  const projectId = params?.id || '1';

  return (
    <AppShell>
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-1/4 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute top-60 right-1/3 w-80 h-80 bg-amber-500/2 rounded-full blur-3xl animate-pulse-subtle" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/3 w-72 h-72 bg-orange-600/2 rounded-full blur-3xl animate-pulse-subtle" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative min-h-screen">
        <CaraWorkshop projectId={projectId} />
      </div>
    </AppShell>
  );
}