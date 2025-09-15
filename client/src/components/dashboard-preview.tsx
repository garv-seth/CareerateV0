import { useQuery } from "@tanstack/react-query";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DashboardPreview() {
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed": return "bg-accent";
      case "building": return "bg-yellow-500";
      case "error": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case "react": return "⚛️";
      case "vue": return "💚";
      case "angular": return "🅰️";
      case "react-native": return "📱";
      default: return "⚡";
    }
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="dashboard-preview-title">
            Enterprise-Grade Dashboard
          </h2>
          <p className="text-xl text-muted-foreground" data-testid="dashboard-preview-description">
            Manage multiple projects with enterprise controls and real-time insights.
          </p>
        </div>

        <div className="glass rounded-2xl p-8" data-testid="dashboard-preview-container">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
            <div>
              <h3 className="text-2xl font-semibold" data-testid="dashboard-user-title">
                Demo User's Projects
              </h3>
              <p className="text-muted-foreground" data-testid="dashboard-project-count">
                {projects.length} active projects
              </p>
            </div>
            <Link href="/dashboard">
              <Button 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-gray-800 transition-colors"
                data-testid="button-new-project"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Project Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project: any, index: number) => (
              <div 
                key={project.id} 
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                data-testid={`project-card-${index}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-lg">
                    {getFrameworkIcon(project.framework)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 ${getStatusColor(project.status)} rounded-full`}></div>
                    <span className="text-xs text-muted-foreground capitalize" data-testid={`project-status-${index}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold mb-2" data-testid={`project-name-${index}`}>
                  {project.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-4" data-testid={`project-description-${index}`}>
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <Eye className="inline mr-1 h-3 w-3" />
                    {Math.floor(Math.random() * 2000)} views
                  </div>
                  <Link href={`/editor/${project.id}`}>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 py-1 rounded-full"
                      data-testid={`button-view-project-${index}`}
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
