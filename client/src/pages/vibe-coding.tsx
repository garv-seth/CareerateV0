import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AICodeEditor from "@/components/AICodeEditor";

export default function VibeCoding() {
  const [, params] = useRoute("/projects/:id/coding");
  const projectId = params?.id || '1';

  return (
    <div className="h-screen bg-background">
      {/* Header */}
      <div className="h-14 bg-background border-b border-border flex items-center px-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="ml-4">
          <h1 className="text-lg font-semibold">Vibe Coding - AI Development Environment</h1>
          <p className="text-sm text-muted-foreground">Project ID: {projectId}</p>
        </div>
      </div>

      {/* AI Code Editor */}
      <div className="h-[calc(100vh-3.5rem)]">
        <AICodeEditor projectId={projectId} />
      </div>
    </div>
  );
}