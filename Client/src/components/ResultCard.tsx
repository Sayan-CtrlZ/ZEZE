import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

type ResultCardProps = {
  risk: string;
  probability: number;
  explanation: string;
  role?: string;
  feature_impacts?: Record<string, number>;
  payload?: Record<string, unknown>;
};

interface ParsedSection {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  content: string;
  theme: {
    wrapper: string;
    iconBg: string;
    badge: string;
  };
}

function parseExplanationSections(rawText: string): ParsedSection[] {
  if (!rawText) return [];
  const text = rawText.replace(/\r\n/g, '\n').trim();

  // Regex patterns matching the 3 section headers
  const section1Regex = /(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?(?:1[\.\)]\s*)?(Key Findings|Clinical Findings|Anomalous Data Points)[:\*]*(?:\*{1,2})?\s*(?:\n|$)/i;
  const section2Regex = /(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?(?:2[\.\)]\s*)?(What This Means|Differential Assessment|Mechanistic Analysis)[:\*]*(?:\*{1,2})?\s*(?:\n|$)/i;
  const section3Regex = /(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?(?:3[\.\)]\s*)?(Lifestyle\s*(?:&|and)?\s*Prevention|Recommended Clinical Pathways|Literature(?:\s*\/\s*Pharmacological)?\s*References)[:\*]*(?:\*{1,2})?\s*(?:\n|$)/i;

  const match1 = text.match(section1Regex);
  const match2 = text.match(section2Regex);
  const match3 = text.match(section3Regex);

  if (match1 && match2 && match3 && match1.index !== undefined && match2.index !== undefined && match3.index !== undefined) {
    const idx1 = match1.index + match1[0].length;
    const idx2 = match2.index;
    const idx2ContentStart = match2.index + match2[0].length;
    const idx3 = match3.index;
    const idx3ContentStart = match3.index + match3[0].length;

    return [
      {
        id: 'findings',
        title: match1[1].trim(),
        subtitle: 'Core vitals & cardiovascular biomarkers',
        badge: 'Diagnostic Summary',
        content: text.substring(idx1, idx2).trim(),
        theme: {
          wrapper: 'bg-gradient-to-br from-blue-50/70 via-sky-50/30 to-white/95 border border-blue-200/80 shadow-[inset_2px_2px_8px_rgba(37,99,235,0.06),inset_-2px_-2px_8px_rgba(255,255,255,0.95)]',
          iconBg: 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]',
          badge: 'bg-blue-100/90 text-blue-900 border border-blue-200/90',
        }
      },
      {
        id: 'meaning',
        title: match2[1].trim(),
        subtitle: 'Physiological impact on arterial and cardiac health',
        badge: 'Clinical Impact',
        content: text.substring(idx2ContentStart, idx3).trim(),
        theme: {
          wrapper: 'bg-gradient-to-br from-purple-50/70 via-violet-50/30 to-white/95 border border-purple-200/80 shadow-[inset_2px_2px_8px_rgba(147,51,234,0.06),inset_-2px_-2px_8px_rgba(255,255,255,0.95)]',
          iconBg: 'bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.35)]',
          badge: 'bg-purple-100/90 text-purple-900 border border-purple-200/90',
        }
      },
      {
        id: 'lifestyle',
        title: match3[1].trim(),
        subtitle: 'Practical recommendations and risk reduction steps',
        badge: 'Actionable Prevention',
        content: text.substring(idx3ContentStart).trim(),
        theme: {
          wrapper: 'bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white/95 border border-emerald-200/80 shadow-[inset_2px_2px_8px_rgba(16,185,129,0.06),inset_-2px_-2px_8px_rgba(255,255,255,0.95)]',
          iconBg: 'bg-[#17805d] text-white shadow-[0_4px_12px_rgba(23,128,93,0.35)]',
          badge: 'bg-emerald-100/90 text-emerald-900 border border-emerald-200/90',
        }
      }
    ];
  }

  // Fallback if structure is custom or different
  return [
    {
      id: 'general',
      title: 'Diagnostic Summary',
      subtitle: 'Comprehensive cardiovascular assessment',
      badge: 'Evaluation',
      content: text,
      theme: {
        wrapper: 'bg-gradient-to-br from-slate-50/80 via-white to-slate-100/70 border border-slate-200/80',
        iconBg: 'bg-[#17805d] text-white shadow-sm',
        badge: 'bg-slate-200 text-slate-800 border border-slate-300',
      }
    }
  ];
}

export default function ResultCard({ risk, probability, explanation, role = 'patient', feature_impacts, payload }: ResultCardProps) {
  const [activeView, setActiveView] = useState<'patient' | 'technical'>('patient');

  const riskLower = (risk || '').toLowerCase();
  const isHighRisk = riskLower === 'high';
  const isModerateRisk = riskLower === 'moderate';

  const riskTextColor = isHighRisk ? 'text-red-700' : isModerateRisk ? 'text-amber-700' : 'text-[#17805d]';
  const riskBgPulse = isHighRisk ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : isModerateRisk ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-[#17805d] shadow-[0_0_10px_#10b981]';
  const gaugeStroke = isHighRisk ? '#ef4444' : isModerateRisk ? '#f59e0b' : '#17805d';
  
  const topBannerBg = isHighRisk 
    ? 'bg-gradient-to-br from-rose-50/90 via-white/95 to-red-50/60 border-2 border-red-200/80 shadow-[0_12px_32px_rgba(239,68,68,0.12)]' 
    : isModerateRisk 
    ? 'bg-gradient-to-br from-amber-50/90 via-white/95 to-orange-50/60 border-2 border-amber-200/80 shadow-[0_12px_32px_rgba(245,158,11,0.12)]' 
    : 'bg-gradient-to-br from-emerald-50/90 via-white/95 to-teal-50/60 border-2 border-emerald-200/80 shadow-[0_12px_32px_rgba(16,185,129,0.12)]';

  let sectionTitle = "Clinical Diagnostic Summary";
  if (role === 'patient') sectionTitle = "What Your Test Results Mean";
  if (role === 'researcher') sectionTitle = "Model & Mechanistic Analysis";

  // Real-world clinical indicators that can be controlled
  const getControllableFactors = () => {
    if (!payload) return [];

    const ap_hi = payload.ap_hi ? Number(payload.ap_hi) : 120;
    const ap_lo = payload.ap_lo ? Number(payload.ap_lo) : 80;
    const cholTier = payload.cholesterol ? Number(payload.cholesterol) : 1;
    const glucTier = payload.gluc ? Number(payload.gluc) : 1;
    const isSmoker = payload.smoke === 1;
    const isSedentary = payload.active === 0;
    const h = Number(payload.height || 170);
    const w = Number(payload.weight || 70);
    const bmiNum = h > 0 && w > 0 ? Number((w / ((h / 100) ** 2)).toFixed(1)) : 24.0;

    const factors = [];

    // 1. Blood Pressure
    if (ap_hi >= 140 || ap_lo >= 90) {
      factors.push({
        id: 'bp',
        name: 'Blood Pressure',
        current: `${ap_hi}/${ap_lo} mmHg`,
        target: '< 120/80 mmHg',
        status: 'Above Normal (Stage 2 Hypertension)',
        isAboveNormal: true,
        priority: 1,
        badge: 'bg-rose-100 text-rose-800 border border-rose-300',
        barColor: 'bg-gradient-to-r from-rose-500 via-red-500 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        fillPercent: Math.min(Math.max(((ap_hi - 90) / 90) * 100, 40), 96),
        action: 'Priority to Control: Consult physician for antihypertensive management and dietary sodium reduction.'
      });
    } else if (ap_hi >= 130 || ap_lo >= 80) {
      factors.push({
        id: 'bp',
        name: 'Blood Pressure',
        current: `${ap_hi}/${ap_lo} mmHg`,
        target: '< 120/80 mmHg',
        status: 'Above Normal (Stage 1 Hypertension)',
        isAboveNormal: true,
        priority: 2,
        badge: 'bg-amber-100 text-amber-800 border border-amber-300',
        barColor: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        fillPercent: 68,
        action: 'Needs Attention: Implement DASH diet, aerobic exercise, and routine pressure tracking.'
      });
    } else {
      factors.push({
        id: 'bp',
        name: 'Blood Pressure',
        current: `${ap_hi}/${ap_lo} mmHg`,
        target: '< 120/80 mmHg',
        status: 'Normal / Controlled',
        isAboveNormal: false,
        priority: 5,
        badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        barColor: 'bg-gradient-to-r from-emerald-400 to-[#17805d] shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        fillPercent: 32,
        action: 'Healthy: Maintain your current healthy cardiovascular habits.'
      });
    }

    // 2. Cholesterol
    if (cholTier === 3) {
      factors.push({
        id: 'chol',
        name: 'Serum Cholesterol',
        current: 'Tier 3 (≥ 240 mg/dL)',
        target: '< 200 mg/dL (Tier 1)',
        status: 'Well Above Normal (High)',
        isAboveNormal: true,
        priority: 1,
        badge: 'bg-rose-100 text-rose-800 border border-rose-300',
        barColor: 'bg-gradient-to-r from-rose-500 via-red-500 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        fillPercent: 92,
        action: 'Needs Control: Strict saturated fat reduction, plant sterols, and physician review of lipid profile.'
      });
    } else if (cholTier === 2) {
      factors.push({
        id: 'chol',
        name: 'Serum Cholesterol',
        current: 'Tier 2 (200–239 mg/dL)',
        target: '< 200 mg/dL (Tier 1)',
        status: 'Above Normal (Borderline Elevated)',
        isAboveNormal: true,
        priority: 2,
        badge: 'bg-amber-100 text-amber-800 border border-amber-300',
        barColor: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        fillPercent: 65,
        action: 'Needs Attention: Adopt a heart-healthy Mediterranean diet with regular dietary fiber.'
      });
    } else {
      factors.push({
        id: 'chol',
        name: 'Serum Cholesterol',
        current: 'Tier 1 (< 200 mg/dL)',
        target: '< 200 mg/dL (Tier 1)',
        status: 'Normal / Healthy',
        isAboveNormal: false,
        priority: 5,
        badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        barColor: 'bg-gradient-to-r from-emerald-400 to-[#17805d] shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        fillPercent: 28,
        action: 'Healthy: Circulating lipid levels are within optimal range.'
      });
    }

    // 3. Physical Activity
    if (isSedentary) {
      factors.push({
        id: 'activity',
        name: 'Physical Activity Level',
        current: 'Sedentary (Low Activity)',
        target: '≥ 150 min/wk (30 min daily)',
        status: 'Below Recommended Level',
        isAboveNormal: true,
        priority: 2,
        badge: 'bg-pink-100 text-pink-800 border border-pink-300',
        barColor: 'bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-500 shadow-[0_0_12px_rgba(236,72,153,0.4)]',
        fillPercent: 78,
        action: 'Needs Increase: Daily brisk walking or moderate cardio significantly boosts vascular elasticity.'
      });
    } else {
      factors.push({
        id: 'activity',
        name: 'Physical Activity Level',
        current: 'Regularly Active',
        target: '≥ 150 min/wk',
        status: 'Protective / Optimal',
        isAboveNormal: false,
        priority: 5,
        badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        barColor: 'bg-gradient-to-r from-emerald-400 to-[#17805d] shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        fillPercent: 25,
        action: 'Protective: Regular physical activity actively protects arterial health.'
      });
    }

    // 4. Body Mass Index (BMI)
    if (bmiNum >= 30.0) {
      factors.push({
        id: 'bmi',
        name: 'Body Mass Index (BMI)',
        current: `${bmiNum} kg/m²`,
        target: '18.5 – 24.9 kg/m²',
        status: 'Well Above Normal (Obese)',
        isAboveNormal: true,
        priority: 2,
        badge: 'bg-rose-100 text-rose-800 border border-rose-300',
        barColor: 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        fillPercent: 88,
        action: 'Needs Control: Sustainable caloric adjustments reduce cardiac workload and vascular strain.'
      });
    } else if (bmiNum >= 25.0) {
      factors.push({
        id: 'bmi',
        name: 'Body Mass Index (BMI)',
        current: `${bmiNum} kg/m²`,
        target: '18.5 – 24.9 kg/m²',
        status: 'Above Normal (Overweight)',
        isAboveNormal: true,
        priority: 3,
        badge: 'bg-amber-100 text-amber-800 border border-amber-300',
        barColor: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        fillPercent: 66,
        action: 'Needs Attention: Moderate weight loss will progressively lower arterial blood pressure.'
      });
    }

    // 5. Smoking
    if (isSmoker) {
      factors.push({
        id: 'smoke',
        name: 'Tobacco & Smoking',
        current: 'Active Smoker',
        target: 'Non-Smoker',
        status: 'High Priority Risk Factor',
        isAboveNormal: true,
        priority: 1,
        badge: 'bg-red-100 text-red-800 border border-red-300',
        barColor: 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        fillPercent: 94,
        action: 'Critical to Control: Smoking cessation yields immediate arterial and microvascular recovery.'
      });
    }

    // 6. Fasting Glucose
    if (glucTier === 3) {
      factors.push({
        id: 'gluc',
        name: 'Fasting Blood Glucose',
        current: 'Tier 3 (≥ 126 mg/dL)',
        target: '< 100 mg/dL (Tier 1)',
        status: 'High (Diabetic Range)',
        isAboveNormal: true,
        priority: 1,
        badge: 'bg-rose-100 text-rose-800 border border-rose-300',
        barColor: 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        fillPercent: 90,
        action: 'Needs Control: Elevated blood sugar accelerates atherosclerosis; clinical glycemic control needed.'
      });
    } else if (glucTier === 2) {
      factors.push({
        id: 'gluc',
        name: 'Fasting Blood Glucose',
        current: 'Tier 2 (100–125 mg/dL)',
        target: '< 100 mg/dL (Tier 1)',
        status: 'Above Normal (Pre-diabetic)',
        isAboveNormal: true,
        priority: 3,
        badge: 'bg-teal-100 text-teal-800 border border-teal-300',
        barColor: 'bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(20,184,166,0.4)]',
        fillPercent: 62,
        action: 'Needs Attention: Limit refined carbohydrates and sugars to prevent vascular inflammation.'
      });
    }

    // Sort by priority (factors above normal first)
    return factors.sort((a, b) => a.priority - b.priority);
  };

  const controllableFactors = getControllableFactors();
  const factorsNeedingControl = controllableFactors.filter(f => f.isAboveNormal);

  return (
    <div className="w-full text-slate-900">
      
      {/* Top Banner with Concentric Dial Gauge */}
      <div className={`flex flex-col md:flex-row items-center justify-between gap-6 mb-6 p-6 sm:p-8 rounded-3xl neu-flat ${topBannerBg} transition-all`}>
        <div className="flex-1 text-left">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full neu-inset-sm text-slate-900 text-[10px] font-black tracking-widest uppercase mb-4 bg-white/70">
            <span className={`w-2.5 h-2.5 rounded-full ${riskBgPulse}`}></span>
            {role.toUpperCase()} VIEW &bull; 3-TIER EVALUATION
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-slate-900">
            Risk: <span className={riskTextColor}>{risk}</span>
          </h2>
          <p className="text-slate-700 font-bold text-sm sm:text-base">
            Evaluated by Calibrated 70,000-Record Clinical Gradient Boosting Model.
          </p>
        </div>

        {/* Concentric Neumorphic Dial Gauge */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 neu-convex rounded-full p-3 flex items-center justify-center shadow-lg bg-white/80">
          <div className="w-full h-full neu-concave rounded-full flex items-center justify-center p-2 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path 
                stroke={gaugeStroke} 
                strokeDasharray={`${probability}, 100`} 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                strokeWidth="3.4" 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 leading-none">
                {Math.round(probability)}<span className="text-base font-extrabold">%</span>
              </span>
              <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase mt-1">PROBABILITY</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 4 Colored Vitals Cards */}
      {payload && (
        <div className="mt-6 p-6 sm:p-8 neu-inset rounded-3xl bg-slate-100/60">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Patient Examination Vitals
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Tile 1: Blood Pressure */}
            <div className="p-5 rounded-2xl neu-flat bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white/90 border border-blue-200/80 hover:scale-[1.02] transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.35)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full">Blood Pressure</span>
              </div>
              <div className="text-xs font-black text-blue-900 tracking-wider uppercase">Resting Arterial</div>
              <div className="font-black text-xl text-slate-950 mt-1">{payload.ap_hi ? `${payload.ap_hi}/${payload.ap_lo || 80} mmHg` : '120/80 mmHg'}</div>
            </div>

            {/* Tile 2: BMI */}
            <div className="p-5 rounded-2xl neu-flat bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white/90 border border-emerald-200/80 hover:scale-[1.02] transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.35)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">Body Metrics</span>
              </div>
              <div className="text-xs font-black text-emerald-900 tracking-wider uppercase">Body Mass Index</div>
              <div className="font-black text-xl text-slate-950 mt-1">
                {payload.height && payload.weight ? `${(Number(payload.weight) / ((Number(payload.height)/100)**2)).toFixed(1)} kg/m²` : '24.0 kg/m²'}
              </div>
            </div>

            {/* Tile 3: Cholesterol & Glucose */}
            <div className="p-5 rounded-2xl neu-flat bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white/90 border border-amber-200/80 hover:scale-[1.02] transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full">Biomarkers</span>
              </div>
              <div className="text-xs font-black text-amber-900 tracking-wider uppercase">Cholesterol &bull; Glucose</div>
              <div className="font-black text-xl text-slate-950 mt-1">
                Tier {String(payload.cholesterol || 1)}/3 &bull; Tier {String(payload.gluc || 1)}/3
              </div>
            </div>

            {/* Tile 4: Lifestyle Habits */}
            <div className="p-5 rounded-2xl neu-flat bg-gradient-to-br from-purple-50/90 via-violet-50/40 to-white/90 border border-purple-200/80 hover:scale-[1.02] transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(147,51,234,0.35)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase text-purple-800 bg-purple-100/90 px-2.5 py-0.5 rounded-full">Behavioral</span>
              </div>
              <div className="text-xs font-black text-purple-900 tracking-wider uppercase">Lifestyle Habits</div>
              <div className="font-black text-xl text-slate-950 mt-1">
                {payload.smoke === 1 ? 'Smoker' : 'Non-smoker'} &bull; {payload.active === 0 ? 'Sedentary' : 'Active'}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HUMAN CLINICAL ACTION SECTION (THINGS THAT NEED TO BE CONTROLLED) */}
      <div className="mt-8 p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)]">
        
        {/* Section Header with View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60">
          <div>
            <h4 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </span>
              Clinical Factors That Need Attention & Control
            </h4>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Real-world health metrics that are above normal range and can be actively managed to lower risk.
            </p>
          </div>

          {/* Toggle Button for Patients vs Researchers */}
          <div className="p-1 neu-inset rounded-2xl flex items-center gap-1 shrink-0 self-start sm:self-auto bg-slate-200/50">
            <button
              type="button"
              onClick={() => setActiveView('patient')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeView === 'patient'
                  ? 'neu-button-3d text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Action View (What To Control)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('technical')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeView === 'technical'
                  ? 'neu-button-3d text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Technical Model Weights
            </button>
          </div>
        </div>

        {activeView === 'patient' ? (
          /* PATIENT-FRIENDLY CLINICAL CONTROL VIEW */
          <div className="space-y-4">
            {factorsNeedingControl.length > 0 ? (
              factorsNeedingControl.map((factor) => (
                <div 
                  key={factor.id} 
                  className="p-4 sm:p-5 rounded-2xl neu-flat bg-white/70 border border-slate-200/80 space-y-3 hover:border-slate-300 transition-all"
                >
                  {/* Top Row: Factor Name, Real Value, and Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-sm sm:text-base text-slate-900">{factor.name}</span>
                      <span className="font-black text-xs sm:text-sm text-slate-800 neu-inset-sm px-3 py-1 rounded-xl bg-slate-50">
                        {factor.current}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-extrabold text-slate-500">Target: {factor.target}</span>
                      <span className={`text-xs font-black px-3 py-1 rounded-full shadow-sm ${factor.badge}`}>
                        {factor.status}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Zone Visual Range Bar: Shows clearly how it is above normal */}
                  <div className="space-y-1.5">
                    <div className="w-full h-5 sm:h-6 neu-track-inset rounded-full p-1 overflow-hidden flex items-center relative bg-[#dce5ef] shadow-inner">
                      {/* Clinical Zone Indicators */}
                      <div className="absolute inset-0 flex text-[9px] font-black uppercase text-slate-400 pointer-events-none opacity-50 z-0">
                        <div className="w-2/5 border-r border-slate-300/80 flex items-center justify-center">Normal Zone</div>
                        <div className="w-3/10 border-r border-slate-300/80 flex items-center justify-center">Elevated</div>
                        <div className="flex-1 flex items-center justify-center">Needs Control</div>
                      </div>
                      
                      {/* Patient Level Fill */}
                      <div 
                        className={`h-full rounded-full ${factor.barColor} transition-all duration-700 relative z-10`}
                        style={{ width: `${factor.fillPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Actionable Guidance */}
                  <div className="text-xs font-bold text-slate-600 flex items-start sm:items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-black text-[10px] uppercase shrink-0">
                      Recommendation
                    </span>
                    <span>{factor.action}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center neu-inset rounded-2xl text-emerald-800 font-black text-sm">
                All modifiable health indicators are currently within healthy baseline targets.
              </div>
            )}

            {/* Non-Modifiable Demographic Baseline (Separated so patient understands Age is not something to control) */}
            <div className="p-4 neu-inset rounded-2xl bg-slate-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mt-4">
              <div className="flex items-center gap-2.5 text-slate-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
                <span>
                  <strong>Baseline Demographics:</strong> {payload?.age ? `${payload.age} years old` : '58 years old'} &bull; {payload?.sex === 1 ? 'Male' : 'Female'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold italic">
                *Age and biological sex are non-modifiable baseline factors, not targetable for clinical control.
              </span>
            </div>
          </div>
        ) : (
          /* TECHNICAL MODEL WEIGHT VIEW (FOR CLINICIANS / RESEARCHERS) */
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 mb-4">
              Statistical logit contributions derived from the 70,000-cohort gradient boosting trees (z-score relative to cohort medians).
            </p>
            {feature_impacts && Object.entries(feature_impacts)
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .map(([name, impact]) => {
                const isPositive = impact > 0;
                return (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl neu-flat text-xs font-bold">
                    <span className="text-slate-800">{name}</span>
                    <span className={`px-2.5 py-1 rounded-full font-black ${isPositive ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {isPositive ? '+' : ''}{impact.toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

      </div>

      {/* Structured Clinical Breakdown into 3 Major Cutout Cards */}
      <div className="mt-8 p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)]">
        
        {/* Main Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/60">
          <div>
            <h3 className="text-2xl sm:text-3xl tracking-tight text-slate-900 font-black flex items-center gap-3">
              <span className="w-3.5 h-8 bg-gradient-to-b from-[#17805d] to-teal-700 rounded-full inline-block"></span>
              {sectionTitle}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Comprehensive clinical evaluation synthesized across cardiovascular metrics and lifestyle factors.
            </p>
          </div>
          <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-slate-200/80 text-slate-700 border border-slate-300/70 self-start sm:self-auto shadow-sm">
            3-Part Clinical Report
          </span>
        </div>

        {/* 3 Major Cutout Cards */}
        <div className="space-y-6">
          {(() => {
            const sections = parseExplanationSections(explanation);
            return sections.map((section) => {
              const isFindings = section.id === 'findings';
              const isMeaning = section.id === 'meaning';
              const isLifestyle = section.id === 'lifestyle';

              return (
                <div 
                  key={section.id} 
                  className={`p-6 sm:p-8 neu-inset rounded-3xl transition-all duration-300 ${section.theme.wrapper}`}
                >
                  {/* Card Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${section.theme.iconBg}`}>
                        {isFindings && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        )}
                        {isMeaning && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                        {isLifestyle && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {!isFindings && !isMeaning && !isLifestyle && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                          {section.title}:
                        </h4>
                        <p className="text-xs font-bold text-slate-500">
                          {section.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm ${section.theme.badge}`}>
                      {section.badge}
                    </span>
                  </div>

                  {/* Card Content Area - All points inside one spacious cutout */}
                  <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed 
                    prose-p:font-medium prose-p:my-2 prose-p:text-slate-800 
                    prose-strong:font-black prose-strong:text-slate-950 
                    prose-headings:text-slate-950 prose-headings:font-black
                    prose-ul:my-2 prose-ul:space-y-2
                    prose-li:font-medium prose-li:text-slate-800 prose-li:my-1">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

    </div>
  );
}
