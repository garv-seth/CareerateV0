import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Star, 
  ExternalLink, 
  BookmarkPlus,
  TrendingUp,
  Zap,
  Code,
  Palette,
  Database,
  MessageSquare,
  Brain,
  Globe
} from "lucide-react";
import type { AiTool } from "@shared/schema";

export default function Tools() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: tools, isLoading } = useQuery({
    queryKey: ["/api/tools", selectedCategory !== "all" ? { category: selectedCategory } : {}],
  });

  const { data: recommendations } = useQuery({
    queryKey: ["/api/tools/recommendations", { limit: 6 }],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      setIsSearching(true);
      const response = await apiRequest("GET", `/api/search/tools?query=${encodeURIComponent(query)}`);
      return response.json();
    },
    onSuccess: (results) => {
      setSearchResults(results);
      setIsSearching(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Search Error",
        description: error.message || "Failed to search AI tools",
        variant: "destructive",
      });
      setIsSearching(false);
    },
  });

  const trackProgressMutation = useMutation({
    mutationFn: async (toolData: { toolId?: number; skillName: string }) => {
      const response = await apiRequest("POST", "/api/progress", {
        toolId: toolData.toolId,
        skillName: toolData.skillName,
        progressType: "tool_completion",
        status: "started",
        progressPercentage: 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      toast({
        title: "Started Learning",
        description: "Tool added to your learning progress!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to track progress",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchMutation.mutate(query);
    } else {
      setSearchResults([]);
    }
  };

  const handleStartLearning = (tool: AiTool | any) => {
    trackProgressMutation.mutate({
      toolId: tool.id,
      skillName: tool.name || tool.title,
    });
  };

  const categories = [
    { id: "all", name: "All Tools", icon: Globe },
    { id: "development", name: "Development", icon: Code },
    { id: "design", name: "Design", icon: Palette },
    { id: "data", name: "Data & Analytics", icon: Database },
    { id: "communication", name: "Communication", icon: MessageSquare },
    { id: "productivity", name: "Productivity", icon: Zap },
    { id: "ai-ml", name: "AI & ML", icon: Brain },
  ];

  const getCategoryIcon = (category: string) => {
    const categoryItem = categories.find(c => c.id === category);
    return categoryItem ? categoryItem.icon : Brain;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const ToolCard = ({ tool, isRecommendation = false }: { tool: AiTool | any; isRecommendation?: boolean }) => {
    const CategoryIcon = getCategoryIcon(tool.category);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CategoryIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg leading-tight">
                    {tool.name || tool.title}
                  </CardTitle>
                  {tool.category && (
                    <Badge variant="outline" className="mt-1">
                      {tool.category}
                    </Badge>
                  )}
                </div>
              </div>
              {tool.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{tool.rating}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tool.description}
            </p>

            {/* Tool Details */}
            <div className="space-y-2">
              {tool.difficulty && (
                <Badge className={getDifficultyColor(tool.difficulty)}>
                  {tool.difficulty}
                </Badge>
              )}
              
              {tool.pricing && (
                <Badge variant="secondary">
                  {tool.pricing}
                </Badge>
              )}

              {tool.tags && tool.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tool.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {tool.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{tool.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Use Cases */}
            {tool.useCases && tool.useCases.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1">Use Cases:</h5>
                <p className="text-xs text-muted-foreground">
                  {tool.useCases.slice(0, 2).join(", ")}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleStartLearning(tool)}
                disabled={trackProgressMutation.isPending}
              >
                <BookmarkPlus className="w-4 h-4 mr-1" />
                {trackProgressMutation.isPending ? "Adding..." : "Start Learning"}
              </Button>
              
              {tool.url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(tool.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>

            {isRecommendation && tool.matchScore && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Match Score</span>
                  <Badge variant="secondary">{tool.matchScore}%</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <FloatingNavbar />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-2">
              AI Tools Discovery
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore and learn cutting-edge AI tools to enhance your workflow
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search AI tools, categories, or use cases..."
                className="pl-10 pr-4 py-3 text-lg"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{result.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {result.description}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStartLearning({ name: result.title, ...result })}
                          >
                            Add to Learning
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(result.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Content */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-7">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-8">
                <div className="space-y-8">
                  {/* Recommended Tools */}
                  {category.id === "all" && recommendations && recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h2 className="text-2xl font-bold">Recommended for You</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.map((tool: AiTool) => (
                          <ToolCard key={tool.id} tool={tool} isRecommendation />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* All Tools */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">
                        {category.id === "all" ? "All AI Tools" : `${category.name} Tools`}
                      </h2>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm">
                          {isLoading ? "Loading..." : `${tools?.length || 0} tools`}
                        </span>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                              <div className="h-16 bg-muted rounded"></div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : tools && tools.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tools.map((tool: AiTool) => (
                          <ToolCard key={tool.id} tool={tool} />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Tools Found</h3>
                          <p className="text-muted-foreground mb-6">
                            {category.id === "all" 
                              ? "No AI tools are currently available. Try searching for specific tools."
                              : `No tools found in the ${category.name} category.`
                            }
                          </p>
                          <Button variant="outline">
                            Browse All Categories
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
