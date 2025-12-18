
import React from 'react';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SearchCircleIcon } from './icons/SearchCircleIcon';

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300">
    <div className="mb-4 p-3 bg-brand-dark rounded-full border border-brand-border text-brand-primary">
        {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2 font-sans">{title}</h3>
    <p className="text-sm text-brand-secondary leading-relaxed">{description}</p>
  </div>
);

export const InfoPanel: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
            icon={<DocumentTextIcon className="w-6 h-6" />}
            title="Contextual Analysis"
            description="We analyze your final artifact against your creative process logs to measure direction and refinement."
        />
        <FeatureCard 
            icon={<ShieldCheckIcon className="w-6 h-6" />}
            title="Agency Certification"
            description="Get a cryptographically verifiable score (HAS) proving your human influence in the loop."
        />
        <FeatureCard 
            icon={<SearchCircleIcon className="w-6 h-6" />}
            title="Privacy First"
            description="Ephemeral processing. Your intellectual property is analyzed in-memory and never stored."
        />
    </div>
  );
};
