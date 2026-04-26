import React from 'react';

type ResultCardProps = {
  risk: string;
  probability: number;
  explanation: string;
};

export default function ResultCard({ risk, probability, explanation }: ResultCardProps) {
  const isHighRisk = risk.toLowerCase() === 'high';
  
  return (
    <div className={`mt-10 mx-auto max-w-3xl overflow-hidden rounded-2xl p-8 lg:p-12 backdrop-blur-2xl border transition-all duration-700 ease-in-out shadow-2xl animate-in fade-in slide-in-from-bottom-8
      ${isHighRisk 
        ? 'bg-red-50/70 border-red-100 shadow-red-900/5' 
        : 'bg-green-50/70 border-green-100 shadow-green-900/5'}`}>
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mb-8 pb-8 border-b border-black/5">
        <div className="flex flex-col items-center">
          <span className="text-sm uppercase tracking-widest text-black/40 font-semibold mb-2">Risk Level</span>
          <h2 className={`text-6xl font-light tracking-tight ${isHighRisk ? 'text-red-700' : 'text-green-700'}`}>
            {risk}
          </h2>
        </div>
        <div className="hidden sm:block w-px h-20 bg-black/5"></div>
        <div className="flex flex-col items-center">
          <span className="text-sm uppercase tracking-widest text-black/40 font-semibold mb-2">Probability</span>
          <h2 className={`text-6xl font-light tracking-tight ${isHighRisk ? 'text-red-700' : 'text-green-700'}`}>
            {probability.toFixed(1)}<span className="text-3xl text-black/30">%</span>
          </h2>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm uppercase tracking-widest text-black/40 font-semibold flex items-center gap-2">
          <span>✧</span> AI Clinical Assessment
        </h3>
        <p className="text-brand-900/90 text-lg leading-relaxed font-medium">
          {explanation}
        </p>
      </div>
    </div>
  );
}
