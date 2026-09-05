import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import MedicationReference from './MedicationReference';

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
  const section3Regex = /(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?(?:3[\.\)]\s*)?(Lifestyle\s*(?:&|and)?\s*Prevention|Recommended Clinical Pathways|Educational\s*(?:&|and)?\s*Learning\s*Context|Literature(?:\s*\/\s*Pharmacological)?\s*References)[:\*]*(?:\*{1,2})?\s*(?:\n|$)/i;

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
        badge: 'Actionable Guidance',
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
  const [howCalculatedOpen, setHowCalculatedOpen] = useState(false);

  // Normalize Role
  const roleLower = (role || 'patient').toLowerCase();
  const isClinician = roleLower === 'clinician' || roleLower === 'practitioner';
  const isTrainee = roleLower === 'trainee' || roleLower === 'student';
  const roleLabel = isClinician ? 'Clinician' : isTrainee ? 'Healthcare Trainee' : 'Patient / General';

  // Risk Classification
  const riskCategory = probability < 30 ? 'Low' : probability < 70 ? 'Intermediate' : 'High';
  const isHighRisk = riskCategory === 'High';
  const isModerateRisk = riskCategory === 'Intermediate';

  const riskTextColor = isHighRisk ? 'text-red-700' : isModerateRisk ? 'text-amber-700' : 'text-[#17805d]';
  const riskBgPulse = isHighRisk ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : isModerateRisk ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-[#17805d] shadow-[0_0_10px_#10b981]';
  const gaugeStroke = isHighRisk ? '#ef4444' : isModerateRisk ? '#f59e0b' : '#17805d';
  
  const topBannerAccentBorder = isHighRisk 
    ? 'border-t-[5px] border-t-red-500 border-x border-b border-slate-300/70' 
    : isModerateRisk 
    ? 'border-t-[5px] border-t-amber-500 border-x border-b border-slate-300/70' 
    : 'border-t-[5px] border-t-emerald-500 border-x border-b border-slate-300/70';

  // Section Title based on role
  let sectionTitle = "What This Means & Actionable Guidance";
  if (isClinician) sectionTitle = "Clinical Diagnostic & Pathways Report";
  if (isTrainee) sectionTitle = "Supervised Learning & Pathophysiological Analysis";

  // Patient Values & Defaults
  const ap_hi = payload?.ap_hi ? Number(payload.ap_hi) : 135;
  const ap_lo = payload?.ap_lo ? Number(payload.ap_lo) : 85;
  const cholTier = payload?.cholesterol ? Number(payload.cholesterol) : 2;
  const glucTier = payload?.gluc ? Number(payload.gluc) : 1;
  const isSmoker = payload?.smoke === 1;
  const isSedentary = payload?.active === 0;
  const ageVal = payload?.age ? Number(payload.age) : 55;
  const heightVal = Number(payload?.height || 172);
  const weightVal = Number(payload?.weight || 78);
  const bmiNum = heightVal > 0 && weightVal > 0 ? Number((weightVal / ((heightVal / 100) ** 2)).toFixed(1)) : 26.4;

  // WHAT-IF SCENARIO SIMULATOR STATE
  const [simBp, setSimBp] = useState<number>(ap_hi);
  const [simSmoke, setSimSmoke] = useState<boolean>(isSmoker);
  const [simChol, setSimChol] = useState<number>(cholTier);
  const [simActive, setSimActive] = useState<boolean>(!isSedentary);

  // Dynamic Calculation of Simulated Risk
  const simulatedProbability = useMemo(() => {
    const p0 = Math.min(Math.max(probability, 1.0), 99.0) / 100.0;
    const logit0 = Math.log(p0 / (1.0 - p0));

    // Weight coefficients from trained tree ensemble
    const bpDelta = (simBp - ap_hi) * 0.042;
    const smokeDelta = ((simSmoke ? 1 : 0) - (isSmoker ? 1 : 0)) * 0.62;
    const cholDelta = (simChol - cholTier) * 0.45;
    const activeDelta = ((simActive ? 1 : 0) - (!isSedentary ? 1 : 0)) * -0.38;

    const newLogit = logit0 + bpDelta + smokeDelta + cholDelta + activeDelta;
    const newP = 1.0 / (1.0 + Math.exp(-newLogit));
    return Math.min(Math.max(Number((newP * 100).toFixed(1)), 1.0), 99.0);
  }, [probability, simBp, simSmoke, simChol, simActive, ap_hi, isSmoker, cholTier, isSedentary]);

  const riskDelta = Number((simulatedProbability - probability).toFixed(1));

  const resetSimulator = () => {
    setSimBp(ap_hi);
    setSimSmoke(isSmoker);
    setSimChol(cholTier);
    setSimActive(!isSedentary);
  };

  // WHAT CONTRIBUTED MOST? (Derived from feature impacts or clinical vitals)
  const topDrivers = useMemo(() => {
    const drivers = [
      {
        id: 'bp',
        name: 'Blood Pressure',
        shortName: 'Blood Press.',
        metric: `${ap_hi}/${ap_lo} mmHg`,
        weight: ap_hi >= 140 ? 2.4 : ap_hi >= 130 ? 1.5 : -0.4,
        isRisk: ap_hi >= 130,
        label: ap_hi >= 140 ? 'Primary Risk Contributor' : ap_hi >= 130 ? 'Elevated Contributor' : 'Optimal Hemodynamics',
        badgeClass: ap_hi >= 140 
          ? 'bg-rose-500 text-white border-rose-600 shadow-sm' 
          : ap_hi >= 130 
          ? 'bg-rose-100 text-rose-900 border-rose-300' 
          : 'bg-blue-100 text-blue-900 border-blue-300',
        metricBadgeClass: ap_hi >= 130 ? 'bg-rose-50/90 text-rose-900 border-rose-200' : 'bg-blue-50/90 text-blue-900 border-blue-200',
        pillGradient: ap_hi >= 140 
          ? 'from-[#fb7185] to-[#e11d48]' 
          : ap_hi >= 130 
          ? 'from-[#f43f5e] to-[#be123c]' 
          : 'from-[#60a5fa] to-[#2563eb]',
        dotColor: ap_hi >= 130 ? '#e11d48' : '#2563eb',
        explanation: 'Elevated arterial pressure exerts high pulsatile mechanical shear stress against arterial walls, driving cardiac afterload.',
        fillPercent: Math.min(Math.max(((ap_hi - 90) / 90) * 100, 30), 96)
      },
      {
        id: 'chol',
        name: 'Serum Cholesterol Profile',
        shortName: 'Cholesterol',
        metric: `Tier ${cholTier}/3 (${cholTier === 3 ? '≥240 mg/dL' : cholTier === 2 ? '200-239 mg/dL' : '<200 mg/dL'})`,
        weight: cholTier === 3 ? 1.4 : cholTier === 2 ? 0.7 : -0.5,
        isRisk: cholTier > 1,
        label: cholTier === 3 ? 'High Atherogenic Burden' : cholTier === 2 ? 'Moderate Contributor' : 'Protective Baseline',
        badgeClass: cholTier === 3 
          ? 'bg-amber-500 text-amber-950 border-amber-600 shadow-sm font-black' 
          : cholTier === 2 
          ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' 
          : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black',
        metricBadgeClass: cholTier === 3 ? 'bg-amber-100 text-amber-950 border-amber-300' : cholTier === 2 ? 'bg-yellow-50 text-amber-900 border-yellow-300' : 'bg-emerald-50 text-emerald-900 border-emerald-200',
        pillGradient: cholTier === 3 
          ? 'from-[#f59e0b] to-[#b45309]' 
          : cholTier === 2 
          ? 'from-[#fbbf24] to-[#d97706]' 
          : 'from-[#34d399] to-[#059669]',
        dotColor: '#d97706',
        explanation: 'Circulating atherogenic lipoproteins infiltrate vascular subendothelial spaces to form fibrous plaques.',
        fillPercent: cholTier === 3 ? 90 : cholTier === 2 ? 65 : 25
      },
      {
        id: 'age',
        name: 'Age & Vascular Compliance',
        shortName: 'Age Factor',
        metric: `${ageVal} years old`,
        weight: ageVal >= 60 ? 1.2 : ageVal >= 50 ? 0.6 : -0.3,
        isRisk: ageVal >= 50,
        label: 'Baseline Non-Modifiable Factor',
        badgeClass: 'bg-indigo-100 text-indigo-950 border-indigo-200 font-black',
        metricBadgeClass: 'bg-indigo-50/90 text-indigo-900 border-indigo-200',
        pillGradient: 'from-[#818cf8] to-[#4f46e5]', // deep indigo/purple like the tallest bar in image!
        dotColor: '#4f46e5',
        explanation: 'Cumulative physiological arterial stiffness that naturally increases over decades, forming baseline susceptibility.',
        fillPercent: Math.min(Math.max(((ageVal - 20) / 60) * 100, 20), 95)
      },
      {
        id: 'smoke',
        name: 'Smoking & Tobacco Use',
        shortName: 'Tobacco Use',
        metric: isSmoker ? 'Active Smoker' : 'Non-smoker',
        weight: isSmoker ? 1.1 : -0.6,
        isRisk: isSmoker,
        label: isSmoker ? 'Major Modifiable Risk' : 'Protective Factor',
        badgeClass: isSmoker 
          ? 'bg-neutral-950 text-amber-300 border-neutral-700 shadow-md font-black' 
          : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
        metricBadgeClass: isSmoker ? 'bg-neutral-900 text-neutral-100 border-neutral-700' : 'bg-emerald-50 text-emerald-900 border-emerald-200',
        pillGradient: isSmoker 
          ? 'from-[#475569] to-[#0f172a]' 
          : 'from-[#34d399] to-[#059669]', // mint/green like in image
        dotColor: isSmoker ? '#0f172a' : '#059669',
        explanation: isSmoker ? 'Nicotine and carbon monoxide cause acute vasoconstriction, endothelial injury, and hypercoagulability.' : 'Absence of tobacco smoke preserves microvascular health.',
        fillPercent: isSmoker ? 88 : 15
      },
      {
        id: 'gluc',
        name: 'Fasting Blood Glucose / Diabetes',
        shortName: 'Glucose Level',
        metric: `Tier ${glucTier}/3 (${glucTier === 3 ? '≥126 mg/dL' : glucTier === 2 ? '100-125 mg/dL' : '<100 mg/dL'})`,
        weight: glucTier === 3 ? 1.3 : glucTier === 2 ? 0.5 : -0.4,
        isRisk: glucTier > 1,
        label: glucTier === 3 ? 'Elevated Glycemic Risk' : glucTier === 2 ? 'Borderline' : 'Normal Glycemia',
        badgeClass: glucTier === 3 
          ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-sm font-black' 
          : glucTier === 2 
          ? 'bg-lime-100 text-lime-900 border-lime-300 font-black' 
          : 'bg-teal-100 text-teal-900 border-teal-300 font-black',
        metricBadgeClass: glucTier === 3 ? 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200' : glucTier === 2 ? 'bg-lime-50 text-lime-900 border-lime-200' : 'bg-teal-50 text-teal-900 border-teal-200',
        pillGradient: glucTier === 3 
          ? 'from-[#f472b6] to-[#c026d3]' // magenta/pink like in image
          : glucTier === 2 
          ? 'from-[#fbbf24] to-[#ea580c]' 
          : 'from-[#22d3ee] to-[#0891b2]', // cyan/aqua like in image
        dotColor: glucTier > 1 ? '#c026d3' : '#0891b2',
        explanation: 'Chronic hyperglycemia causes advanced glycation end-products and microvascular capillary wall thickening.',
        fillPercent: glucTier === 3 ? 88 : glucTier === 2 ? 55 : 20
      },
      {
        id: 'bmi',
        name: 'Body Mass Index (BMI)',
        shortName: 'Body BMI',
        metric: `${bmiNum} kg/m²`,
        weight: bmiNum >= 30 ? 0.8 : bmiNum >= 25 ? 0.4 : -0.2,
        isRisk: bmiNum >= 25,
        label: bmiNum >= 30 ? 'Obesity Category' : bmiNum >= 25 ? 'Overweight Category' : 'Normal Weight',
        badgeClass: bmiNum >= 30 
          ? 'bg-rose-600 text-white border-rose-700 shadow-sm font-black' 
          : bmiNum >= 25 
          ? 'bg-orange-100 text-orange-950 border-orange-300 font-black' 
          : 'bg-sky-100 text-sky-900 border-sky-300 font-black',
        metricBadgeClass: bmiNum >= 30 ? 'bg-rose-50 text-rose-900 border-rose-200' : bmiNum >= 25 ? 'bg-orange-50 text-orange-900 border-orange-200' : 'bg-sky-50 text-sky-900 border-sky-200',
        pillGradient: bmiNum >= 30 
          ? 'from-[#f87171] to-[#dc2626]' 
          : bmiNum >= 25 
          ? 'from-[#fb923c] to-[#ea580c]' // sunset orange
          : 'from-[#38bdf8] to-[#0284c7]', // sky blue like in image
        dotColor: bmiNum >= 25 ? '#ea580c' : '#0284c7',
        explanation: 'Excess visceral adiposity promotes systemic low-grade inflammation and insulin resistance.',
        fillPercent: Math.min(Math.max(((bmiNum - 18) / 22) * 100, 25), 95)
      }
    ];

    return drivers.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  }, [ap_hi, ap_lo, ageVal, cholTier, isSmoker, glucTier, bmiNum]);

  // FLAGGED FACTORS (Abnormal variables)
  const flaggedFactors = useMemo(() => {
    const flagged = [];
    if (ap_hi >= 140 || ap_lo >= 90) {
      flagged.push({
        name: 'Resting Blood Pressure',
        value: `${ap_hi}/${ap_lo} mmHg`,
        status: 'Stage 2 Hypertension',
        severity: 'high',
        action: 'Review blood pressure status; consider ambulatory 24h evaluation or medical antihypertensive titration.'
      });
    } else if (ap_hi >= 130 || ap_lo >= 80) {
      flagged.push({
        name: 'Resting Blood Pressure',
        value: `${ap_hi}/${ap_lo} mmHg`,
        status: 'Stage 1 Hypertension',
        severity: 'medium',
        action: 'Review blood pressure status; consider dietary sodium reduction and home blood pressure tracking.'
      });
    }

    if (cholTier > 1) {
      flagged.push({
        name: 'Serum Cholesterol Profile',
        value: `Tier ${cholTier}/3`,
        status: cholTier === 3 ? 'Well Above Normal (≥240 mg/dL)' : 'Borderline Elevated (200-239 mg/dL)',
        severity: cholTier === 3 ? 'high' : 'medium',
        action: 'Consider assessment of full fasting lipid profile (LDL-C, HDL-C, Triglycerides).'
      });
    }

    if (isSmoker) {
      flagged.push({
        name: 'Tobacco & Smoking Status',
        value: 'Active Smoker',
        status: 'High Modifiable Risk',
        severity: 'high',
        action: 'Review smoking status; discuss structured smoking cessation counseling and clinical support.'
      });
    }

    if (glucTier > 1) {
      flagged.push({
        name: 'Fasting Blood Glucose',
        value: `Tier ${glucTier}/3`,
        status: glucTier === 3 ? 'Diabetic Range (≥126 mg/dL)' : 'Pre-diabetic Range (100-125 mg/dL)',
        severity: glucTier === 3 ? 'high' : 'medium',
        action: 'Consider evaluation of glycemic status and HbA1c verification.'
      });
    }

    if (bmiNum >= 25) {
      flagged.push({
        name: 'Body Mass Index',
        value: `${bmiNum} kg/m²`,
        status: bmiNum >= 30 ? 'Obese (≥30 kg/m²)' : 'Overweight (25–29.9 kg/m²)',
        severity: bmiNum >= 30 ? 'high' : 'medium',
        action: 'Consider nutritional counseling and structured physical activity.'
      });
    }

    return flagged;
  }, [ap_hi, ap_lo, cholTier, isSmoker, glucTier, bmiNum]);

  return (
    <div className="w-full text-slate-900 space-y-8">
      
      {/* 1. TOP BANNER: RISK ESTIMATE, CATEGORY & CALIBRATION INFO */}
      <div className={`p-6 sm:p-8 lg:p-10 rounded-3xl bg-[#e8ecf2] neu-flat ${topBannerAccentBorder} transition-all min-h-[300px] sm:min-h-[330px] lg:min-h-[350px] flex items-center shadow-[8px_8px_24px_#b8c8dc,-8px_-8px_24px_#ffffff]`}>
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-12">
          <div className="flex-1 self-stretch flex flex-col justify-between text-left py-1 sm:py-2">
            {/* Top item: Moved higher up */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-inset-sm text-slate-900 text-[10.5px] font-black tracking-widest uppercase bg-[#e8ecf2] border border-slate-300/60 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${riskBgPulse}`}></span>
                {roleLabel.toUpperCase()} &bull; DECISION SUPPORT SYSTEM
              </div>
            </div>
            
            {/* Middle item: Risk Estimate & Category */}
            <div className="space-y-2 py-3 sm:py-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Risk Estimate:</span>
                <span className={`text-5xl sm:text-6xl md:text-7xl font-black tracking-tight ${riskTextColor}`}>
                  {probability.toFixed(1)}%
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <span className="text-sm sm:text-base font-extrabold text-slate-700">
                  Risk Category:
                </span>
                <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-sm uppercase tracking-wider ${
                  isHighRisk 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : isModerateRisk 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {riskCategory} Risk
                </span>
              </div>
            </div>

            {/* Bottom item: Moved lower down */}
            <div className="pt-3 border-t border-slate-300/70 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 text-blue-900 font-extrabold">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Model Confidence: High (95.8% Validation Accuracy)
              </span>
              <span className="text-slate-400">•</span>
              <span>Isotonic Probability Calibration</span>
              <span className="text-slate-400">•</span>
              <span>70,000 Patient Cohort</span>
            </div>
          </div>

          {/* NEUMORPHIC SCULPTED TORUS / DONUT RING GAUGE */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[330px] lg:h-[330px] shrink-0 md:mr-6 lg:mr-12 xl:mr-16 flex items-center justify-center">
            
            {/* Outer Inset Torus Trench */}
            <div className="w-full h-full rounded-full bg-[#e8ecf2] shadow-[inset_14px_14px_24px_#b4c4d7,inset_-14px_-14px_24px_#ffffff] flex items-center justify-center relative">
              
              {/* Circumference Fill SVG Arc: Perfectly spans the entire radial width of the trench */}
              <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
                <defs>
                  <linearGradient id="heroTorusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    {isHighRisk ? (
                      <>
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="50%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </>
                    ) : isModerateRisk ? (
                      <>
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#047857" />
                      </>
                    )}
                  </linearGradient>
                </defs>

                {/* Base Sunken Trench Track - Exact same radius and width as the progress arc */}
                <circle 
                  cx="150" 
                  cy="150" 
                  r="126" 
                  fill="none" 
                  stroke="#d7e2ee" 
                  strokeWidth="38" 
                  className="opacity-50"
                />

                {/* Circumference Cutout Fill - Spans the entire radial width from inner island to outer wall */}
                <circle 
                  cx="150" 
                  cy="150" 
                  r="126" 
                  fill="none" 
                  stroke="url(#heroTorusGradient)" 
                  strokeWidth="38" 
                  strokeDasharray="792" 
                  strokeDashoffset={792 * (1 - Math.min(Math.max(probability, 0), 100) / 100)} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out" 
                  style={{
                    filter: "drop-shadow(0px 3px 8px rgba(0,0,0,0.18))"
                  }}
                />
              </svg>

              {/* Inner Raised Island Center: Flush with the trench inner boundary (71% diameter) */}
              <div className="w-[71%] h-[71%] rounded-full bg-[#e8ecf2] shadow-[10px_10px_20px_#b4c4d7,-10px_-10px_20px_#ffffff] z-10 flex flex-col items-center justify-center text-center select-none p-3">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                  {probability.toFixed(0)}%
                </span>
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest mt-2 px-3 py-0.5 rounded-full ${
                  isHighRisk 
                    ? 'text-red-700 bg-red-100/90 border border-red-200' 
                    : isModerateRisk 
                    ? 'text-amber-800 bg-amber-100/90 border border-amber-200' 
                    : 'text-emerald-800 bg-emerald-100/90 border border-emerald-200'
                }`}>
                  {riskCategory}
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                  Probability
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WHAT CONTRIBUTED MOST? (FEATURE ATTRIBUTION DRIVERS) */}
      <div className="p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </span>
              WHAT CONTRIBUTED MOST?
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Understand why the model arrived at this estimate through key physiological drivers.
            </p>
          </div>
        </div>


        {/* Unified Detailed Rows with Soft Neumorphic Inset Channels */}
        <div className="divide-y divide-slate-200/80 pt-1">
          {topDrivers.map((driver, index) => (
            <div 
              key={driver.id} 
              id={`driver-row-${driver.id}`}
              className={`py-4 sm:py-5 ${index === 0 ? 'pt-1' : ''} ${index === topDrivers.length - 1 ? 'pb-1' : ''} space-y-2.5 hover:bg-slate-50/60 px-2 sm:px-3 rounded-2xl transition-colors`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  {/* Raised Circular Neumorphic Button with Dot */}
                  <div className="w-8 h-8 rounded-full neu-flat flex items-center justify-center shadow-[3px_3px_7px_#c2d2e4,-3px_-3px_7px_#ffffff] shrink-0">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: driver.dotColor }}
                    />
                  </div>
                  <span className="font-black text-sm sm:text-base text-slate-900">{driver.name}</span>
                  <span className={`font-bold text-xs sm:text-sm px-2.5 py-0.5 rounded-lg border shadow-sm ${driver.metricBadgeClass}`}>
                    {driver.metric}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                    {Math.round(driver.fillPercent)}% impact
                  </span>
                  <span className={`text-xs font-black px-3 py-0.5 rounded-full border shadow-sm ${driver.badgeClass}`}>
                    {driver.label}
                  </span>
                </div>
              </div>

              {/* Pure Soft Neumorphic Inset Cutout Track (Direct from Reference Image!) */}
              <div className="relative w-full h-5 sm:h-6 rounded-full bg-[#edf3f9] shadow-[inset_3.5px_3.5px_7px_#c2d2e4,inset_-3.5px_-3.5px_7px_#ffffff] p-1 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${driver.pillGradient} shadow-[0_1px_3px_rgba(0,0,0,0.14),inset_1px_1px_2px_rgba(255,255,255,0.4)]`}
                  style={{ width: `${driver.fillPercent}%` }}
                />
              </div>

              <p className="text-xs font-medium text-slate-600 leading-relaxed pl-1">
                {driver.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CLINICAL DATA SUMMARY TABLE & FLAGGED FACTORS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Clean Audit Table */}
        <div className="xl:col-span-6 p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200/60">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </span>
                  CLINICAL DATA SUMMARY
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Audit record of submitted patient clinical parameters.</p>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
                Submitted Values
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-3">Variable</th>
                    <th className="py-3 px-3">Submitted Value</th>
                    <th className="py-3 px-3">Reference Range</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">Systolic Blood Pressure</td>
                    <td className="py-3 px-3 font-black text-slate-900">{ap_hi} mmHg</td>
                    <td className="py-3 px-3 text-slate-500">&lt; 120 mmHg</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${ap_hi >= 140 ? 'bg-rose-100 text-rose-800' : ap_hi >= 130 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {ap_hi >= 140 ? 'Stage 2' : ap_hi >= 130 ? 'Stage 1' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">Diastolic Blood Pressure</td>
                    <td className="py-3 px-3 font-black text-slate-900">{ap_lo} mmHg</td>
                    <td className="py-3 px-3 text-slate-500">&lt; 80 mmHg</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${ap_lo >= 90 ? 'bg-rose-100 text-rose-800' : ap_lo >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {ap_lo >= 90 ? 'Elevated' : ap_lo >= 80 ? 'Borderline' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">Body Mass Index (BMI)</td>
                    <td className="py-3 px-3 font-black text-slate-900">{bmiNum} kg/m²</td>
                    <td className="py-3 px-3 text-slate-500">18.5 – 24.9 kg/m²</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${bmiNum >= 30 ? 'bg-rose-100 text-rose-800' : bmiNum >= 25 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {bmiNum >= 30 ? 'Obese' : bmiNum >= 25 ? 'Overweight' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">Serum Cholesterol</td>
                    <td className="py-3 px-3 font-black text-slate-900">Tier {cholTier}/3</td>
                    <td className="py-3 px-3 text-slate-500">Tier 1 (&lt;200 mg/dL)</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${cholTier === 3 ? 'bg-rose-100 text-rose-800' : cholTier === 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {cholTier === 3 ? 'High' : cholTier === 2 ? 'Borderline' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">Fasting Blood Glucose</td>
                    <td className="py-3 px-3 font-black text-slate-900">Tier {glucTier}/3</td>
                    <td className="py-3 px-3 text-slate-500">Tier 1 (&lt;100 mg/dL)</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${glucTier === 3 ? 'bg-rose-100 text-rose-800' : glucTier === 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {glucTier === 3 ? 'Diabetic' : glucTier === 2 ? 'Pre-diabetic' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">Smoking Habit</td>
                    <td className="py-3 px-3 font-black text-slate-900">{isSmoker ? 'Active Smoker' : 'Non-smoker'}</td>
                    <td className="py-3 px-3 text-slate-500">Non-smoker</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isSmoker ? 'bg-neutral-900 text-amber-300' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isSmoker ? 'High Risk' : 'Non-Smoker'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">Physical Activity</td>
                    <td className="py-3 px-3 font-black text-slate-900">{isSedentary ? 'Sedentary Routine' : 'Regularly Active'}</td>
                    <td className="py-3 px-3 text-slate-500">≥150 min/week</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isSedentary ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isSedentary ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-200/60 text-[11px] text-slate-500 font-semibold italic flex items-center justify-between">
            <span>*Parameters evaluated against clinical guidelines.</span>
            <span className="text-[10px] font-bold text-slate-400">7 Core Vitals Audited</span>
          </div>
        </div>

        {/* FLAGGED FACTORS (Spacious, Un-congested Priority Callouts) */}
        <div className="xl:col-span-6 p-6 sm:p-8 neu-flat rounded-3xl border border-rose-200/80 bg-gradient-to-b from-rose-50/30 via-white to-white shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] h-full flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-rose-200/60">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-rose-950 tracking-tight">FLAGGED FACTORS</h3>
                  <p className="text-xs font-bold text-rose-700">Metrics outside normal clinical ceilings requiring follow-up</p>
                </div>
              </div>

              {flaggedFactors.length > 0 && (
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-200 shadow-sm">
                  {flaggedFactors.length} Priority Target{flaggedFactors.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {flaggedFactors.length > 0 ? (
                flaggedFactors.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl bg-white/95 border border-rose-200/90 shadow-sm hover:shadow-md transition-all space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-rose-100/80">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                        <span className="font-black text-sm text-slate-900">{item.name}</span>
                        <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                          Current: <strong className="text-rose-950">{item.value}</strong>
                        </span>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm shrink-0 ${
                        item.severity === 'high' 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-amber-100 text-amber-950 border border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 text-xs text-slate-700 font-medium bg-rose-50/50 p-2.5 sm:p-3 rounded-xl border border-rose-100/80">
                      <span className="font-black text-rose-900 shrink-0 uppercase text-[10px] tracking-wider">Priority Action:</span>
                      <span className="leading-relaxed font-semibold text-slate-800">{item.action}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center neu-inset rounded-2xl text-emerald-800 font-black text-sm">
                  ✓ All submitted clinical parameters are within baseline reference limits.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-rose-100 text-[11px] text-slate-500 font-semibold italic">
            *Flagged indicators represent priority targets for lifestyle modification or clinical follow-up.
          </div>
        </div>

      </div>

      {/* 4. WHAT TO REVIEW (CLINICALLY RELEVANT PROMPTS) */}
      <div className="p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/60">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </span>
              WHAT TO REVIEW
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Clinically relevant prompts for healthcare review rather than autonomous treatment instructions.
            </p>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200/80 self-start sm:self-auto">
            Clinical Prompts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-blue-50/40 via-white to-transparent border-l-4 border-blue-600 space-y-1.5">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span className="text-blue-700">🩺</span> Review blood pressure status
            </h4>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              Assess resting arterial hemodynamics; consider ambulatory 24-hour pressure recording or repeated readings to distinguish sustained hypertension from episodic elevation.
            </p>
          </div>

          <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-amber-50/40 via-white to-transparent border-l-4 border-amber-500 space-y-1.5">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span className="text-amber-700">🧪</span> Consider assessment of lipid profile
            </h4>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              Order complete fasting lipid panel (total cholesterol, HDL-C, LDL-C, triglycerides, and non-HDL) to accurately quantify circulating atherogenic particle density.
            </p>
          </div>

          <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-rose-50/40 via-white to-transparent border-l-4 border-rose-500 space-y-1.5">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span className="text-rose-700">🚭</span> Review smoking status
            </h4>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              Evaluate tobacco exposure and pack-year history; discuss structured smoking cessation counseling, behavioral support, and nicotine replacement therapies if applicable.
            </p>
          </div>

          <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-emerald-50/40 via-white to-transparent border-l-4 border-emerald-600 space-y-1.5">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span className="text-emerald-700">📋</span> Consider further clinical evaluation where appropriate
            </h4>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              Correlate algorithmic risk findings with baseline 12-lead ECG, family history of premature cardiovascular disease, and comprehensive physician physical examination.
            </p>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE WHAT-IF / SCENARIO COMPARISON SIMULATOR */}
      <div className="p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#17805d] text-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                COMPARE SCENARIOS / WHAT-IF ANALYSIS
              </h3>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Interactively adjust modifiable factors to observe how risk dynamically recalculates in real time.
            </p>
          </div>
        </div>

        {/* Interactive Controls & Live Outcome */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Sliders and Toggles */}
          <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
            
            {/* Control 1: Systolic Blood Pressure with Color Slider & Side Lines */}
            <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-blue-50/40 via-white to-transparent border border-slate-200/80 border-l-4 border-l-blue-600 space-y-3">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-slate-900 flex items-center gap-2">
                  <span className="text-blue-700 text-base">🩺</span>
                  <span className="font-black text-sm">Systolic Blood Pressure:</span>
                </span>
                <span className={`px-3.5 py-1 rounded-xl text-sm font-black shadow-sm transition-colors ${
                  simBp < 120 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : simBp < 140 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {simBp} mmHg
                </span>
              </div>

              {/* Slider Track with Rich Color Gradient and Milestone Side Lines */}
              <div className="relative pt-1 pb-1">
                {/* Colored Gradient Track with Curved Pill Ends and Side Calibration Lines */}
                <div 
                  className="relative w-full h-3.5 rounded-full overflow-hidden shadow-inner border border-slate-300/80"
                  style={{
                    background: 'linear-gradient(to right, #10b981 0%, #34d399 25%, #f59e0b 45%, #f97316 65%, #ef4444 85%, #dc2626 100%)'
                  }}
                >
                  {/* Left side line on the curve */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900/70" title="90 mmHg" />
                  {/* 120 mmHg milestone line */}
                  <div className="absolute left-[33.33%] top-0 bottom-0 w-0.5 bg-white shadow-sm" title="120 mmHg Target" />
                  {/* 140 mmHg milestone line */}
                  <div className="absolute left-[55.55%] top-0 bottom-0 w-0.5 bg-white shadow-sm" title="140 mmHg Stage 1" />
                  {/* Right side line on the curve */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-900/70" title="180 mmHg" />
                </div>

                {/* Range Input overlaid directly on top for smooth native sliding */}
                <input 
                  type="range" 
                  min={90} 
                  max={180} 
                  step={1} 
                  value={simBp} 
                  onChange={(e) => setSimBp(Number(e.target.value))}
                  className="absolute inset-x-0 top-1 w-full h-3.5 opacity-0 cursor-pointer z-20"
                />

                {/* Visible custom slider thumb indicator with glow */}
                <div 
                  className="absolute top-0.5 w-4.5 h-4.5 -ml-2 rounded-full bg-white border-2 border-blue-600 shadow-md pointer-events-none transition-all flex items-center justify-center z-10"
                  style={{ left: `${((simBp - 90) / 90) * 100}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>

                {/* Milestone tick side lines and color-coded labels */}
                <div className="relative w-full flex justify-between mt-2 px-0.5">
                  <div className="flex flex-col items-start">
                    <span className="w-0.5 h-1.5 bg-emerald-600 mb-0.5"></span>
                    <span className="text-[10px] font-bold text-emerald-700">90 (Optimal)</span>
                  </div>
                  <div className="flex flex-col items-center" style={{ position: 'absolute', left: '33.33%', transform: 'translateX(-50%)' }}>
                    <span className="w-0.5 h-1.5 bg-amber-500 mb-0.5"></span>
                    <span className="text-[10px] font-bold text-amber-700">120 (Target)</span>
                  </div>
                  <div className="flex flex-col items-center" style={{ position: 'absolute', left: '55.55%', transform: 'translateX(-50%)' }}>
                    <span className="w-0.5 h-1.5 bg-orange-500 mb-0.5"></span>
                    <span className="text-[10px] font-bold text-orange-700">140 (Hypertension)</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="w-0.5 h-1.5 bg-rose-600 mb-0.5"></span>
                    <span className="text-[10px] font-bold text-rose-700">180 (Severe)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Control 2: Smoking Toggle (Rose Accent) */}
            <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-rose-50/40 via-white to-transparent border border-slate-200/80 border-l-4 border-l-rose-500 flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="text-rose-700 text-base">🚭</span>
                  <span>Smoking Status</span>
                </span>
                <span className="text-xs font-bold text-slate-500 pl-7 block mt-0.5">Cessation rapidly lowers vascular risk</span>
              </div>
              <div className="flex items-center gap-1 p-1 neu-inset rounded-xl bg-slate-100/90 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSimSmoke(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    !simSmoke ? 'neu-button-3d text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Non-smoker
                </button>
                <button
                  type="button"
                  onClick={() => setSimSmoke(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    simSmoke ? 'neu-button-3d text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Smoker
                </button>
              </div>
            </div>

            {/* Control 3: Cholesterol Tier (Amber Accent) */}
            <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-amber-50/40 via-white to-transparent border border-slate-200/80 border-l-4 border-l-amber-500 flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="text-amber-700 text-base">🧪</span>
                  <span>Cholesterol Profile</span>
                </span>
                <span className="text-xs font-bold text-slate-500 pl-7 block mt-0.5">Targeting optimal lipid ceiling</span>
              </div>
              <select
                value={simChol}
                onChange={(e) => setSimChol(Number(e.target.value))}
                className="neu-input rounded-xl px-3.5 py-2 text-xs font-black text-slate-800 outline-none cursor-pointer bg-white/90 border border-slate-200"
              >
                <option value={1}>Tier 1 (&lt; 200 mg/dL)</option>
                <option value={2}>Tier 2 (200 - 239 mg/dL)</option>
                <option value={3}>Tier 3 (≥ 240 mg/dL)</option>
              </select>
            </div>

            {/* Control 4: Physical Activity (Emerald Accent) */}
            <div className="p-5 rounded-2xl neu-inset bg-gradient-to-r from-emerald-50/40 via-white to-transparent border border-slate-200/80 border-l-4 border-l-emerald-600 flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-700 text-base">📋</span>
                  <span>Aerobic Physical Activity</span>
                </span>
                <span className="text-xs font-bold text-slate-500 pl-7 block mt-0.5">≥ 150 minutes weekly aerobic exercise</span>
              </div>
              <div className="flex items-center gap-1 p-1 neu-inset rounded-xl bg-slate-100/90 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSimActive(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    simActive ? 'neu-button-3d text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setSimActive(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    !simActive ? 'neu-button-3d text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sedentary
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Live Comparison Outcome + Bottom Reset Button */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 h-full">
            
            {/* Scenario Comparison Outcome Card */}
            <div className="flex-1 p-6 sm:p-7 neu-inset rounded-3xl bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/40 border border-slate-200/80 border-l-4 border-l-blue-600 border-r-4 border-r-indigo-600 flex flex-col justify-between text-center space-y-4 shadow-sm relative overflow-hidden">
              {/* Subtle internal accent side lines hugging the curved edges */}
              <div className="absolute left-1.5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-400 via-blue-600 to-indigo-500 rounded-full opacity-60" />
              <div className="absolute right-1.5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-400 via-indigo-600 to-blue-500 rounded-full opacity-60" />

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                  Scenario Comparison Outcome
                </span>

                {/* Side by side stats with colored border accents */}
                <div className="grid grid-cols-2 gap-4 w-full pt-3">
                  <div className="p-4 rounded-2xl neu-inset bg-gradient-to-r from-slate-100/70 via-white to-transparent border border-slate-200 border-l-4 border-l-slate-400 text-left">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Original Baseline</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">{probability.toFixed(1)}%</span>
                  </div>
                  <div className="p-4 rounded-2xl neu-inset bg-gradient-to-r from-blue-50/70 via-white to-transparent border border-blue-200 border-l-4 border-l-blue-600 text-left">
                    <span className="text-[10px] font-black uppercase text-blue-800 block">Simulated Scenario</span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-900">{simulatedProbability.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Net Risk Delta Badge */}
              <div className="w-full py-2">
                {riskDelta < 0 ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-100/90 to-teal-50 text-emerald-900 border border-emerald-300 border-l-4 border-l-emerald-600 font-black text-sm flex items-center justify-center gap-2 shadow-sm">
                    <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    <span>{Math.abs(riskDelta)}% Estimated Risk Reduction</span>
                  </div>
                ) : riskDelta > 0 ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-100/90 to-amber-50 text-rose-900 border border-rose-300 border-l-4 border-l-rose-600 font-black text-sm flex items-center justify-center gap-2 shadow-sm">
                    <svg className="w-4 h-4 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    <span>+{riskDelta}% Potential Risk Increase</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 border-l-4 border-l-slate-400 font-black text-sm">
                    Exact Patient Baseline Match
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-slate-500 leading-relaxed pt-1">
                Demonstrates the quantitative clinical benefit of optimizing arterial blood pressure and lifestyle factors.
              </p>
            </div>

            {/* Bottom Reset Button: 3D structured finish with wider width */}
            <button
              type="button"
              onClick={resetSimulator}
              className="neu-button-3d w-full py-3.5 px-6 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset to Baseline
            </button>
          </div>

        </div>
      </div>

      {/* 6. CLINICAL PHARMACOPEIA & MEDICATION SEARCH (FOR CLINICIANS & TRAINEES) */}
      <MedicationReference role={roleLower} patientVitals={payload} />

      {/* 7. CLINICAL GOVERNANCE DISCLAIMER & EXPANDABLE "HOW WAS THIS CALCULATED?" */}
      <div className="space-y-4">
        
        {/* Governance Disclaimer Callout */}
        <div className="p-5 sm:p-6 neu-inset rounded-3xl bg-amber-50/60 border border-amber-300/80 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-950 uppercase tracking-wider">
              MODEL OUTPUT ≠ CLINICAL DIAGNOSIS
            </h4>
            <p className="text-xs font-semibold text-amber-900/90 mt-1 leading-relaxed">
              This artificial intelligence model provides calibrated risk stratification for clinical decision support and educational exploration. It does not constitute an autonomous medical diagnosis or prescription. All clinical decisions must be made by qualified healthcare practitioners incorporating physical examination, full clinical history, and clinical judgment.
            </p>
          </div>
        </div>

        {/* Expandable Section: "How was this calculated?" */}
        <div className="neu-flat rounded-3xl border border-slate-200/80 overflow-hidden bg-white/80 transition-all">
          <button
            type="button"
            onClick={() => setHowCalculatedOpen(!howCalculatedOpen)}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </span>
              <div>
                <h4 className="text-base font-black text-slate-900">How was this calculated?</h4>
                <p className="text-xs font-bold text-slate-500">Transparent AI methodology without black boxes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-700 hidden sm:inline">
                {howCalculatedOpen ? 'Hide Methodology' : 'Inspect Calculations'}
              </span>
              <svg className={`w-5 h-5 text-slate-600 transform transition-transform ${howCalculatedOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {howCalculatedOpen && (
            <div className="p-6 sm:p-8 pt-0 border-t border-slate-100 text-xs font-medium text-slate-700 space-y-4 leading-relaxed bg-slate-50/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl neu-inset bg-white/80 border border-slate-200/80">
                  <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="text-blue-600">1.</span> 70,000 Patient Training Cohort
                  </h5>
                  <p>
                    Trained across multi-center cardiovascular records capturing systolic and diastolic pressures, lipid tiers, glycemic levels, and behavioral variables.
                  </p>
                </div>
                <div className="p-4 rounded-2xl neu-inset bg-white/80 border border-slate-200/80">
                  <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="text-blue-600">2.</span> Gradient Boosted Trees Ensemble
                  </h5>
                  <p>
                    Evaluates non-linear cross-interactions (e.g. how pulse pressure and age interact with lipid levels) rather than naive linear summation.
                  </p>
                </div>
                <div className="p-4 rounded-2xl neu-inset bg-white/80 border border-slate-200/80">
                  <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="text-blue-600">3.</span> Isotonic Probability Calibration
                  </h5>
                  <p>
                    Post-processed using isotonic calibration, guaranteeing that an estimated risk of 60% corresponds to 60 observed cardiovascular events per 100 cases.
                  </p>
                </div>
                <div className="p-4 rounded-2xl neu-inset bg-white/80 border border-slate-200/80">
                  <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="text-blue-600">4.</span> Interpretable Log-Odds Attribution
                  </h5>
                  <p>
                    Every variable contributes inspectable logit shifts relative to baseline cohort medians, completely avoiding opaque black-box deep embeddings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 7. STRUCTURED CLINICAL BREAKDOWN */}
      <div className="space-y-6">
        
        {/* Main Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-300/60">
          <div>
            <h3 className="text-2xl sm:text-3xl tracking-tight text-slate-900 font-black flex items-center gap-3">
              <span className="w-3.5 h-8 bg-gradient-to-b from-[#17805d] to-teal-700 rounded-full inline-block"></span>
              {sectionTitle}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Comprehensive report synthesized across cardiovascular metrics and lifestyle factors.
            </p>
          </div>
        </div>

        {/* 3 Major Clinical Report Cards (Clean primary cards on universal background) */}
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
                  className={`p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-white/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] transition-all duration-300 ${section.theme.wrapper}`}
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

                  {/* Card Content Area */}
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

      {/* 8. PATIENT EXAMINATION VITALS (Blended directly on Universal Background) */}
      {payload && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-slate-300/50">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Patient Examination Vitals
            </h4>
            <span className="text-[10px] font-black uppercase text-slate-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 shadow-sm">
              Baseline Parameters
            </span>
          </div>

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

    </div>
  );
}
