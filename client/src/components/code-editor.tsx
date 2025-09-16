import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Play, Save, Copy, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeEditorProps {
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  onGenerateCode?: (prompt: string) => void;
  isGenerating?: boolean;
}

export default function CodeEditor({ files, onFilesChange, onGenerateCode, isGenerating = false }: CodeEditorProps) {
  const [activeFile, setActiveFile] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const fileEntries = Object.entries(files);

  useEffect(() => {
    if (fileEntries.length > 0 && !activeFile) {
      setActiveFile(fileEntries[0][0]);
    }
  }, [files, activeFile]);

  const handleFileContentChange = (filename: string, content: string) => {
    onFilesChange({
      ...files,
      [filename]: content
    });
  };

  const handleCopyCode = () => {
    if (activeFile && files[activeFile]) {
      navigator.clipboard.writeText(files[activeFile]);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    }
  };

  const handleGenerateCode = () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for code generation",
        variant: "destructive",
      });
      return;
    }

    onGenerateCode?.(prompt);
    setPrompt("");
  };

  const getLanguageFromFilename = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx': 
      case 'jsx': return 'javascript';
      case 'ts': 
      case 'js': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  if (fileEntries.length === 0) {
    return (
      <div className="h-full bg-card border border-border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No files yet</h3>
          <p className="text-muted-foreground mb-4">Generate some code to get started</p>
          
          {onGenerateCode && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-2">
                    <Wand2 className="h-5 w-5" />
                    <span className="font-semibold">AI Code Generation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Describe your app in natural language and watch AI build it</p>
                </div>
                <div className="flex space-x-3">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A todo app with user authentication and real-time sync..."
                    className="flex-1 h-12 text-base border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-500 bg-white/70 dark:bg-gray-900/70"
                    data-testid="input-code-prompt"
                  />
                  <Button 
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                    data-testid="button-generate-code"
                  >
                    {isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Building...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Wand2 className="h-4 w-4" />
                        <span>Generate</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" data-testid="file-count-badge">
            {fileEntries.length} files
          </Badge>
          {activeFile && (
            <Badge variant="secondary" data-testid="active-file-badge">
              {getLanguageFromFilename(activeFile)}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopyCode} data-testid="button-copy-code">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="button-save-code">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="button-run-code">
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Prompt Section */}
      {onGenerateCode && (
        <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Wand2 className="h-4 w-4" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to modify, add features, or refactor your code..."
              className="flex-1 h-10 border-emerald-200 dark:border-emerald-700 focus:border-emerald-400 dark:focus:border-emerald-500 bg-white/80 dark:bg-gray-900/80"
              data-testid="input-code-improvement"
            />
            <Button 
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              data-testid="button-improve-code"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-3 w-3" />
                  <span className="text-sm">Enhance</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* File Tabs and Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeFile} onValueChange={setActiveFile} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
            {fileEntries.map(([filename]) => (
              <TabsTrigger 
                key={filename} 
                value={filename}
                className="rounded-none border-r data-[state=active]:bg-background"
                data-testid={`tab-${filename}`}
              >
                {filename}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {fileEntries.map(([filename, content]) => (
            <TabsContent key={filename} value={filename} className="flex-1 m-0">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleFileContentChange(filename, e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-background border-0 resize-none outline-none"
                placeholder={`Enter ${getLanguageFromFilename(filename)} code here...`}
                data-testid={`editor-${filename}`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
