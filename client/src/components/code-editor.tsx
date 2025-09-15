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
            <div className="max-w-md mx-auto">
              <div className="flex space-x-2">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to build..."
                  className="flex-1"
                  data-testid="input-code-prompt"
                />
                <Button 
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  data-testid="button-generate-code"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </Button>
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
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex space-x-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to modify or add to your code..."
              className="flex-1"
              data-testid="input-code-improvement"
            />
            <Button 
              onClick={handleGenerateCode}
              disabled={isGenerating}
              size="sm"
              data-testid="button-improve-code"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Wand2 className="h-4 w-4" />
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
