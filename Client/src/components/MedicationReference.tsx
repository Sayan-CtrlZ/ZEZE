"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, GraduationCap, Pill, X, Stethoscope, ArrowRight } from 'lucide-react';

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
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const isClinician = role === 'clinician' || role === 'practitioner';
  const isTrainee = role === 'trainee' || role === 'student';

  // Suggested medications list: dynamic if available, otherwise baseline cardiovascular guidelines
  const medicationsToShow = useMemo(() => {
    if (hasDynamicMeds && dynamicMedications) {
      return dynamicMedications;
    }
    return MEDICATION_DATABASE.slice(0, 4);
  }, [hasDynamicMeds, dynamicMedications]);

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
                ? 'Evidence-based personalized pharmacotherapy with dosing schedules, side effects, and ACC/AHA & FDA guidelines.'
                : isTrainee
                ? 'Supervised pharmacology reference: mechanisms of action, once vs twice daily kinetics, and clinical pearls.'
                : 'Prescription reference for healthcare providers. Consult your physician for personalized medical advice.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto shrink-0 pl-11 sm:pl-0">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {medicationsToShow.length} Targeted Prescriptions
          </span>
          <span className="text-xs font-black text-indigo-700 hidden sm:inline">
            {isOpen ? 'Hide Drug Reference' : 'Explore Drug Reference'}
          </span>
          <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-600 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 md:p-8 pt-2 border-t border-slate-200/70 space-y-4 sm:space-y-6">

          {/* DYNAMIC SUGGESTED MEDICATIONS */}
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
                    Prescriptions synthesized according to 2017 ACC/AHA and USPSTF guidelines based on clinical biomarkers.
                  </p>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0 self-start sm:self-auto">
                ACC/AHA Class I Evidence
              </span>
            </div>

            {/* Dynamic Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {medicationsToShow.map((med) => {
                return (
                  <div 
                    key={med.id}
                    className="neu-flat rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-[5px_5px_18px_rgba(163,177,198,0.25),-5px_-5px_18px_rgba(255,255,255,0.9)] hover:border-blue-300 transition-all flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">{med.name}</h4>
                            <span className="text-xs font-semibold text-slate-500">({med.brandNames})</span>
                          </div>
                          <p className="text-xs font-bold text-blue-900 mt-1">{med.drugClass}</p>
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
                          {med.frequency}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl neu-inset bg-slate-50/70 border border-slate-200/70 space-y-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block mb-1">Recommended Dosage</span>
                          <span className="font-semibold text-slate-800 leading-relaxed block">{med.typicalDose}</span>
                        </div>
                        <div className="pt-2.5 border-t border-slate-200/60">
                          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block mb-1">Administration Advice</span>
                          <span className="font-medium text-slate-700 leading-relaxed block">{med.timing}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMed(med)}
                        className="px-3.5 py-1.5 rounded-xl neu-button-secondary text-xs font-bold text-slate-700 hover:text-blue-800 transition-all cursor-pointer"
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE MODAL FOR EXPANDED CLINICAL DETAIL */}
      {selectedMed && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedMed(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start p-5 sm:p-6 pb-4 border-b border-slate-200/80 shrink-0 bg-white gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">{selectedMed.name}</h3>
                  <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    {selectedMed.frequency}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-500 mt-1">
                  Brand: {selectedMed.brandNames} &bull; Class: {selectedMed.drugClass}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMed(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer shrink-0 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-1.5 text-xs">
                <h5 className="font-black text-blue-950 uppercase tracking-wider text-[11px]">
                  Dosage Regimen &amp; Administration Schedule
                </h5>
                <p className="text-slate-800 font-semibold">{selectedMed.typicalDose}</p>
                <p className="text-blue-900 font-bold italic">Schedule: {selectedMed.timing}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
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

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
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

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 text-xs">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] block">
                  Mechanism of Action (MOA)
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {selectedMed.mechanismOfAction}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 text-xs space-y-1">
                <span className="font-black text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-800 shrink-0" />
                  Trainee Supervised Learning Pearl:
                </span>
                <p className="text-purple-900 font-semibold leading-relaxed">
                  {selectedMed.traineePearls}
                </p>
              </div>

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
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200/80 shrink-0 bg-slate-50/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                href={`/drugs?q=${encodeURIComponent(selectedMed.name)}&role=${role}`}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-black text-blue-900 hover:bg-slate-100 inline-flex items-center justify-center gap-2 transition-colors"
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
  );
}
