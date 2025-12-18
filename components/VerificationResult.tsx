
import React, { useState } from 'react';
import type { NotaryReport } from '../types';
import { SealIcon } from './icons/SealIcon';
import { ClipboardCopyIcon } from './icons/ClipboardCopyIcon';

const getVerLevelDetails = (ver: string) => {
    switch (ver) {
        case 'VER-3':
            return {
                title: 'Exceptional Agency',
                gradient: 'from-emerald-500 to-emerald-700',
                text: 'text-emerald-400',
                border: 'border-emerald-500/30',
                shadow: 'shadow-emerald-500/20',
                description: 'Profound human direction, originality, and integrity detected.'
            };
        case 'VER-2':
            return {
                title: 'Significant Agency',
                gradient: 'from-cyan-500 to-blue-600',
                text: 'text-cyan-400',
                border: 'border-cyan-500/30',
                shadow: 'shadow-cyan-500/20',
                description: 'Clear human guidance and creative influence throughout the process.'
            };
        case 'VER-1':
            return {
                title: 'Verified Agency',
                gradient: 'from-blue-500 to-indigo-600',
                text: 'text-blue-400',
                border: 'border-blue-500/30',
                shadow: 'shadow-blue-500/20',
                description: 'Human involvement was a detectable factor in the final artifact.'
            };
        case 'VER-0':
        default:
            return {
                title: 'Unverified',
                gradient: 'from-amber-500 to-orange-600',
                text: 'text-amber-400',
                border: 'border-amber-500/30',
                shadow: 'shadow-amber-500/20',
                description: 'Could not conclusively verify significant human agency.'
            };
    }
};

const MetricBar: React.FC<{ label: string; value: number; }> = ({ label, value }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs uppercase tracking-wider font-bold mb-1">
            <span className="text-brand-secondary">{label}</span>
            <span className="text-white">{(value * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-brand-dark rounded-full overflow-hidden border border-white/5">
            <div 
                className="h-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-1000 ease-out"
                style={{ width: `${value * 100}%` }}
            ></div>
        </div>
    </div>
);

export const VerificationResult: React.FC<{ result: NotaryReport, onReset: () => void }> = ({ result, onReset }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { title, gradient, text, border, shadow, description } = getVerLevelDetails(result.VER);

    const isArtifactOnly = result.scores.HI === 0 && result.scores.PD === 0;
    const showImprovementTip = isArtifactOnly && result.VER !== 'VER-3';

    const handleCopyCertificate = () => {
        const certificateText = `VerifAI Certificate: ${result.cert_id} | Level: ${result.VER} | HAS: ${result.HAS}`;
        navigator.clipboard.writeText(certificateText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        });
    };

    return (
        <div className="animate-fade-in-up max-w-3xl mx-auto">
            {/* Certificate Card */}
            <div className={`glass-panel rounded-2xl overflow-hidden border ${border} shadow-2xl ${shadow} mb-8 relative`}>
                {/* Top Decoration Line */}
                <div className={`h-2 w-full bg-gradient-to-r ${gradient}`}></div>
                
                <div className="p-8 md:p-10">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/10 pb-8">
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-white tracking-tight mb-1">Certificate of Agency</h2>
                            <p className="text-brand-secondary font-mono text-xs uppercase tracking-widest">ID: {result.cert_id.split('-')[0]}... • {new Date(result.issued_at).toLocaleDateString()}</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-3">
                            <SealIcon className={`w-10 h-10 ${text}`} />
                            <div className="text-right">
                                <p className={`text-2xl font-bold ${text}`}>{result.VER}</p>
                                <p className="text-xs font-bold uppercase tracking-wider text-white/60">{title}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Score Orb */}
                    <div className="flex flex-col items-center justify-center mb-10">
                         <div className="relative w-64 h-64 flex items-center justify-center">
                            {/* Ambient Glow / Pulse */}
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${gradient} opacity-20 blur-3xl animate-pulse-slow`}></div>
                            
                            {/* Core Orb */}
                            <div className={`relative w-40 h-40 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden`}>
                                
                                {/* Top Gloss/Reflection */}
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-80 pointer-events-none"></div>
                                
                                {/* Inner Shadow for Depth */}
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] pointer-events-none"></div>

                                {/* Content */}
                                <div className="text-center z-10 relative">
                                    <span className="text-6xl font-bold text-white block drop-shadow-md tracking-tighter leading-none">{result.HAS}</span>
                                    <span className="text-[10px] text-white/90 uppercase tracking-[0.3em] font-medium mt-1 block">Score</span>
                                </div>
                            </div>
                         </div>
                         <p className="text-center text-brand-light max-w-md -mt-4 italic opacity-80">"{description}"</p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/20 rounded-xl p-6 border border-white/5">
                        <div>
                            <h4 className="text-xs font-bold uppercase text-white/50 mb-4 tracking-widest">Semantic Composition</h4>
                            <MetricBar label="Originality" value={result.scores.ORG} />
                            <MetricBar label="Integrity" value={result.scores.INTEG} />
                            <MetricBar label="Composition" value={result.scores.COMP} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase text-white/50 mb-4 tracking-widest">Process Evidence</h4>
                            <MetricBar label="Human Influence" value={result.scores.HI} />
                            <MetricBar label="Direction" value={result.scores.PD} />
                            {result.is_music ? (
                                <MetricBar label="Complexity" value={result.scores.IC || 0} />
                            ) : (
                                <MetricBar label="Refinement" value={result.scores.REF} />
                            )}
                        </div>
                    </div>

                    {showImprovementTip && (
                        <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
                            <span className="text-amber-400 text-xl">💡</span>
                            <div>
                                <p className="text-amber-200 text-sm font-bold">Increase your score</p>
                                <p className="text-amber-200/70 text-xs mt-1">To reach VER-3, re-verify with your chat logs or draft history to prove process direction.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer of Card */}
                <div className="bg-black/30 p-4 border-t border-white/5 flex justify-between items-center text-[10px] text-brand-secondary font-mono">
                    <span>HASH: {result.artifact_sha256.substring(0, 16)}...</span>
                    <span>MODEL: {result.PPM_MODEL_POLICY}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={onReset}
                    className="px-6 py-3 text-sm font-bold text-white hover:text-brand-primary transition-colors"
                >
                    Scan New Artifact
                </button>
                <button
                    onClick={handleCopyCertificate}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-blue-500 text-white rounded-full font-bold text-sm shadow-lg shadow-brand-primary/20 transition-all hover:scale-105"
                >
                    <ClipboardCopyIcon className="w-4 h-4" />
                    {isCopied ? 'Copied to Clipboard' : 'Copy Verification ID'}
                </button>
            </div>
        </div>
    );
};
