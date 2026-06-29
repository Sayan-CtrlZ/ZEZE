import React from 'react';
import ReactMarkdown from 'react-markdown';

type ResultCardProps = {
  risk: string;
  probability: number;
  explanation: string;
  role?: string;
  feature_impacts?: Record<string, number>;
  payload?: any;
};

export default function ResultCard({ risk, probability, explanation, role = 'patient', feature_impacts, payload }: ResultCardProps) {
  const isHighRisk = risk.toLowerCase() === 'high';
  
  let sectionTitle = "What do your test results mean?";
  if (role === 'practitioner') sectionTitle = "Clinical Diagnostic Assessment";
  if (role === 'researcher') sectionTitle = "Data & Mechanistic Analysis";
  
  const renderFeatureImpacts = () => {
    if (!feature_impacts || Object.keys(feature_impacts).length === 0) return null;
    
    // Sort by absolute impact
    const sortedFeatures = Object.entries(feature_impacts)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 8); // Top 8 features

    const maxImpact = Math.max(...sortedFeatures.map(f => Math.abs(f[1])), 0.1);

    return (
      <div className="mt-8 p-6 bg-white/40 rounded-xl border border-white/60">
        <h4 className="text-sm font-bold uppercase tracking-widest text-brand-900 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Local Feature Impact Analysis (Model Weights)
        </h4>
        <div className="space-y-4">
          {sortedFeatures.map(([name, impact]) => {
            const percentage = (Math.abs(impact) / maxImpact) * 100;
            const isPositive = impact > 0;
            return (
              <div key={name} className="flex items-center gap-4 text-sm font-medium">
                <div className="w-1/3 text-right text-brand-900/80 truncate" title={name}>{name}</div>
                <div className="w-2/3 flex items-center gap-2">
                  <div className="flex-1 h-3 bg-brand-900/10 rounded-full overflow-hidden flex items-center">
                     <div className="w-1/2 flex justify-end">
                       {!isPositive && <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${percentage}%` }}></div>}
                     </div>
                     <div className="w-1/2 flex justify-start">
                       {isPositive && <div className="h-full bg-red-500 rounded-r-full" style={{ width: `${percentage}%` }}></div>}
                     </div>
                  </div>
                  <div className={`w-12 text-xs font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                    {isPositive ? '+' : ''}{impact.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-brand-900/50 mt-4 italic">* Positive values increase risk probability, negative values decrease it.</p>
      </div>
    );
  };

  const renderPractitionerMetrics = () => {
    if (!payload || role !== 'practitioner') return null;
    return (
      <div className="mt-8 p-6 bg-white/40 rounded-xl border border-white/60">
        <h4 className="text-sm font-bold uppercase tracking-widest text-brand-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Extracted Clinical Metrics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-white/50 rounded-lg"><div className="text-xs text-brand-900/60 uppercase">Age / Sex</div><div className="font-bold text-lg">{payload.age} / {payload.sex === 1 ? 'M' : 'F'}</div></div>
          <div className="p-3 bg-white/50 rounded-lg"><div className="text-xs text-brand-900/60 uppercase">Resting BP</div><div className={`font-bold text-lg ${payload.trestbps > 130 ? 'text-red-600' : ''}`}>{payload.trestbps || '--'}</div></div>
          <div className="p-3 bg-white/50 rounded-lg"><div className="text-xs text-brand-900/60 uppercase">Cholesterol</div><div className={`font-bold text-lg ${payload.chol > 240 ? 'text-red-600' : ''}`}>{payload.chol || '--'}</div></div>
          <div className="p-3 bg-white/50 rounded-lg"><div className="text-xs text-brand-900/60 uppercase">Max HR</div><div className="font-bold text-lg">{payload.thalach || '--'}</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-brand-900 animate-in fade-in slide-in-from-bottom-8">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10 bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
        <div className="flex-1 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/10 text-brand-900 text-[10px] font-bold tracking-widest uppercase mb-4">
            <span className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
            {role} View
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            Risk: <span className={isHighRisk ? 'text-red-600' : 'text-green-600'}>{risk}</span>
          </h2>
          <p className="text-brand-900/60 font-medium">Cardiovascular evaluation complete.</p>
        </div>

        {/* Dial / Gauge for Probability */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
            <path className="text-brand-900/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            <path className={isHighRisk ? 'text-red-500' : 'text-green-500'} strokeDasharray={`${probability}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl md:text-4xl font-black">{Math.round(probability)}<span className="text-lg">%</span></span>
          </div>
        </div>
      </div>
      
      {renderPractitionerMetrics()}
      {role === 'researcher' && renderFeatureImpacts()}

      <div className="mt-12 pt-8 border-t border-brand-900/20">
        <h3 className="text-2xl md:text-3xl tracking-tight text-brand-900 font-black flex items-center gap-3 mb-8">
          {sectionTitle}
        </h3>
        <div className="space-y-3">
          {explanation.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => {
            const isAlt = idx % 2 === 0;
            
            // Dynamic styling based on role
            let bgColor = isAlt ? 'bg-blue-50' : 'bg-transparent';
            let highlightColor = 'prose-strong:text-blue-700 prose-li:marker:text-blue-600';
            
            if (role === 'practitioner') {
              bgColor = isAlt ? 'bg-teal-50' : 'bg-transparent';
              highlightColor = 'prose-strong:text-teal-800 prose-li:marker:text-teal-700';
            } else if (role === 'researcher') {
              bgColor = 'bg-transparent border-b border-gray-300 pb-6';
              highlightColor = 'prose-strong:text-slate-800 prose-li:marker:text-slate-700';
            }

            return (
              <div key={idx} className={`p-4 md:p-5 rounded-2xl transition-colors ${bgColor}`}>
                <div className={`prose prose-base md:prose-lg prose-brand prose-p:text-brand-900/90 prose-p:font-semibold prose-p:my-1 prose-p:leading-snug prose-li:text-brand-900/90 prose-li:font-semibold prose-li:my-0 prose-ul:my-1 prose-headings:text-brand-900 prose-headings:my-2 prose-strong:font-black max-w-none ${highlightColor}`}>
                  <ReactMarkdown>{paragraph}</ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
