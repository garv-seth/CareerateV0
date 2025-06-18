import { GlassNavbar } from "@/components/glass-navbar";
import { ChatPanel } from "@/components/chat-panel";
import { ActivityViewer } from "@/components/activity-viewer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-neutral-dark">
      <div 
        className="fixed inset-0 w-full h-full bg-grid-neutral-main/[0.2] [mask-image:linear-gradient(to_bottom,white,transparent)]"
      ></div>
      <div className="fixed inset-0 w-full h-full bg-gradient-mesh"></div>

      <GlassNavbar />
      <div className="flex w-full h-screen pt-16">
        <ChatPanel />
        <ActivityViewer />
      </div>
    </main>
  );
} 