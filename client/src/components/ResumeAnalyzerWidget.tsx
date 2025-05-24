import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Zap, Award, BarChart } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ResumeAnalysis {
  overallScore: number;
  aiReadiness: number;
  strengths: string[];
  improvements: string[];
  skills: {
    technical: string[];
    missing: string[];
    emerging: string[];
  };
  riskFactors: string[];
  recommendations: string[];
}

interface AnalysisResult {
  analysis: ResumeAnalysis;
  generatedAt: string;
  fileName: string;
}

export default function ResumeAnalyzerWidget() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setError(null);
      setUploading(true);
      setAnalysisResult(null);

      const formData = new FormData();
      formData.append('resume', file);

      try {
        const response = await fetch('/api/resume/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to analyze resume');
        }

        const data = await response.json();
        setAnalysisResult({ ...data, fileName: file.name });
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred during analysis.');
        console.error('Resume analysis error:', err);
      } finally {
        setUploading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const ScoreCircle: React.FC<{ score: number; label: string; colorClass: string }> = ({ score, label, colorClass }) => (
    <div className="flex flex-col items-center">
      <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 ${colorClass.replace('text-','border-')}`}>
        <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
        <span className="absolute bottom-1 text-xs text-gray-500">/100</span>
      </div>
      <p className="text-sm font-medium text-gray-700 mt-2">{label}</p>
    </div>
  );

  const Section: React.FC<{ title: string; icon: React.ReactNode; items: string[]; itemClass?: string; listType?: 'ul' | 'ol' }> = ({ title, icon, items, itemClass = 'bg-gray-100 text-gray-700', listType = 'ul' }) => (
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">{icon}{title}</h4>
      {items.length > 0 ? (
        React.createElement(listType, { className: 'space-y-1.5' }, 
          items.map((item, index) => (
            <li key={index} className={`text-xs px-3 py-1.5 rounded-md flex items-start ${itemClass}`}>
              {listType === 'ul' && <CheckCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0 text-green-500" />}
              <span>{item}</span>
            </li>
          ))
        )
      ) : (
        <p className="text-xs text-gray-500">No items to display.</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
      <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-purple-600" />
        AI Resume Analyzer
      </h3>
      <p className="text-sm text-gray-600 mb-6">Upload your resume to get AI-powered feedback and suggestions.</p>

      <div 
        {...getRootProps()} 
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        <UploadCloud className={`w-12 h-12 mx-auto mb-3 ${isDragActive ? 'text-purple-600' : 'text-gray-400'}`} />
        {uploading ? (
          <p className="text-purple-600 font-semibold">Analyzing your resume...</p>
        ) : isDragActive ? (
          <p className="text-purple-600 font-semibold">Drop your resume here!</p>
        ) : (
          <>
            <p className="font-semibold text-gray-700">Drag & drop your resume, or click to select</p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT (Max 5MB)</p>
          </>
        )}
      </div>

      {uploadedFile && !uploading && (
        <div className="mt-4 text-sm text-gray-600">
          Selected file: <span className="font-medium">{uploadedFile.name}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {analysisResult && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="mb-6 flex flex-col sm:flex-row justify-around items-center gap-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <ScoreCircle score={analysisResult.analysis.overallScore} label="Overall Score" colorClass="text-purple-600"/>
            <ScoreCircle score={analysisResult.analysis.aiReadiness} label="AI Readiness" colorClass="text-indigo-600"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Strengths" icon={<CheckCircle className="w-4 h-4 mr-2 text-green-600" />} items={analysisResult.analysis.strengths} itemClass="bg-green-50 text-green-700" />
            <Section title="Areas for Improvement" icon={<AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />} items={analysisResult.analysis.improvements} itemClass="bg-yellow-50 text-yellow-700" />
            
            <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center"><Zap className="w-4 h-4 mr-2 text-blue-600"/>Skills Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-blue-700 mb-1.5">Detected Skills:</h5>
                  {analysisResult.analysis.skills.technical.map(s => <span key={s} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{s}</span>)}
                </div>
                <div>
                  <h5 className="text-sm font-medium text-orange-700 mb-1.5">Missing Keywords:</h5>
                  {analysisResult.analysis.skills.missing.map(s => <span key={s} className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{s}</span>)}
                </div>
                <div>
                  <h5 className="text-sm font-medium text-teal-700 mb-1.5">Emerging Skills to Add:</h5>
                  {analysisResult.analysis.skills.emerging.map(s => <span key={s} className="inline-block bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{s}</span>)}
                </div>
              </div>
            </div>

            <Section title="Potential AI Risk Factors" icon={<BarChart className="w-4 h-4 mr-2 text-red-600" />} items={analysisResult.analysis.riskFactors} itemClass="bg-red-50 text-red-700" />
            <Section title="Actionable Recommendations" icon={<Award className="w-4 h-4 mr-2 text-indigo-600" />} items={analysisResult.analysis.recommendations} itemClass="bg-indigo-50 text-indigo-700" listType="ol" />
          </div>
          <p className="text-xs text-gray-500 mt-6 text-center">Analysis for {analysisResult.fileName}, generated on {new Date(analysisResult.generatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
} 