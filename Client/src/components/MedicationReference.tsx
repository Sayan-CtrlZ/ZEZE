"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, GraduationCap, Pill, RotateCw, X, Sparkles, ShieldAlert, CheckCircle2, Clock, Info, BookOpen, Stethoscope, ArrowRight } from 'lucide-react';

export interface Medication {
  id: string;
  name: string;
  brandNames: string;
  category: 'antihypertensive' | 'lipid' | 'metabolic' | 'antiplatelet' | 'lifestyle' | string;
  drugClass: string;
  frequency: 'Once Daily (OD)' | 'Twice Daily (BD)' | 'Once Weekly (OW)' | 'As Needed (PRN)' | string;
  timing: string;
  typicalDose: string;
  indications: string[];
  commonSideEffects: string[];
  seriousAdverseEffects: string[];
  contraindications: string[];
  monitoring: string[];
  guidelineSources: {
    org: 'FDA' | 'ACC/AHA' | 'WHO' | 'NICE' | 'ADA/EASD' | 'USPSTF' | 'AHA' | string;
    badge: string;
    recommendation: string;
  }[];
  mechanismOfAction: string;
  traineePearls: string;
  patientIndication?: string;
  urgencyOrPriority?: string;
}

const MEDICATION_DATABASE: Medication[] = [
  {
    id: 'amlodipine',
    name: 'Amlodipine',
    brandNames: 'Norvasc, Katerzia',
    category: 'antihypertensive',
    drugClass: 'Dihydropyridine Calcium Channel Blocker (CCB)',
    frequency: 'Once Daily (OD)',
    timing: 'Take once daily, morning or evening, with or without food',
    typicalDose: 'Initial: 5 mg PO once daily. Titrate to maximum 10 mg PO once daily after 1–2 weeks if blood pressure target is unmet.',
    indications: ['Essential Hypertension', 'Chronic Stable Angina', 'Vasospastic (Prinzmetal) Angina'],
    commonSideEffects: ['Peripheral ankle edema (dose-dependent)', 'Headache', 'Flushing & warmth', 'Dizziness', 'Fatigue'],
    seriousAdverseEffects: ['Severe symptomatic hypotension', 'Worsening angina/myocardial infarction upon initiation or dose titration (rare)', 'Reflex tachycardia'],
    contraindications: ['Hypersensitivity to amlodipine or other dihydropyridines', 'Severe hypotension', 'Cardiogenic shock', 'Clinically significant aortic stenosis'],
    monitoring: ['Resting blood pressure and heart rate (sitting)', 'Assess bilateral lower extremities for dependent edema', 'Evaluate symptom relief if taken for angina'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I Guideline', recommendation: 'Recommended as first-line monotherapy or in combination with ACEi/ARB for Stage 1 or 2 Hypertension.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'FDA approved for reduction of cardiovascular events and blood pressure control.' },
      { org: 'WHO', badge: 'WHO Essential', recommendation: 'Listed on the WHO Model List of Essential Medicines for cardiovascular risk management.' },
      { org: 'NICE', badge: 'NICE NG136', recommendation: 'First-line step 1 treatment for patients aged ≥55 or of African/Caribbean origin.' }
    ],
    mechanismOfAction: 'Inhibits transmembrane influx of extracellular calcium ions into vascular smooth muscle and cardiac myocytes through L-type voltage-sensitive channels. This causes peripheral arterial vasodilation, reducing total peripheral resistance and systemic blood pressure without significant negative inotropy.',
    traineePearls: 'Amlodipine has an exceptionally long plasma elimination half-life (35–50 hours). Forgiving of occasionally delayed doses, but pedal edema is due to precapillary vasodilation rather than volume overload—do not treat with loop diuretics!'
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril',
    brandNames: 'Prinivil, Zestril, Qbrelis',
    category: 'antihypertensive',
    drugClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    frequency: 'Once Daily (OD)',
    timing: 'Take once daily at the same time each morning; maintain consistent hydration',
    typicalDose: 'Initial: 10 mg PO once daily (5 mg if on concurrent diuretic). Titrate to 20–40 mg PO once daily.',
    indications: ['Hypertension', 'Heart Failure with Reduced Ejection Fraction (HFrEF)', 'Post-Myocardial Infarction Survival'],
    commonSideEffects: ['Dry non-productive cough (bradykinin-mediated; occurs in 5–20%)', 'Dizziness / orthostatic lightheadedness', 'Mild hyperkalemia', 'Fatigue'],
    seriousAdverseEffects: ['Angioedema (swelling of face, lips, tongue, or airway; medical emergency)', 'Acute renal impairment in bilateral renal artery stenosis', 'Severe hyperkalemia (K >5.5 mEq/L)'],
    contraindications: ['History of ACEi-induced or hereditary angioedema', 'Pregnancy (Black Box: Teratogenic in 2nd/3rd trimesters)', 'Concurrent use with Sacubitril (must maintain 36-hour washout)', 'Concomitant Aliskiren in diabetic patients'],
    monitoring: ['Serum creatinine and eGFR at baseline and 1–2 weeks post-titration', 'Serum potassium (K+)', 'Resting seated blood pressure'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I Guideline', recommendation: 'First-line choice for hypertension, especially with concomitant diabetes, chronic kidney disease (albuminuria), or heart failure.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for hypertension, adjunctive therapy in heart failure, and acute MI hemodynamics.' },
      { org: 'WHO', badge: 'WHO Essential', recommendation: 'Essential medicine for global primary prevention of ischemic and renal events.' }
    ],
    mechanismOfAction: 'Competitively inhibits angiotensin-converting enzyme (ACE), preventing conversion of Angiotensin I to the vasoconstrictor Angiotensin II. Suppresses aldosterone secretion, decreasing sodium and water retention, and reduces bradykinin degradation.',
    traineePearls: 'A transient rise in serum creatinine of up to 30% is physiologically expected due to efferent arteriolar vasodilation. Do not immediately stop the drug unless creatinine rise exceeds 30% or potassium exceeds 5.5 mEq/L.'
  },
  {
    id: 'losartan',
    name: 'Losartan',
    brandNames: 'Cozaar',
    category: 'antihypertensive',
    drugClass: 'Angiotensin II Receptor Blocker (ARB)',
    frequency: 'Once Daily (OD)',
    timing: 'Take once daily, or divided twice daily (BD) if higher dose required for 24h coverage',
    typicalDose: 'Initial: 50 mg PO once daily. Range: 25–100 mg PO daily in 1 or 2 divided doses.',
    indications: ['Hypertension', 'Hypertension with Left Ventricular Hypertrophy (Stroke reduction)', 'Diabetic Nephropathy in Type 2 Diabetes'],
    commonSideEffects: ['Dizziness', 'Upper respiratory congestion', 'Back pain', 'Mild hyperkalemia'],
    seriousAdverseEffects: ['Oliguria / acute kidney injury', 'Angioedema (lower incidence than ACEi, but possible)', 'Hyperkalemia'],
    contraindications: ['Pregnancy (Black Box: Fetal toxicity/death)', 'Concurrent Aliskiren in diabetes', 'Severe hepatic impairment'],
    monitoring: ['Renal function panel (BUN, Creatinine, eGFR)', 'Serum electrolytes (Potassium)', 'Blood pressure response'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I Guideline', recommendation: 'Preferred alternative for patients unable to tolerate ACE inhibitors due to dry cough.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for nephropathy progression reduction in diabetic hypertensive patients.' },
      { org: 'WHO', badge: 'WHO Essential', recommendation: 'Essential cardiovascular agent for hypertensive stroke risk reduction.' }
    ],
    mechanismOfAction: 'Selective competitive antagonist at the AT1 angiotensin II receptor subtype. Blocks vasoconstriction, aldosterone release, and cardiac remodeling without inhibiting kinase II (ACE), thereby not causing bradykinin accumulation or cough.',
    traineePearls: 'Losartan has a unique mild uricosuric property (inhibits URAT1 in proximal renal tubules), making it advantageous in hypertensive patients who also suffer from hyperuricemia or gout.'
  },
  {
    id: 'atorvastatin',
    name: 'Atorvastatin',
    brandNames: 'Lipitor',
    category: 'lipid',
    drugClass: 'HMG-CoA Reductase Inhibitor (High-Intensity Statin)',
    frequency: 'Once Daily (OD)',
    timing: 'Take once daily at bedtime or evening with or without food',
    typicalDose: 'Moderate-intensity: 10–20 mg PO once daily. High-intensity: 40–80 mg PO once daily (reduces LDL-C by ≥50%).',
    indications: ['Primary Hyperlipidemia', 'Primary Prevention of ASCVD in high-risk patients', 'Secondary Prevention after Acute Coronary Syndrome or Stroke'],
    commonSideEffects: ['Myalgia (muscle ache/stiffness, ~5%)', 'Mild elevation in transaminases (ALT/AST)', 'Nasopharyngitis', 'Dyspepsia'],
    seriousAdverseEffects: ['Rhabdomyolysis with myoglobinuria and acute renal failure (rare, <0.1%)', 'Hepatotoxicity / clinically significant liver injury', 'Immune-mediated necrotizing myopathy (IMNM)'],
    contraindications: ['Active liver disease or unexplained persistent elevations of hepatic transaminases', 'Pregnancy & Breastfeeding', 'Concomitant strong CYP3A4 inhibitors (e.g. clarithromycin, ketoconazole) at high doses'],
    monitoring: ['Fasting lipid profile (total-C, LDL-C, HDL-C, triglycerides) at 4–12 weeks post-initiation', 'Baseline hepatic transaminases (ALT/AST)', 'Creatine kinase (CK) if severe muscle pain develops'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I High-Intensity', recommendation: 'Cornerstone high-intensity statin therapy recommended for all patients with 10-year ASCVD risk ≥20% or LDL-C ≥190 mg/dL.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for stroke and myocardial infarction risk reduction in adult populations.' },
      { org: 'WHO', badge: 'WHO Essential', recommendation: 'Essential medicine for global atherosclerotic cardiovascular disease prevention.' }
    ],
    mechanismOfAction: 'Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, the rate-limiting enzyme in cholesterol biosynthesis. Decreased hepatic cholesterol upregulates cell-surface LDL receptors, accelerating catabolism and clearance of circulating atherogenic LDL particles.',
    traineePearls: 'Because of its long half-life (~14 hours) and active metabolites (half-life 20–30 hours), Atorvastatin can technically be taken at any time of day, unlike short-acting statins (Simvastatin) which strictly require bedtime dosing.'
  },
  {
    id: 'rosuvastatin',
    name: 'Rosuvastatin',
    brandNames: 'Crestor, Ezallor',
    category: 'lipid',
    drugClass: 'Hydrophilic HMG-CoA Reductase Inhibitor',
    frequency: 'Once Daily (OD)',
    timing: 'Take once daily at any time of day, with or without meals',
    typicalDose: 'Starting: 10–20 mg PO once daily. Titrate to 40 mg PO once daily for high-intensity lipid reduction (≥50% LDL reduction).',
    indications: ['Primary Hypercholesterolemia', 'Mixed Dyslipidemia', 'Primary ASCVD Prevention in high hs-CRP cohorts'],
    commonSideEffects: ['Myalgia', 'Headache', 'Abdominal discomfort', 'Asthenia'],
    seriousAdverseEffects: ['Rhabdomyolysis with acute kidney failure', 'Proteinuria / hematuria (transient at high 40 mg dose)', 'Severe drug-induced hepatitis'],
    contraindications: ['Active liver disease', 'Severe renal impairment (CrCl <30 mL/min: max dose 10 mg)', 'Pregnancy & lactation', 'Concurrent cyclosporine'],
    monitoring: ['Fasting lipid profile at 4–8 weeks', 'Renal function and urine protein in patients on 40 mg', 'Liver function baseline'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I High-Intensity', recommendation: 'High-intensity statin of choice; highly potent hydrophilic alternative for patients experiencing muscle intolerance on lipophilic statins.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for slowing progression of atherosclerosis and coronary event prophylaxis.' },
      { org: 'NICE', badge: 'NICE CG181', recommendation: 'Recommended high-intensity lipid modification therapy.' }
    ],
    mechanismOfAction: 'Potent competitive inhibitor of HMG-CoA reductase. More hydrophilic than atorvastatin, reducing passive diffusion into extrahepatic skeletal muscle tissue, which may reduce myopathy incidence in susceptible individuals.',
    traineePearls: 'Rosuvastatin is minimally metabolized by CYP3A4 (mainly CYP2C9), making it safer with many common cardiac medications (e.g. amlodipine, diltiazem, anticoagulants) compared to atorvastatin or simvastatin.'
  },
  {
    id: 'metformin',
    name: 'Metformin',
    brandNames: 'Glucophage, Fortamet, Glumetza',
    category: 'metabolic',
    drugClass: 'Biguanide Insulin Sensitizer',
    frequency: 'Twice Daily (BD)',
    timing: 'Take twice daily with morning and evening meals to minimize gastrointestinal discomfort',
    typicalDose: 'Initial: 500 mg PO twice daily or 850 mg once daily with meals. Titrate by 500 mg weekly to target 1000 mg twice daily (maximum 2000–2550 mg/day).',
    indications: ['Type 2 Diabetes Mellitus', 'Prediabetes with high ASCVD/metabolic risk', 'Polycystic Ovary Syndrome (off-label)'],
    commonSideEffects: ['Diarrhea & loose stools (usually self-limiting over 2–4 weeks)', 'Nausea & abdominal cramping', 'Metallic taste in mouth', 'Vitamin B12 deficiency (with long-term use)'],
    seriousAdverseEffects: ['Lactic Acidosis (rare, ~3–5 cases per 100,000 patient-years, but high mortality; associated with severe renal hypoperfusion or sepsis)'],
    contraindications: ['Severe renal impairment (eGFR <30 mL/min/1.73 m²)', 'Acute or chronic metabolic acidosis / diabetic ketoacidosis', 'Severe hypoxemia, sepsis, or decompensated heart failure'],
    monitoring: ['eGFR / serum creatinine annually (or every 3–6 months if eGFR 30–59)', 'HbA1c every 3 months until stable, then every 6 months', 'Serum Vitamin B12 levels every 2–3 years'],
    guidelineSources: [
      { org: 'ADA/EASD', badge: 'Standard of Care', recommendation: 'Foundational first-line pharmacotherapy for glycemic control and long-term cardiometabolic risk reduction.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for glycemic control in adult and pediatric type 2 diabetes.' },
      { org: 'WHO', badge: 'WHO Essential', recommendation: 'First-line non-insulin oral agent on WHO Model Essential Medicines.' }
    ],
    mechanismOfAction: 'Activates AMP-activated protein kinase (AMPK) in hepatocytes, suppressing hepatic gluconeogenesis and glycogenolysis. Increases peripheral tissue insulin sensitivity, enhancing glucose uptake in skeletal muscle without stimulating insulin secretion (weight-neutral, zero intrinsic hypoglycemia risk).',
    traineePearls: 'Always hold Metformin prior to iodinated contrast procedures in patients with eGFR 30–60 mL/min or liver disease, resuming 48 hours later only after confirming stable renal function.'
  },
  {
    id: 'empagliflozin',
    name: 'Empagliflozin',
    brandNames: 'Jardiance',
    category: 'metabolic',
    drugClass: 'Sodium-Glucose Cotransporter 2 (SGLT2) Inhibitor',
    frequency: 'Once Daily (OD)',
    timing: 'Take once daily in the morning, with or without breakfast',
    typicalDose: '10 mg PO once daily in the morning. May increase to 25 mg PO once daily for additional glycemic reduction.',
    indications: ['Type 2 Diabetes Mellitus with established ASCVD', 'Heart Failure (both HFrEF and HFpEF across EF spectrum)', 'Chronic Kidney Disease (progression delay)'],
    commonSideEffects: ['Mycotic genital infections (candidiasis, ~5–10%)', 'Increased urinary frequency / mild osmotic diuresis', 'Orthostatic hypotension (mild volume contraction)'],
    seriousAdverseEffects: ['Euglycemic Diabetic Ketoacidosis (euDKA)', 'Urosepsis and pyelonephritis', 'Necrotizing fasciitis of the perineum (Fournier gangrene, very rare)'],
    contraindications: ['Severe hypersensitivity to empagliflozin', 'Patients on hemodialysis or with end-stage renal disease (ESRD)'],
    monitoring: ['Volume status and resting blood pressure (especially elderly or on loop diuretics)', 'Renal function (eGFR)', 'Inspect for signs of genital mycotic infections'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I Guideline', recommendation: 'Recommended with strong evidence to reduce heart failure hospitalization and cardiovascular death in patients with diabetes and cardiovascular disease.' },
      { org: 'ADA/EASD', badge: 'First-Line ASCVD/HF', recommendation: 'Preferred agent for patients with established cardiovascular disease, heart failure, or CKD independent of baseline A1c.' },
      { org: 'FDA', badge: 'Cardiovascular Indication', recommendation: 'FDA approved for reduction of CV death in T2D and HF hospitalizations.' }
    ],
    mechanismOfAction: 'Selectively inhibits SGLT2 in the proximal convoluted renal tubule, reducing renal glucose and sodium reabsorption. Induces glucosuria (reducing plasma glucose) and natriuresis (reducing cardiac preload and afterload), shifting myocardial energetics toward ketone body oxidation.',
    traineePearls: 'Empagliflozin provides profound cardiorenal benefits that are largely independent of glucose lowering! In the EMPA-REG and EMPEROR trials, HF benefits occurred equally in non-diabetic individuals.'
  },
  {
    id: 'aspirin',
    name: 'Aspirin (Low-Dose / Baby Aspirin)',
    brandNames: 'Bayer Aspirin, Ecotrin, Bufferin',
    category: 'antiplatelet',
    drugClass: 'Cyclooxygenase-1 (COX-1) Antiplatelet Agent',
    frequency: 'Once Daily (OD)',
    timing: 'Take once daily with a full glass of water, ideally with a meal to prevent gastric irritation',
    typicalDose: '75–100 mg PO once daily (Standard US formulation: 81 mg enteric-coated PO daily).',
    indications: ['Secondary ASCVD Prevention (post-MI, post-CABG, post-PCI, prior ischemic stroke/TIA)', 'Acute Coronary Syndromes (immediate chewable 324 mg loading)'],
    commonSideEffects: ['Dyspepsia & epigastric distress', 'Easy bruising / minor ecchymosis', 'Prolonged bleeding time from minor cuts'],
    seriousAdverseEffects: ['Major gastrointestinal hemorrhage / peptic ulcer perforation', 'Intracranial hemorrhage (rare but life-threatening)', 'Aspirin-exacerbated respiratory disease (Samter triad: asthma, nasal polyps)'],
    contraindications: ['Active pathological bleeding (e.g. bleeding peptic ulcer)', 'Severe thrombocytopenia (<50,000/µL)', 'Aspirin allergy / severe NSAID-induced asthma or anaphylaxis', 'Children/teens with viral illness (Reye syndrome risk)'],
    monitoring: ['Complete Blood Count (Hemoglobin/Hematocrit) periodically', 'Stool occult blood if anemia occurs', 'Inquire regularly about melena, coffee-ground emesis, or epistaxis'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I Secondary', recommendation: 'Universally recommended for secondary prevention in all patients with established atherosclerotic cardiovascular disease.' },
      { org: 'ACC/AHA', badge: 'Class III Primary (Routine)', recommendation: 'Routine low-dose aspirin is NO LONGER recommended for primary prevention in adults >70 or those at high bleeding risk.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for secondary prevention of recurrent MI and ischemic stroke.' }
    ],
    mechanismOfAction: 'Irreversibly acetylates serine-529 on cyclooxygenase-1 (COX-1), blocking conversion of arachidonic acid to prostaglandin H2. This permanently abolishes platelet synthesis of Thromboxane A2 (a potent platelet aggregator and vasoconstrictor) for the entire 7–10 day circulating lifespan of the platelet.',
    traineePearls: 'Enteric-coated aspirin delays absorption and does NOT reduce the incidence of major gastrointestinal bleeding, as GI bleeding from aspirin is primarily a systemic effect mediated by gastric mucosal prostaglandin inhibition.'
  },
  {
    id: 'metoprolol',
    name: 'Metoprolol (Tartrate vs Succinate)',
    brandNames: 'Lopressor (Tartrate), Toprol-XL (Succinate)',
    category: 'antihypertensive',
    drugClass: 'Cardioselective Beta-1 Adrenergic Blocker',
    frequency: 'Once Daily (OD)',
    timing: 'Succinate: Take once daily in morning. Tartrate: Take twice daily (BD) with or immediately following meals.',
    typicalDose: 'Succinate (ER): 25–100 mg PO once daily (titrate to 200 mg for heart failure). Tartrate (IR): 25–50 mg PO twice daily.',
    indications: ['Hypertension with compelling indication (Angina, Post-MI, HFrEF)', 'Stable Ischemic Heart Disease / Angina Pectoris', 'Rate control in Atrial Fibrillation'],
    commonSideEffects: ['Bradycardia', 'Fatigue / lethargy', 'Cold extremities', 'Dizziness', 'Sleep disturbances / vivid dreams'],
    seriousAdverseEffects: ['Severe symptomatic bradycardia / high-grade AV block', 'Cardiogenic shock / acute heart failure exacerbation upon abrupt up-titration', 'Severe bronchospasm in active asthma'],
    contraindications: ['Sinus bradycardia (HR <45 bpm)', 'Second- or third-degree heart block (without functioning pacemaker)', 'Cardiogenic shock / decompensated acute heart failure', 'Severe peripheral arterial disease'],
    monitoring: ['Resting heart rate (target 55–65 bpm in angina)', 'Sitting blood pressure', 'Signs of worsening congestion during initial titration'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I Post-MI & HF', recommendation: 'One of only three beta-blockers with proven mortality reduction in HFrEF (Metoprolol Succinate only; Tartrate is not proven for HF mortality).' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for angina, hypertension, and heart failure survival.' }
    ],
    mechanismOfAction: 'Selectively antagonizes beta-1 adrenergic receptors located predominantly in cardiac tissue. Decreases heart rate, myocardial contractility, and cardiac output at rest and during exercise; decreases AV nodal conduction velocity and reduces renal renin release.',
    traineePearls: 'Critical prescription pearl: Never substitute Metoprolol Tartrate for Metoprolol Succinate in heart failure patients! Metoprolol Tartrate is immediate-release (must be dosed twice daily); only Metoprolol Succinate extended-release has proven mortality reduction in clinical trials.'
  },
  {
    id: 'carvedilol',
    name: 'Carvedilol',
    brandNames: 'Coreg, Coreg CR',
    category: 'antihypertensive',
    drugClass: 'Non-Selective Beta Blocker with Alpha-1 Vasodilatory Activity',
    frequency: 'Twice Daily (BD)',
    timing: 'Take twice daily with food to slow absorption rate and minimize orthostatic hypotension risk',
    typicalDose: 'Initial: 3.125 mg PO twice daily for 2 weeks. If tolerated, double every 2 weeks to 6.25 mg, 12.5 mg, up to target 25 mg PO twice daily (50 mg BD if >85 kg).',
    indications: ['Heart Failure with Reduced Ejection Fraction (NYHA II–IV)', 'Left Ventricular Dysfunction post-Myocardial Infarction', 'Essential Hypertension'],
    commonSideEffects: ['Dizziness / postural hypotension (alpha-1 blockade)', 'Bradycardia', 'Diarrhea', 'Weight gain / fluid retention'],
    seriousAdverseEffects: ['Profound hypotension / syncope', 'Complete heart block', 'Severe bronchospasm in reactive airway disease'],
    contraindications: ['Bronchial asthma or severe COPD with bronchospasm', 'Second- or third-degree AV block', 'Severe bradycardia', 'Severe hepatic impairment'],
    monitoring: ['Blood pressure seated and standing (check for orthostasis within 1 hour of dosing)', 'Heart rate (resting)', 'Weight check (monitor for fluid retention indicating need for diuretic adjustment)'],
    guidelineSources: [
      { org: 'ACC/AHA', badge: 'Class I Guideline', recommendation: 'First-line guideline-directed medical therapy (GDMT) for heart failure with reduced ejection fraction; reduces mortality by ~35%.' },
      { org: 'FDA', badge: 'FDA Approved', recommendation: 'Approved for heart failure mortality reduction, post-MI LV dysfunction, and hypertension.' }
    ],
    mechanismOfAction: 'Non-selectively blocks beta-1 and beta-2 receptors, and selectively blocks alpha-1 adrenergic receptors. Alpha-1 antagonism promotes systemic peripheral vasodilation (reducing afterload), while beta-blockade prevents reflex tachycardia and suppresses neurohormonal renin-angiotensin activation.',
    traineePearls: 'Due to combined alpha-1 vasodilation and beta-blockade, Carvedilol lowers blood pressure significantly more than Metoprolol. Ideal for patients with both heart failure and poorly controlled hypertension!'
  }
];

interface MedicationReferenceProps {
  role?: string;
  patientVitals?: Record<string, unknown>;
  dynamicMedications?: Medication[];
}

export default function MedicationReference({ role = 'clinician', patientVitals, dynamicMedications }: MedicationReferenceProps) {
  const hasDynamicMeds = Boolean(dynamicMedications && dynamicMedications.length > 0);
  const [activeTab, setActiveTab] = useState<'suggested' | 'formulary'>(hasDynamicMeds ? 'suggested' : 'formulary');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 3;
  const [showAll, setShowAll] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isClinician = role === 'clinician' || role === 'practitioner';
  const isTrainee = role === 'trainee' || role === 'student';

  // Flagged context from patient vitals
  const ap_hi = Number(patientVitals?.ap_hi || 135);
  const cholTier = Number(patientVitals?.cholesterol || 2);
  const hasHypertension = ap_hi >= 130;
  const hasHighCholesterol = cholTier > 1;

  // Filtered list
  const filteredMeds = useMemo(() => {
    return MEDICATION_DATABASE.filter(med => {
      const matchesCategory = activeCategory === 'all' || med.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = 
        !query ||
        med.name.toLowerCase().includes(query) ||
        med.brandNames.toLowerCase().includes(query) ||
        med.drugClass.toLowerCase().includes(query) ||
        med.frequency.toLowerCase().includes(query) ||
        med.indications.some(i => i.toLowerCase().includes(query)) ||
        med.commonSideEffects.some(s => s.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  // Reset pagination when search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const totalItems = filteredMeds.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Current batch of medications to display (compact 3 at a time or all)
  const displayedMeds = useMemo(() => {
    if (showAll) return filteredMeds;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredMeds.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMeds, currentPage, showAll, PAGE_SIZE]);

  // Reload next batch with smooth transition
  const handleReloadNextBatch = () => {
    setIsReloading(true);
    setTimeout(() => {
      setCurrentPage((prev) => (prev % totalPages) + 1);
      setIsReloading(false);
    }, 220);
  };

  return (
    <div className="neu-flat rounded-3xl border border-slate-200/80 overflow-hidden bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] transition-all">
      
      {/* Dropdown Header Accordion Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-6 lg:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-left cursor-pointer hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-3.5">
          <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div>
            <h3 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Clinical Pharmacopeia &amp; Drug Reference
            </h3>
            <p className="text-[11px] sm:text-xs font-bold text-slate-600 mt-0.5 sm:mt-1">
              {isClinician 
                ? 'Evidence-based formulary search with dosing schedules, side effects, and ACC/AHA & FDA guidelines.'
                : isTrainee
                ? 'Supervised pharmacology reference: mechanisms of action, once vs twice daily kinetics, and clinical pearls.'
                : 'Prescription reference for healthcare providers. Consult your physician for personalized medical advice.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto shrink-0 pl-11 sm:pl-0">
          <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 ${
            hasDynamicMeds 
              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm'
              : 'bg-blue-100 text-blue-900 border border-blue-200'
          }`}>
            {hasDynamicMeds && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
            {hasDynamicMeds ? `${dynamicMedications?.length} Targeted Prescriptions` : (isClinician ? 'Clinician Reference' : isTrainee ? 'Trainee Reference' : 'Formulary')}
          </span>
          <span className="text-xs font-black text-indigo-700 hidden sm:inline">
            {isOpen ? 'Hide Drug Reference' : 'Explore Drug Reference'}
          </span>
          <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-600 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 md:p-8 pt-2 border-t border-slate-200/70 space-y-4 sm:space-y-6">

        {/* Dynamic vs Full Formulary Tab Navigation */}
        {hasDynamicMeds && (
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('suggested')}
              className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'suggested'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/60 border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Suggested for Patient</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                {dynamicMedications?.length || 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('formulary')}
              className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'formulary'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/60 border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Master Drug Formulary</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {MEDICATION_DATABASE.length}
              </span>
            </button>
          </div>
        )}

        {/* TAB 1: DYNAMIC SUGGESTED MEDICATIONS */}
        {activeTab === 'suggested' && hasDynamicMeds && (
          <div className="space-y-4 sm:space-y-6">
            {/* Clinical Rationale Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white border border-blue-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0 mt-0.5 sm:mt-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    Personalized Cardiovascular Pharmacotherapy
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Prescriptions synthesized according to 2017 ACC/AHA and USPSTF guidelines based on resting BP ({ap_hi}/{Number(patientVitals?.ap_lo || 80)} mmHg) and metabolic biomarkers.
                  </p>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 self-start sm:self-auto">
                ACC/AHA Class I Evidence
              </span>
            </div>

            {/* Dynamic Cards Grid with clean airy layout and dark high-contrast text */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {dynamicMedications?.map((med) => {
                return (
                  <div 
                    key={med.id}
                    className="neu-flat rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-[5px_5px_18px_rgba(163,177,198,0.25),-5px_-5px_18px_rgba(255,255,255,0.9)] hover:border-blue-300 transition-all flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">
                              {med.name}
                            </h4>
                            <span className="text-xs font-semibold text-slate-500">
                              ({med.brandNames})
                            </span>
                          </div>
                          <p className="text-xs font-bold text-blue-900 mt-1">
                            {med.drugClass}
                          </p>
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
                          {med.frequency}
                        </span>
                      </div>

                      {/* Clinical Indication / Reason with generous spacing */}
                      {med.patientIndication && (
                        <div className="p-4 rounded-2xl bg-[#fdfbf7] border border-amber-200/80 text-xs my-1">
                          <span className="font-black text-[10px] uppercase tracking-wider text-amber-900 block mb-1.5">
                            Targeted Purpose
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {med.patientIndication}
                          </p>
                        </div>
                      )}

                      {/* Dosing & Administration Instructions */}
                      <div className="p-4 rounded-2xl neu-inset bg-slate-50/70 border border-slate-200/70 space-y-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block mb-1">
                            Recommended Dosage
                          </span>
                          <span className="font-semibold text-slate-800 leading-relaxed block">
                            {med.typicalDose}
                          </span>
                        </div>
                        <div className="pt-2.5 border-t border-slate-200/60">
                          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block mb-1">
                            Administration Advice
                          </span>
                          <span className="font-medium text-slate-700 leading-relaxed block">
                            {med.timing}
                          </span>
                        </div>
                      </div>

                      {/* Precautions & Side Effects */}
                      <div className="space-y-1.5 text-xs pt-1">
                        <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">
                          Precautions &amp; Side Effects
                        </span>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {med.commonSideEffects?.slice(0, 3).join(' • ')}
                        </p>
                      </div>

                      {/* Monitoring Plan */}
                      {med.monitoring && med.monitoring.length > 0 && (
                        <div className="space-y-1 text-xs pt-2.5 border-t border-slate-100">
                          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">
                            Monitoring Routine
                          </span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {med.monitoring.slice(0, 2).join(' • ')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions: Clinical Profile & Drug AI Deep Dive Link */}
                    <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        {med.guidelineSources?.slice(0, 1).map((src, idx) => (
                          <span key={idx} className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {src.org}: {src.badge}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedMed(med)}
                          className="px-3 py-1.5 rounded-xl neu-button-secondary text-xs font-bold text-slate-700 hover:text-blue-800 transition-all cursor-pointer"
                        >
                          Details
                        </button>

                        <Link
                          href={`/drugs?q=${encodeURIComponent(med.name)}&role=${role}`}
                          className="px-3.5 py-1.5 rounded-xl neu-button-3d text-xs font-black text-white hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Explore with AI</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MASTER FORMULARY SEARCH (Shown when activeTab === 'formulary' or no dynamic meds) */}
        {(activeTab === 'formulary' || !hasDynamicMeds) && (
          <div className="space-y-4 sm:space-y-6">

      {/* Patient Contextual Recommendation Banner */}
      {(hasHypertension || hasHighCholesterol) && (
        <div className="p-3.5 sm:p-4 rounded-2xl neu-inset bg-blue-50/60 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2 font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse mt-1 sm:mt-0 shrink-0"></span>
            <span>
              <strong>Contextual Suggestions:</strong> Patient profile exhibits{' '}
              {hasHypertension && <span className="text-blue-900 underline font-black">Resting BP ≥130 mmHg</span>}
              {hasHypertension && hasHighCholesterol && ' and '}
              {hasHighCholesterol && <span className="text-blue-900 underline font-black">Elevated Cholesterol Tier {cholTier}</span>}.
            </span>
          </div>
          <div className="flex gap-2 flex-wrap self-start sm:self-auto shrink-0">
            {hasHypertension && (
              <button
                type="button"
                onClick={() => { setActiveCategory('antihypertensive'); setSearchQuery(''); }}
                className="neu-button-3d text-[10px] font-black px-3 py-1 text-white"
              >
                View Antihypertensives
              </button>
            )}
            {hasHighCholesterol && (
              <button
                type="button"
                onClick={() => { setActiveCategory('lipid'); setSearchQuery(''); }}
                className="neu-button-3d text-[10px] font-black px-3 py-1 text-white"
              >
                View Statins
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Bar & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine by generic or brand (e.g. Telma, Amlodipine, Atorva, Rosuvas)..."
            className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 neu-input rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills & Quick Controls: Smooth horizontal scrolling on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar touch-scroll pb-1 sm:pb-0 sm:flex-wrap">
            {[
              { id: 'all', label: 'All Medications' },
              { id: 'antihypertensive', label: 'Blood Pressure' },
              { id: 'lipid', label: 'Cholesterol & Statins' },
              { id: 'metabolic', label: 'Cardiometabolic' },
              { id: 'antiplatelet', label: 'Antiplatelet' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeCategory === cat.id
                    ? 'neu-button-3d text-white'
                    : 'neu-inset text-slate-600 hover:text-slate-900 bg-white/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Reload & View Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {!showAll && totalPages > 1 && (
              <button
                type="button"
                onClick={handleReloadNextBatch}
                disabled={isReloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Cycle to next batch of medications"
              >
                <svg className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reload Meds</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-200 text-blue-900">
                  {currentPage}/{totalPages}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
            >
              {showAll ? 'Compact (3)' : `Show All (${totalItems})`}
            </button>
          </div>
        </div>
      </div>

      {/* Unified Master Formulary Table (Clean, Compact, No Extra Cards) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredMeds.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className={`hidden lg:block overflow-x-auto transition-opacity duration-200 ${isReloading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Medication &amp; Class</th>
                    <th className="py-3.5 px-3">Regimen Frequency</th>
                    <th className="py-3.5 px-4">Standard Dosage &amp; Schedule</th>
                    <th className="py-3.5 px-4">Key Side Effects</th>
                    <th className="py-3.5 px-3">Endorsements</th>
                    <th className="py-3.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {displayedMeds.map((med) => {
                    const isOnceDaily = med.frequency === 'Once Daily (OD)';
                    const isTwiceDaily = med.frequency === 'Twice Daily (BD)';

                    return (
                      <tr 
                        key={med.id}
                        onClick={() => setSelectedMed(med)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        {/* Name & Class */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            {med.name}
                            <span className="text-[10px] font-medium text-slate-400">({med.brandNames})</span>
                          </div>
                          <div className="text-[11px] font-bold text-blue-900 mt-0.5">
                            {med.drugClass}
                          </div>
                        </td>

                        {/* Frequency */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isOnceDaily 
                              ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                              : isTwiceDaily
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {med.frequency}
                          </span>
                        </td>

                        {/* Typical Dose & Timing */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-slate-900 font-semibold">{med.typicalDose}</div>
                          <div className="text-[10px] text-slate-500 italic mt-0.5">{med.timing}</div>
                        </td>

                        {/* Side Effects */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {med.commonSideEffects.slice(0, 2).map((eff, i) => (
                              <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/60">
                                {eff}
                              </span>
                            ))}
                            {med.commonSideEffects.length > 2 && (
                              <span className="text-[10px] font-medium text-slate-400 self-center">
                                +{med.commonSideEffects.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Guidelines */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {med.guidelineSources.slice(0, 2).map((src, i) => (
                              <span key={i} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {src.org}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedMed(med); }}
                              className="text-xs font-bold text-slate-600 hover:text-blue-800 transition-colors"
                            >
                              Details
                            </button>
                            <Link
                              href={`/drugs?q=${encodeURIComponent(med.name)}&role=${role}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-black text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                            >
                              <span>AI Deep Dive</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Compact List View (No nested cards, clean divided rows) */}
            <div className={`lg:hidden divide-y divide-slate-100 transition-opacity duration-200 ${isReloading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              {displayedMeds.map((med) => {
                const isOnceDaily = med.frequency === 'Once Daily (OD)';
                const isTwiceDaily = med.frequency === 'Twice Daily (BD)';

                return (
                  <div 
                    key={med.id}
                    onClick={() => setSelectedMed(med)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                          {med.name}
                          <span className="text-xs font-medium text-slate-400">({med.brandNames})</span>
                        </div>
                        <div className="text-xs font-bold text-blue-800">{med.drugClass}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isOnceDaily 
                          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                          : isTwiceDaily
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {med.frequency}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium">
                      {med.typicalDose} &bull; <span className="italic text-slate-500">{med.timing}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-wrap gap-1">
                        {med.commonSideEffects.slice(0, 2).map((eff, i) => (
                          <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                            {eff}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination & Reload Footer */}
            <div className="p-3.5 sm:px-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                {!showAll ? (
                  <>
                    <span>
                      Showing <strong className="text-slate-900 font-black">{Math.min(totalItems, (currentPage - 1) * PAGE_SIZE + 1)}–{Math.min(totalItems, currentPage * PAGE_SIZE)}</strong> of <strong className="text-slate-900 font-black">{totalItems}</strong> medications
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 text-[11px] font-black">
                      Batch {currentPage} of {totalPages}
                    </span>
                  </>
                ) : (
                  <span>
                    Showing all <strong className="text-slate-900 font-black">{totalItems}</strong> medications
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                {!showAll && totalPages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isReloading}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs"
                      title="Previous batch"
                    >
                      <ChevronLeft className="w-3 h-3" /> Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isReloading}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || isReloading}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs"
                      title="Next batch"
                    >
                      Next <ChevronRight className="w-3 h-3" />
                    </button>

                    <span className="mx-1 h-4 w-px bg-slate-300" />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleReloadNextBatch}
                  disabled={isReloading}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black shadow-sm active:scale-95 transition-all cursor-pointer text-xs"
                  title="Reload to cycle next medications"
                >
                  <svg className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reload</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center space-y-1">
            <p className="text-sm font-bold text-slate-800">No matching medications found for &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-xs text-slate-500">Try searching by generic name (e.g. Amlodipine, Atorvastatin, Metformin) or drug class.</p>
          </div>
        )}
      </div>
      </div>
      )}

      {/* COMPREHENSIVE MODAL FOR EXPANDED CLINICAL DETAIL */}
      {selectedMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="neu-flat rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 bg-white border border-slate-200 shadow-2xl">
            
            {/* Modal Top Header */}
            <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-slate-200 gap-2.5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">{selectedMed.name}</h3>
                  <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    {selectedMed.frequency}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-500 mt-0.5">
                  Brand: {selectedMed.brandNames} &bull; Class: {selectedMed.drugClass}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMed(null)}
                className="w-8 h-8 rounded-full neu-button flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dosing & Administration */}
            <div className="p-4 rounded-2xl neu-inset bg-blue-50/50 border border-blue-200 space-y-1.5 text-xs">
              <h5 className="font-black text-blue-950 uppercase tracking-wider text-[11px]">
                Dosage Regimen &amp; Administration Schedule
              </h5>
              <p className="text-slate-800 font-semibold">{selectedMed.typicalDose}</p>
              <p className="text-blue-900 font-bold italic">Schedule: {selectedMed.timing}</p>
            </div>

            {/* Side Effects Grid (Common vs Serious) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl neu-inset bg-amber-50/50 border border-amber-200/80 space-y-2">
                <h5 className="font-black text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Common Side Effects
                </h5>
                <ul className="text-xs font-medium text-slate-700 list-disc list-inside space-y-1">
                  {selectedMed.commonSideEffects.map((eff, i) => (
                    <li key={i}>{eff}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl neu-inset bg-rose-50/50 border border-rose-200/80 space-y-2">
                <h5 className="font-black text-rose-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Serious / Adverse Warnings
                </h5>
                <ul className="text-xs font-medium text-slate-700 list-disc list-inside space-y-1">
                  {selectedMed.seriousAdverseEffects.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contraindications & Required Monitoring */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-black">Contraindications:</strong>
                <p className="text-slate-700 font-medium">{selectedMed.contraindications.join('; ')}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-black">Clinical Monitoring Guidelines:</strong>
                <p className="text-slate-700 font-medium">{selectedMed.monitoring.join(' • ')}</p>
              </div>
            </div>

            {/* Mechanism of Action */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 text-xs">
              <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block">
                Mechanism of Action (MOA)
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedMed.mechanismOfAction}
              </p>
            </div>

            {/* Trainee Learning Pearls */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 text-xs space-y-1">
              <span className="font-black text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-800 shrink-0" />
                Trainee Supervised Learning Pearl:
              </span>
              <p className="text-purple-900 font-semibold leading-relaxed">
                {selectedMed.traineePearls}
              </p>
            </div>

            {/* Authoritative Guideline Citations */}
            <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
              <span className="font-black text-slate-900 text-[11px] uppercase tracking-wider block">
                Authoritative Guideline Endorsements
              </span>
              <div className="space-y-1.5">
                {selectedMed.guidelineSources.map((src, i) => (
                  <div key={i} className="text-[11px] text-slate-600 flex items-start gap-2">
                    <span className="font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border shrink-0">
                      {src.org}
                    </span>
                    <span>{src.recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                href={`/drugs?q=${encodeURIComponent(selectedMed.name)}&role=${role}`}
                className="neu-button-secondary text-xs font-black px-4 py-2.5 text-blue-900 hover:text-blue-800 inline-flex items-center justify-center gap-2"
              >
                <span>Full FDA Monograph &amp; Studies in Drug Intelligence</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
              </Link>

              <button
                type="button"
                onClick={() => setSelectedMed(null)}
                className="neu-button-3d text-xs font-black px-6 py-2.5 text-white cursor-pointer"
              >
                Close Reference
              </button>
            </div>

          </div>
        </div>
      )}

        </div>
      )}

    </div>
  );
}
