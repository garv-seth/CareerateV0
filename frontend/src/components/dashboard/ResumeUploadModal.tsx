import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import { useUserStore } from "@/state/userStore";

interface ResumeUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ open, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const accessToken = useUserStore((s) => s.auth.accessToken);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const resp = await axios.post("/api/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      setResult(resp.data.analysisResults);
      setProgress(100);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    setResult(null);
    onClose();
  };

  // Helper to render analysis results nicely
  const renderResults = (result: any) => {
    if (!result) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          Resume analyzed successfully!
        </div>
        {result.overallScore && (
          <div className="flex items-center gap-2">
            <span className="font-semibold">Score:</span>
            <Badge variant="secondary">{result.overallScore}</Badge>
          </div>
        )}
        {result.strengths && result.strengths.length > 0 && (
          <div>
            <div className="font-semibold mb-1">Strengths:</div>
            <ul className="list-disc ml-5 text-xs">
              {result.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {result.improvements && result.improvements.length > 0 && (
          <div>
            <div className="font-semibold mb-1">Improvements:</div>
            <ul className="list-disc ml-5 text-xs">
              {result.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {result.skills && (
          <div>
            <div className="font-semibold mb-1">Skills:</div>
            <ul className="list-disc ml-5 text-xs">
              {Object.entries(result.skills).map(([cat, arr]) => (
                <li key={cat} className="capitalize">
                  {cat}: {(arr as any[]).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.suggestions && result.suggestions.length > 0 && (
          <div>
            <div className="font-semibold mb-1">Suggestions:</div>
            <ul className="list-disc ml-5 text-xs">
              {result.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {/* Fallback: show raw JSON if nothing else */}
        {!result.overallScore && !result.strengths && !result.improvements && !result.skills && !result.suggestions && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="font-semibold mb-1">AI Insights:</div>
            <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Your Resume</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label htmlFor="resume-upload-input" className="sr-only">Resume File</label>
          <input
            id="resume-upload-input"
            type="file"
            accept=".pdf,.doc,.docx"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4" />
            {file ? file.name : "Choose Resume File"}
          </Button>
          {file && !result && (
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload & Analyze"
              )}
            </Button>
          )}
          {uploading && (
            <div className="w-full">
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground mt-2">Uploading... {progress}%</div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {result && renderResults(result)}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={uploading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeUploadModal; 