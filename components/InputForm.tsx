
import React, { useState, useCallback } from 'react';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { MusicalNoteIcon } from './icons/MusicalNoteIcon';

interface InputFormProps {
  chatHistory: string;
  onChatHistoryChange: (value: string) => void;
  artifactFile: File | null;
  onFileChange: (file: File | null) => void;
  artifactType: 'text' | 'image' | 'pdf' | 'audio';
  onArtifactTypeChange: (type: 'text' | 'image' | 'pdf' | 'audio') => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

const ArtifactTypeSelector: React.FC<{
  artifactType: 'text' | 'image' | 'pdf' | 'audio';
  onArtifactTypeChange: (type: 'text' | 'image' | 'pdf' | 'audio') => void;
}> = ({ artifactType, onArtifactTypeChange }) => {
  const types = [
    { id: 'text', label: 'Text / Markdown' },
    { id: 'image', label: 'Visual Art' },
    { id: 'pdf', label: 'PDF Document' },
    { id: 'audio', label: 'Music / Audio' },
  ] as const;

  return (
    <div className="flex justify-center mb-6">
      <div className="flex flex-wrap justify-center p-1 bg-black/40 rounded-xl border border-brand-border backdrop-blur-md gap-1">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onArtifactTypeChange(type.id)}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              artifactType === type.id
                ? 'bg-brand-primary/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-brand-primary/50'
                : 'text-brand-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const InputForm: React.FC<InputFormProps> = ({
  chatHistory,
  onChatHistoryChange,
  artifactFile,
  onFileChange,
  artifactType,
  onArtifactTypeChange,
  onSubmit,
  isLoading,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  const isMusicMode = artifactType === 'audio';

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) onFileChange(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onFileChange(e.target.files[0]);
  };
  
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); onFileChange(null);
  }

  const acceptString = {
    text: 'text/*,.md,.json,.csv',
    image: 'image/jpeg,image/png,image/webp,image/gif,image/avif',
    pdf: 'application/pdf',
    audio: 'audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,audio/webm'
  }[artifactType];

  const getUploadIcon = () => {
      if (artifactFile) return <ShieldCheckIcon className="w-8 h-8" />;
      if (isMusicMode) return <MusicalNoteIcon className="h-8 w-8 text-brand-secondary group-hover:text-brand-primary transition-colors" />;
      return <DocumentTextIcon className="h-8 w-8 text-brand-secondary group-hover:text-brand-primary transition-colors" />;
  }

  // Validation: Music requires ledger
  const isLedgerEmpty = !chatHistory || chatHistory.trim().length === 0;
  const isButtonDisabled = isLoading || !artifactFile || (isMusicMode && isLedgerEmpty);

  return (
    <div className="glass-panel rounded-2xl p-1 shadow-2xl">
      <div className="bg-brand-card/50 rounded-xl p-6 md:p-10">
        
        <ArtifactTypeSelector artifactType={artifactType} onArtifactTypeChange={onArtifactTypeChange} />

        <div className="mb-8 relative group">
           <div className={`absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-xl opacity-0 group-hover:opacity-20 transition duration-1000 blur-lg`}></div>
          <label
            htmlFor="file-upload"
            className={`relative flex flex-col justify-center items-center w-full h-64 border border-dashed rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${
              isDragging 
                ? 'border-brand-primary bg-brand-primary/10 scale-[1.01]' 
                : artifactFile 
                    ? 'border-brand-green/50 bg-brand-green/5' 
                    : 'border-brand-border hover:border-brand-primary/50 hover:bg-white/5'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isDragging && <div className="scan-line absolute top-0 left-0"></div>}
            
            <div className="text-center p-6 z-10">
              {artifactFile ? (
                <div className="animate-fade-in-up">
                    <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green">
                        {getUploadIcon()}
                    </div>
                    <p className="text-xl text-white font-medium mb-1">{artifactFile.name}</p>
                    <p className="text-sm text-brand-secondary mb-4">{(artifactFile.size / 1024).toFixed(1)} KB</p>
                    <button onClick={handleRemoveFile} className="px-4 py-2 bg-brand-dark/50 hover:bg-red-500/20 hover:text-red-400 text-brand-secondary text-xs font-bold uppercase rounded-full transition-colors border border-brand-border">
                        Change File
                    </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-border group-hover:border-brand-primary/50 transition-colors">
                     {getUploadIcon()}
                  </div>
                  <p className="text-lg text-brand-light font-medium">
                    Drop your <span className="text-brand-primary">{isMusicMode ? 'Audio File' : `${artifactType} file`}</span> here
                  </p>
                  <p className="text-sm text-brand-secondary mt-2">
                    or <span className="text-brand-primary hover:underline decoration-1 underline-offset-2">browse local files</span>
                  </p>
                </>
              )}
            </div>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileSelect} accept={acceptString} />
          </label>
        </div>

        {/* Collapsible Chat History Section */}
        <div className="mb-8 border-t border-brand-border pt-6">
            <button 
                onClick={() => !isMusicMode && setShowChatHistory(!showChatHistory)}
                className={`flex items-center justify-between w-full text-left group ${isMusicMode ? 'cursor-default' : 'cursor-pointer'}`}
            >
                <div>
                    <h3 className="text-sm font-semibold text-brand-light group-hover:text-white transition-colors flex items-center gap-2">
                        {isMusicMode ? "Production Ledger (Chat Logs)" : "Add Evidence of Creation"}
                        {isMusicMode && <span className="text-xs font-normal text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Required for Music</span>}
                        {!isMusicMode && !showChatHistory && <span className="text-xs font-normal text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">Recommended</span>}
                    </h3>
                    <p className="text-xs text-brand-secondary mt-1">
                        {isMusicMode 
                            ? "To verify agency, you must provide the full chat logs (prompts & iterations) used to generate the song."
                            : "Include chat logs or drafts to increase Human Agency verification."}
                    </p>
                </div>
                {!isMusicMode && (
                    <div className={`w-6 h-6 rounded-full border border-brand-border flex items-center justify-center transition-transform duration-300 ${showChatHistory ? 'rotate-180 bg-brand-primary text-white border-transparent' : 'text-brand-secondary'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </div>
                )}
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${(showChatHistory || isMusicMode) ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                 <textarea
                    rows={8}
                    className={`w-full bg-brand-dark/50 border rounded-lg p-4 text-sm text-brand-light placeholder-brand-secondary/50 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition duration-150 font-mono leading-relaxed resize-none
                    ${isMusicMode && isLedgerEmpty ? 'border-red-500/30' : 'border-brand-border'}`}
                    placeholder={isMusicMode ? "// PASTE PROMPTS HERE\nUser: Create a song about space in the style of 80s synthwave...\nAI: Here are lyrics...\nUser: Make it faster, 140bpm..." : "// Paste your LLM conversation history here...&#10;User: Create a function...&#10;AI: Here is the code..."}
                    value={chatHistory}
                    onChange={(e) => onChatHistoryChange(e.target.value)}
                ></textarea>
            </div>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
        )}

        <button
          onClick={onSubmit}
          disabled={isButtonDisabled}
          className={`w-full group relative py-4 px-4 rounded-xl font-bold text-white transition-all duration-300 overflow-hidden
            ${isButtonDisabled 
                ? 'bg-brand-border cursor-not-allowed text-brand-secondary' 
                : 'bg-brand-primary hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-[1.01]'
            }`}
        >
            {!isLoading && artifactFile && !isButtonDisabled && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            )}
            <span className="relative flex items-center justify-center gap-2">
                {isLoading ? 'Processing...' : 'Verify Human Agency'}
                {!isLoading && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>}
            </span>
        </button>
      </div>
    </div>
  );
};
