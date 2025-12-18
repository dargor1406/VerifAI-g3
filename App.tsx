import React, { useState, useCallback, useEffect } from 'react';
import { InfoPanel } from './components/InfoPanel';
import { InputForm } from './components/InputForm';
import { VerificationResult } from './components/VerificationResult';
import { analyzeWork } from './services/analyzeWork';
import type { NotaryReport, Artifact } from './types';
import * as pdfjsLib from 'pdfjs-dist';
import { Footer } from './components/Footer';

// Set workerSrc for pdf.js
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.4.168/build/pdf.worker.mjs`;

const Logo = () => (
    <div className="flex flex-col items-center justify-center mb-8 animate-fade-in-up">
        <div className="relative">
             <h1 className="text-7xl md:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-white to-brand-secondary tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                VerifAI
            </h1>
            <div className="absolute -top-4 -right-4 w-8 h-8 border-t border-r border-brand-primary opacity-50 transition-colors duration-500"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b border-l border-brand-primary opacity-50 transition-colors duration-500"></div>
        </div>
        <p className="text-brand-secondary mt-4 text-lg tracking-wide font-light">
            Proof of Human Agency <span className="text-brand-primary transition-colors duration-500">●</span> G3 Protocol
        </p>
    </div>
);

type ArtifactType = 'text' | 'image' | 'pdf' | 'audio';

const THEME_COLORS: Record<ArtifactType, { primary: string, accent: string }> = {
  text: { primary: '#3B82F6', accent: '#6366F1' },      // Blue / Indigo
  image: { primary: '#8B5CF6', accent: '#EC4899' },     // Violet / Pink
  pdf: { primary: '#F59E0B', accent: '#D97706' },       // Amber / Orange
  audio: { primary: '#10B981', accent: '#059669' },     // Emerald / Green
};

export default function App(): React.ReactElement {
  const [chatHistory, setChatHistory] = useState<string>('');
  const [artifactFile, setArtifactFile] = useState<File | null>(null);
  const [artifactType, setArtifactType] = useState<ArtifactType>('text');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NotaryReport | null>(null);

  // Apply theme colors dynamically
  useEffect(() => {
    const theme = THEME_COLORS[artifactType];
    document.documentElement.style.setProperty('--brand-primary', theme.primary);
    document.documentElement.style.setProperty('--brand-accent', theme.accent);
  }, [artifactType]);

  const handleFileChange = (file: File | null) => {
    setArtifactFile(file);
  };
  
  const handleArtifactTypeChange = (type: ArtifactType) => {
    setArtifactType(type);
    setArtifactFile(null); // Clear file when type changes
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const fileToText = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsText(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
      });
  };

  const pdfToText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(s => (s as any).str).join(' ');
    }
    return textContent;
  };

  const handleSubmit = useCallback(async () => {
    if (!artifactFile) {
      setError('Please upload a final artifact file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
        let llmArtifact: Artifact;
        let notaryArtifact: Artifact;
        
        if (artifactType === 'pdf') {
             const [base64Content, textContent] = await Promise.all([
                fileToBase64(artifactFile),
                pdfToText(artifactFile)
            ]);
            notaryArtifact = { mimeType: artifactFile.type, data: base64Content, encoding: 'base64' };
            llmArtifact = { mimeType: 'text/plain', data: textContent, encoding: 'text' };
        } else if (artifactType === 'text') {
            const textContent = await fileToText(artifactFile);
            llmArtifact = notaryArtifact = { mimeType: artifactFile.type || 'text/plain', data: textContent, encoding: 'text' };
        } else { // image OR audio
            const base64Content = await fileToBase64(artifactFile);
            llmArtifact = notaryArtifact = { mimeType: artifactFile.type, data: base64Content, encoding: 'base64' };
        }
        
        const analysisResult = await analyzeWork(notaryArtifact, llmArtifact, chatHistory);
        setResult(analysisResult);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  }, [artifactFile, chatHistory, artifactType]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setChatHistory('');
    setArtifactFile(null);
    setArtifactType('text');
  };

  return (
    <div className="min-h-screen font-sans relative overflow-hidden pb-20 transition-colors duration-700">
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary rounded-full opacity-[0.05] blur-[100px] transition-all duration-1000"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-accent rounded-full opacity-[0.05] blur-[100px] transition-all duration-1000"></div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 pt-12 md:pt-20">
        
        {isLoading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="loader mb-8 transition-colors duration-500"></div>
            <p className="text-2xl font-light text-white tracking-widest animate-pulse">ANALYZING AGENTIC VECTORS</p>
            <p className="text-brand-primary font-mono text-sm mt-4 transition-colors duration-500">Deploying Gemini 3 Pro Forensic Probes...</p>
          </div>
        )}

        {!result && (
            <header className="text-center mb-16">
                <Logo />
            </header>
        )}

        {result ? (
          <VerificationResult result={result} onReset={handleReset} />
        ) : (
          <main className="flex flex-col gap-16">
            
            <div className="w-full max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                 <InputForm
                    chatHistory={chatHistory}
                    onChatHistoryChange={setChatHistory}
                    artifactFile={artifactFile}
                    onFileChange={handleFileChange}
                    artifactType={artifactType}
                    onArtifactTypeChange={handleArtifactTypeChange}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    error={error}
                />
            </div>

            <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <InfoPanel />
            </div>
          </main>
        )}
        
        <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity duration-500">
             <Footer />
        </div>
       
      </div>
    </div>
  );
}