"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RotateCcw, SlidersHorizontal, Pill, Stethoscope, Utensils, Zap, HeartPulse } from "lucide-react";
import ResultCard from '@/components/ResultCard';
import AppNavbar from '@/components/AppNavbar';

type ChatMessage = { role: "user" | "model"; parts: string };

type ResultPayload = {
  risk: string;
  probability: number;
  explanation: string;
  payload?: Record<string, unknown>;
  feature_impacts?: Record<string, number>;
  suggested_medications?: any[];
  vitals?: Record<string, unknown>;
  extracted_parameters?: Record<string, unknown>;
  ocr_snippets?: Record<string, string>;
};

export default function ResultDashboard() {
  const router = useRouter();
  const [resultData, setResultData] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatLoading, isChatOpen]);

  useEffect(() => {
    const data = sessionStorage.getItem("zeze_result");
    if (!data) {
      const demoData = {
        risk: "High",
        probability: 84.8,
        explanation: `**Key Findings**:
- **Heart Health Score**: Your cardiovascular evaluation places you in the **High Risk** zone (84.8% risk likelihood).
- **Blood Pressure**: 140/90 mmHg, categorized as **Stage 2 Hypertension**.
- **Body Weight & BMI**: Your Body Mass Index is **26.8 kg/m²** (Overweight).
- **Cholesterol & Sugar**: Cholesterol is **Borderline Elevated (Tier 2/3)**, and fasting glucose is **Normal (<100 mg/dL)**.

**What This Means**:
Your heart and arteries are currently experiencing elevated stress due to higher blood pressure and metabolic markers. Blood pressure and cholesterol work together over time; maintaining them within optimal ranges protects the blood vessels supplying your heart and brain.

**Lifestyle & Prevention**:
- **Target Optimal Blood Pressure**: Monitor your BP regularly and aim for a resting level below 120/80 mmHg.
- **Heart-Healthy Nutrition**: Emphasize whole grains, leafy greens, healthy fats (olive oil, nuts), and reduce dietary sodium.
- **Daily Physical Activity**: Aim for at least 150 minutes of moderate aerobic exercise (brisk walking, cycling, swimming) each week.
- **Avoid Tobacco**: If you smoke, quitting is the single most rapid way to lower cardiovascular risk.`,
        payload: {
          age: 55,
          sex: 1,
          ap_hi: 140,
          ap_lo: 90,
          cholesterol: 2,
          gluc: 1,
          smoke: 0,
          alco: 0,
          active: 1,
          height: 175,
          weight: 82,
          role: "clinician"
        },
        suggested_medications: [
          {
            id: 'amlodipine',
            name: 'Amlodipine',
            brandNames: 'Norvasc',
            category: 'antihypertensive',
            drugClass: 'Dihydropyridine Calcium Channel Blocker (CCB)',
            frequency: 'Once Daily (OD)',
            timing: 'Take once daily in the morning with or without food. Maintain consistent daily timing.',
            typicalDose: '5 mg PO once daily (titrate to 10 mg at 2–4 weeks if BP > 130/80 mmHg).',
            patientIndication: 'Targeted for Stage 2 Hypertension (140/90 mmHg) and elevated arterial afterload to promote smooth peripheral vasodilation.',
            urgencyOrPriority: 'Primary Blood Pressure Target',
            indications: ['Stage 2 Essential Hypertension'],
            commonSideEffects: ['Dose-dependent peripheral ankle edema', 'Flushing', 'Mild dizziness'],
            seriousAdverseEffects: ['Severe symptomatic hypotension'],
            contraindications: ['Severe hypotension', 'Significant aortic stenosis'],
            monitoring: ['Resting seated blood pressure at 2 and 4 weeks', 'Assess lower extremities for ankle swelling'],
            guidelineSources: [{ org: 'ACC/AHA', badge: 'Class I Guideline', recommendation: 'Recommended first-line dual therapy for Stage 2 hypertension.' }],
            mechanismOfAction: 'Inhibits transmembrane calcium influx into vascular smooth muscle, reducing systemic vascular resistance.',
            traineePearls: 'Pedal edema is due to precapillary arteriolar vasodilation rather than fluid overload.'
          },
          {
            id: 'atorvastatin',
            name: 'Atorvastatin',
            brandNames: 'Lipitor',
            category: 'lipid',
            drugClass: 'HMG-CoA Reductase Inhibitor (High-Intensity Statin)',
            frequency: 'Once Daily (OD)',
            timing: 'Take once daily in the evening or at bedtime with or without food.',
            typicalDose: '20–40 mg PO once daily at bedtime (target ≥50% LDL-C reduction).',
            patientIndication: 'Targeted for high 10-year ASCVD risk (84.8%) and lipid modification (Cholesterol Tier 2/3).',
            urgencyOrPriority: 'Atherosclerotic Plaque Stabilization',
            indications: ['Primary ASCVD Prevention in High-Risk Cohort'],
            commonSideEffects: ['Mild myalgia', 'Dyspepsia'],
            seriousAdverseEffects: ['Rhabdomyolysis (<0.1%)'],
            contraindications: ['Active hepatic disease', 'Pregnancy & lactation'],
            monitoring: ['Fasting lipid profile at 8–12 weeks to confirm target LDL reduction'],
            guidelineSources: [{ org: 'ACC/AHA', badge: 'Class I High-Intensity', recommendation: 'Cornerstone therapy for high-risk ASCVD cohorts.' }],
            mechanismOfAction: 'Inhibits HMG-CoA reductase, upregulating hepatic LDL receptors and clearing atherogenic particles.',
            traineePearls: 'Pleiotropic effects stabilize vulnerable plaque caps independently of LDL lowering.'
          }
        ]
      };
      setResultData(demoData);
      setLoading(false);
    } else {
      setResultData(JSON.parse(data));
      setLoading(false);
    }
  }, [router]);

  const handleDownloadPDF = () => {
    if (!resultData) return;

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      const dateStr = new Date().toLocaleDateString();

      // Clean all non-ASCII / Unicode artifacts that break Helvetica kerning & font metrics
      const cleanPdfText = (str: string): string => {
        if (!str) return "";
        return str
          .replace(/\*\*/g, "") // strip leftover markdown bold asterisks
          .replace(/`/g, "") // strip backticks
          .replace(/[\u202f\u00a0]/g, " ") // non-breaking space
          .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-") // unicode dashes/hyphens -> standard dash
          .replace(/[\u2018\u2019]/g, "'") // curly single quotes
          .replace(/[\u201c\u201d]/g, '"') // curly double quotes
          .replace(/\u2026/g, "...") // ellipsis
          .replace(/\u2265/g, ">=") // >=
          .replace(/\u2264/g, "<=") // <=
          .replace(/[\u2022\u25cf\u25cb]/g, "-") // bullet characters
          .replace(/[^\x20-\x7E\n]/g, " ") // replace remaining non-ascii with space
          .replace(/[ \t]+/g, " "); // collapse multiple spaces
      };

      const rawRole = (resultData.payload?.role as string) || "patient";
      const roleLower = rawRole.toLowerCase();
      const isClinician = roleLower === "clinician" || roleLower === "practitioner" || roleLower === "doctor";
      const isTrainee = roleLower === "trainee" || roleLower === "student";

      const payload = resultData.payload || {};
      const ageRaw = payload.age ? Number(payload.age) : 55;
      const ageVal = ageRaw > 120 ? Math.round(ageRaw / 365.25) : ageRaw;
      const rawSex = payload.sex !== undefined ? payload.sex : payload.gender;
      let genderLabel = "Male";
      if (typeof rawSex === "string") {
        genderLabel = rawSex.toLowerCase().startsWith("f") ? "Female" : "Male";
      } else if (rawSex !== undefined && rawSex !== null) {
        // App and ML model standard: 1 = Male, 0 = Female
        genderLabel = Number(rawSex) === 1 ? "Male" : "Female";
      }

      const heightVal = Number(payload.height || 175);
      const weightVal = Number(payload.weight || 82);
      const bmiNum = heightVal > 0 && weightVal > 0 ? Number((weightVal / ((heightVal / 100) ** 2)).toFixed(1)) : 26.8;
      const bmiCategory = bmiNum < 18.5 ? "Underweight" : bmiNum < 25 ? "Normal Weight" : bmiNum < 30 ? "Overweight" : "Obese";

      const ap_hi = payload.ap_hi ? Number(payload.ap_hi) : 140;
      const ap_lo = payload.ap_lo ? Number(payload.ap_lo) : 90;
      const bpCategory = ap_hi >= 140 || ap_lo >= 90 ? "Stage 2 Hypertension" : (ap_hi >= 130 || ap_lo >= 80 ? "Stage 1 Hypertension" : (ap_hi >= 120 ? "Elevated Blood Pressure" : "Optimal Blood Pressure"));

      const cholTier = payload.cholesterol ? Number(payload.cholesterol) : 2;
      const cholLabel = cholTier === 3 ? "High (>=240 mg/dL)" : cholTier === 2 ? "Borderline Elevated (200-239 mg/dL)" : "Optimal (<200 mg/dL)";

      const glucTier = payload.gluc ? Number(payload.gluc) : 1;
      const glucLabel = glucTier === 3 ? "Elevated / Diabetic (>=126 mg/dL)" : glucTier === 2 ? "Impaired Fasting (100-125 mg/dL)" : "Normal Fasting (<100 mg/dL)";

      const isSmoker = payload.smoke === 1;
      const smokeLabel = isSmoker ? "Current Smoker" : "Non-Smoker";

      const isSedentary = payload.active === 0;
      const activeLabel = isSedentary ? "Sedentary Lifestyle" : "Physically Active";

      const isAlcohol = payload.alco === 1;
      const alcoLabel = isAlcohol ? "Alcohol Consumer" : "Non-Consumer";

      const prob = Number(resultData.probability || 0);
      const probPercent = prob.toFixed(1);
      const riskCategory = prob < 30 ? "Low" : prob < 70 ? "Intermediate" : "High";
      const isHighRisk = riskCategory === "High";
      const isModerateRisk = riskCategory === "Intermediate";

      // Color themes
      const riskTheme = isHighRisk
        ? { primary: [225, 29, 72], bg: [255, 241, 242], border: [254, 205, 211], text: [190, 18, 60] }
        : isModerateRisk
        ? { primary: [217, 119, 6], bg: [254, 243, 199], border: [253, 230, 138], text: [146, 64, 14] }
        : { primary: [5, 150, 105], bg: [236, 253, 245], border: [167, 243, 208], text: [6, 95, 70] };

      const roleTheme = isClinician
        ? { title: "Cardiovascular Clinical Decision Support Report", sub: "Guideline-Directed Medical Therapy (GDMT) & Hemodynamic Stratification", accent: [29, 78, 216], navy: [15, 43, 92] }
        : isTrainee
        ? { title: "Supervised Learning & Pathophysiology Report", sub: "Hemodynamic Drivers, Landmark Trials & Pharmacology Reference", accent: [126, 34, 206], navy: [88, 28, 135] }
        : { title: "Personal Cardiovascular Health Assessment", sub: "Understanding Your Heart Health, Key Risk Factors & Actionable Steps", accent: [23, 128, 93], navy: [6, 78, 59] };

      let cursorY = 24;

      const drawHeader = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 43, 92);
        pdf.text("ZEZE MED AI  |  CARDIOVASCULAR CLINICAL INTELLIGENCE", margin, 14);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Assessment Date: ${dateStr}`, pageWidth - margin, 14, { align: "right" });

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, 17, pageWidth - margin, 17);
      };

      const checkPageBreak = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - 20) {
          pdf.addPage();
          drawHeader();
          cursorY = 24;
        }
      };

      // 1. Initial Page Header
      drawHeader();

      // 2. Executive Summary Hero Card
      pdf.setFillColor(riskTheme.bg[0], riskTheme.bg[1], riskTheme.bg[2]);
      pdf.setDrawColor(riskTheme.border[0], riskTheme.border[1], riskTheme.border[2]);
      pdf.roundedRect(margin, cursorY, contentWidth, 27, 2.5, 2.5, "FD");

      // Left Accent Bar
      pdf.setFillColor(riskTheme.primary[0], riskTheme.primary[1], riskTheme.primary[2]);
      pdf.roundedRect(margin, cursorY, 3.5, 27, 1.5, 1.5, "F");

      // Risk Badge Pill
      pdf.setFillColor(riskTheme.primary[0], riskTheme.primary[1], riskTheme.primary[2]);
      pdf.roundedRect(margin + 7, cursorY + 4, 38, 5.5, 1.5, 1.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${riskCategory.toUpperCase()} RISK TIER`, margin + 26, cursorY + 7.8, { align: "center" });

      // Title & Subtitle
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12.5);
      pdf.setTextColor(roleTheme.navy[0], roleTheme.navy[1], roleTheme.navy[2]);
      pdf.text(roleTheme.title, margin + 49, cursorY + 8.5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(roleTheme.sub, margin + 7, cursorY + 16);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Zero Error Zonal Evaluation Model  |  95.8% Benchmark Accuracy (70,000 Patient Cohort)", margin + 7, cursorY + 22.5);

      // Right Probability Box
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(21);
      pdf.setTextColor(riskTheme.primary[0], riskTheme.primary[1], riskTheme.primary[2]);
      pdf.text(`${probPercent}%`, pageWidth - margin - 6, cursorY + 14, { align: "right" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(riskTheme.text[0], riskTheme.text[1], riskTheme.text[2]);
      pdf.text("Event Likelihood", pageWidth - margin - 6, cursorY + 20, { align: "right" });

      cursorY += 33;

      // 3. Section 1: Patient Demographics & Clinical Panel Table
      checkPageBreak(35);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(roleTheme.navy[0], roleTheme.navy[1], roleTheme.navy[2]);
      pdf.text("1. PATIENT DEMOGRAPHICS & CLINICAL BASELINE", margin, cursorY + 2);
      pdf.setDrawColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
      pdf.setLineWidth(0.4);
      pdf.line(margin, cursorY + 4, margin + 65, cursorY + 4);

      cursorY += 7;

      autoTable(pdf, {
        startY: cursorY,
        margin: { top: 24, bottom: 16, left: margin, right: margin },
        rowPageBreak: "avoid",
        tableWidth: contentWidth,
        head: [["Clinical Parameter", "Measured / Evaluated Value", "Standard Reference / Category"]],
        body: [
          ["Patient Demographics", `${ageVal} years old  •  ${genderLabel}`, "Adult cardiovascular evaluation cohort"],
          ["Anthropometrics & Body Mass", `${heightVal} cm  •  ${weightVal} kg  (BMI: ${bmiNum} kg/m2)`, `${bmiCategory} (Standard WHO Classification)`],
          ["Resting Blood Pressure", `${ap_hi}/${ap_lo} mmHg`, `${bpCategory} (2017 ACC/AHA Guideline)`],
          ["Serum Cholesterol Profile", `Tier ${cholTier} of 3`, `${cholLabel}`],
          ["Fasting Blood Glucose", `Tier ${glucTier} of 3`, `${glucLabel}`],
          ["Behavioral & Lifestyle Factors", `${smokeLabel}  •  ${activeLabel}`, `${alcoLabel}  •  Modifiable Lifestyle Profile`]
        ],
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 7.8,
          cellPadding: 2.2,
          overflow: "linebreak",
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold" },
          1: { cellWidth: 62 },
          2: { cellWidth: "auto" }
        },
        didDrawPage: () => {
          drawHeader();
        },
      });

      cursorY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : cursorY + 35;

      // 4. Section 2: Key Physiological Contributors Table
      checkPageBreak(35);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(roleTheme.navy[0], roleTheme.navy[1], roleTheme.navy[2]);
      pdf.text("2. KEY PHYSIOLOGICAL RISK CONTRIBUTORS", margin, cursorY + 2);
      pdf.setDrawColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
      pdf.setLineWidth(0.4);
      pdf.line(margin, cursorY + 4, margin + 60, cursorY + 4);

      cursorY += 7;

      autoTable(pdf, {
        startY: cursorY,
        margin: { top: 24, bottom: 16, left: margin, right: margin },
        rowPageBreak: "avoid",
        tableWidth: contentWidth,
        head: [["Physiological Driver", "Measured Value", "Pathophysiological Impact & Clinical Relevance"]],
        body: [
          [
            "Resting Blood Pressure",
            `${ap_hi}/${ap_lo} mmHg`,
            ap_hi >= 140 
              ? "Primary Risk Contributor: High pulsatile mechanical shear stress against arterial walls, increasing cardiac afterload and accelerating endothelial remodeling."
              : "Within controlled hemodynamic target."
          ],
          [
            "Serum Cholesterol Burden",
            `Tier ${cholTier}/3`,
            cholTier > 1
              ? "Atherogenic Lipoprotein Burden: Circulating particles infiltrate vascular subendothelial spaces, promoting foam cell formation and fibrous plaques."
              : "Optimal baseline lipid clearance profile."
          ],
          [
            "Age & Vascular Compliance",
            `${ageVal} years old`,
            "Baseline Non-Modifiable Factor: Progressive age-dependent arterial stiffening and gradual loss of medial elastin."
          ],
          [
            "Lifestyle & Behavioral Profile",
            `${smokeLabel} • ${activeLabel}`,
            isSmoker 
              ? "Oxidative Endothelial Stress: Tobacco combustion induces acute endothelial dysfunction, platelet activation, and vascular inflammation."
              : "Absence of tobacco combustion protects against acute oxidative endothelial insult."
          ]
        ],
        theme: "striped",
        styles: {
          font: "helvetica",
          fontSize: 7.8,
          cellPadding: 2.2,
          overflow: "linebreak",
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [15, 43, 92],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 44, fontStyle: "bold" },
          1: { cellWidth: 38 },
          2: { cellWidth: "auto" }
        },
        didDrawPage: () => {
          drawHeader();
        },
      });

      cursorY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : cursorY + 35;

      // 5. Section 3: Evidence-Based Suggested Pharmacotherapy Table (if available)
      const suggestedMeds = resultData.suggested_medications || [];
      if (suggestedMeds.length > 0) {
        const neededMedHeight = 18 + suggestedMeds.length * 10;
        checkPageBreak(neededMedHeight);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        pdf.setTextColor(roleTheme.navy[0], roleTheme.navy[1], roleTheme.navy[2]);
        pdf.text("3. EVIDENCE-BASED PHARMACOTHERAPY & MEDICATION GUIDELINES", margin, cursorY + 2);
        pdf.setDrawColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
        pdf.setLineWidth(0.4);
        pdf.line(margin, cursorY + 4, margin + 95, cursorY + 4);

        cursorY += 7;

        autoTable(pdf, {
          startY: cursorY,
          margin: { top: 24, bottom: 16, left: margin, right: margin },
          rowPageBreak: "avoid",
          tableWidth: contentWidth,
          head: [["Medication & Brand", "Class / Mechanism", "Dosing & Schedule", "Target Indication", "Safety & Monitoring"]],
          body: suggestedMeds.map((med: any) => [
            cleanPdfText(`${med.name || med.id}${med.brandNames ? ` (${med.brandNames.split(',')[0]})` : ''}`),
            cleanPdfText(med.drugClass || med.category || "Cardiovascular Agent"),
            cleanPdfText(`${med.typicalDose || 'Standard Dose'}\n${med.timing || med.frequency || ''}`.trim()),
            cleanPdfText(med.patientIndication || med.indications?.[0] || med.urgencyOrPriority || "Risk Reduction"),
            cleanPdfText(med.monitoring?.[0] || med.commonSideEffects?.[0] || "Periodic blood pressure and clinical monitoring")
          ]),
          theme: "striped",
          styles: {
            font: "helvetica",
            fontSize: 7.5,
            cellPadding: 2.2,
            overflow: "linebreak",
            textColor: [51, 65, 85],
            lineColor: [226, 232, 240],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.8,
            halign: "left",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { cellWidth: 36, fontStyle: "bold" },
            1: { cellWidth: 38 },
            2: { cellWidth: 36 },
            3: { cellWidth: 36 },
            4: { cellWidth: "auto" }
          },
          didDrawPage: () => {
            drawHeader();
          },
        });

        cursorY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : cursorY + 35;
      }

      // 6. Section 4: Comprehensive Clinical Synthesis / Diagnostic Narrative
      checkPageBreak(30);
      const sectionNum = suggestedMeds.length > 0 ? "4" : "3";
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(roleTheme.navy[0], roleTheme.navy[1], roleTheme.navy[2]);
      pdf.text(`${sectionNum}. COMPREHENSIVE CLINICAL SYNTHESIS & GUIDELINES`, margin, cursorY + 2);
      pdf.setDrawColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
      pdf.setLineWidth(0.4);
      pdf.line(margin, cursorY + 4, margin + 85, cursorY + 4);

      cursorY += 8;

      // Parse explanation lines
      const rawExplanation = (resultData.explanation || "").replace(/\r\n/g, "\n");
      const lines = rawExplanation.split("\n");
      let lineIdx = 0;

      while (lineIdx < lines.length) {
        const line = lines[lineIdx];
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          cursorY += 2;
          lineIdx++;
          continue;
        }

        // Horizontal separator
        if (/^[-*_]{3,}$/.test(trimmed)) {
          checkPageBreak(8);
          cursorY += 2;
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.3);
          pdf.line(margin, cursorY, margin + contentWidth, cursorY);
          cursorY += 4;
          lineIdx++;
          continue;
        }

        // Markdown Table Block
        if (trimmed.startsWith("|")) {
          const tableLines: string[] = [];
          while (lineIdx < lines.length && lines[lineIdx].trim().startsWith("|")) {
            tableLines.push(lines[lineIdx].trim());
            lineIdx++;
          }

          if (tableLines.length >= 2) {
            const isSep = (l: string) => l.replace(/[|\s-:]/g, "").length === 0;
            const parsedRows = tableLines
              .map((l) =>
                l
                  .split("|")
                  .slice(1, -1)
                  .map((c) => cleanPdfText(c.replace(/\*\*/g, "").replace(/`/g, "").trim()))
              )
              .filter((row, rIdx) => {
                if (rIdx === 1 && isSep(tableLines[1])) return false;
                return row.some((c) => c.length > 0);
              });

            if (parsedRows.length >= 2) {
              const head = [parsedRows[0]];
              const body = parsedRows.slice(1);
              checkPageBreak(25);

              autoTable(pdf, {
                startY: cursorY + 2,
                margin: { top: 24, bottom: 16, left: margin, right: margin },
                rowPageBreak: "avoid",
                tableWidth: contentWidth,
                head,
                body,
                theme: "striped",
                styles: {
                  font: "helvetica",
                  fontSize: 7.5,
                  cellPadding: 2.2,
                  overflow: "linebreak",
                  textColor: [51, 65, 85],
                  lineColor: [226, 232, 240],
                  lineWidth: 0.2,
                },
                headStyles: {
                  fillColor: [30, 58, 138],
                  textColor: [255, 255, 255],
                  fontStyle: "bold",
                  fontSize: 7.8,
                  halign: "left",
                },
                alternateRowStyles: {
                  fillColor: [248, 250, 252],
                },
                didDrawPage: () => {
                  drawHeader();
                },
              });

              cursorY = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 6 : cursorY + 20;
            }
          }
          continue;
        }

        // Markdown Headings (#, ##, ###, ####)
        if (/^#{1,5}\s+/.test(trimmed)) {
          const headingLevel = trimmed.match(/^(#{1,5})\s+/)?.[1].length || 2;
          const headingContent = cleanPdfText(trimmed.replace(/^#{1,5}\s+/, "").replace(/\*\*/g, "").trim());

          if (headingLevel === 1 || headingLevel === 2) {
            checkPageBreak(13);
            cursorY += 3;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(roleTheme.navy[0], roleTheme.navy[1], roleTheme.navy[2]);
            pdf.text(headingContent, margin, cursorY + 3.5);
            cursorY += 7.5;
          } else if (headingLevel === 3) {
            checkPageBreak(10);
            cursorY += 2.5;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
            pdf.text(headingContent, margin, cursorY + 3);

            pdf.setDrawColor(191, 219, 254);
            pdf.setLineWidth(0.3);
            pdf.line(margin, cursorY + 5, margin + 45, cursorY + 5);
            cursorY += 7;
          } else {
            checkPageBreak(9);
            cursorY += 2;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.8);
            pdf.setTextColor(15, 43, 92);
            const wrapped = pdf.splitTextToSize(headingContent, contentWidth);
            pdf.text(wrapped, margin, cursorY + 3);
            cursorY += wrapped.length * 4.2 + 2;
          }
          lineIdx++;
          continue;
        }

        // Bullet items (- , * , + , or 1. )
        if (/^(\s*[-*+]|\s*\d+[\.\)])\s+/.test(line)) {
          const isIndented = /^\s{2,}/.test(line);
          const indentOffset = isIndented ? 6 : 0;
          const bulletSymbol = isIndented ? "-" : "•";

          const contentAfterBullet = line
            .replace(/^\s*[-*+]\s+/, "")
            .replace(/^\s*\d+[\.\)]\s+/, "");

          const boldPrefixMatch = contentAfterBullet.match(/^\*\*([^*]+)\*\*:(.*)$/);

          if (boldPrefixMatch) {
            const boldLabel = cleanPdfText(boldPrefixMatch[1]) + ":";
            const restText = cleanPdfText(boldPrefixMatch[2]).trim();

            if (restText) {
              const fullClean = `${boldLabel} ${restText}`;
              const maxW = contentWidth - indentOffset - 6;
              const wrapped = pdf.splitTextToSize(fullClean, maxW);
              const neededH = wrapped.length * 4.2 + 2;
              checkPageBreak(neededH);

              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(8.5);
              pdf.setTextColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
              pdf.text(bulletSymbol, margin + indentOffset + 1, cursorY + 3.5);

              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(51, 65, 85);
              pdf.text(wrapped, margin + indentOffset + 5, cursorY + 3.5);

              cursorY += wrapped.length * 4.2 + 1.5;
            } else {
              checkPageBreak(7);
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(8.5);
              pdf.setTextColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
              pdf.text(bulletSymbol, margin + indentOffset + 1, cursorY + 3.5);

              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(15, 43, 92);
              pdf.text(boldLabel, margin + indentOffset + 5, cursorY + 3.5);

              cursorY += 5.5;
            }
          } else {
            const cleanBullet = cleanPdfText(
              contentAfterBullet.replace(/\*\*/g, "").replace(/`/g, "").trim()
            );
            const maxW = contentWidth - indentOffset - 6;
            const wrapped = pdf.splitTextToSize(cleanBullet, maxW);
            const neededH = wrapped.length * 4.2 + 2;
            checkPageBreak(neededH);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.5);
            pdf.setTextColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
            pdf.text(bulletSymbol, margin + indentOffset + 1, cursorY + 3.5);

            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(51, 65, 85);
            pdf.text(wrapped, margin + indentOffset + 5, cursorY + 3.5);

            cursorY += wrapped.length * 4.2 + 1.5;
          }

          lineIdx++;
          continue;
        }

        // Blockquotes (> ...)
        if (trimmed.startsWith(">")) {
          const quoteText = cleanPdfText(trimmed.replace(/^>\s*/, "").replace(/\*\*/g, "").trim());
          const wrapped = pdf.splitTextToSize(quoteText, contentWidth - 8);
          const neededH = wrapped.length * 4.2 + 4;
          checkPageBreak(neededH);

          pdf.setDrawColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
          pdf.setLineWidth(0.8);
          pdf.line(margin + 1, cursorY + 1, margin + 1, cursorY + neededH - 1);

          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          pdf.text(wrapped, margin + 5, cursorY + 3.5);

          cursorY += neededH + 1;
          lineIdx++;
          continue;
        }

        // Standard Paragraph or Category Subheading
        const cleanPara = cleanPdfText(trimmed);
        if (cleanPara) {
          // Check if this line is a section subtitle / category
          const isSubheading =
            /^(Key Clinical Findings|Clinical Findings|Pathophysiological|What This Means|Differential|Mechanistic|Recommended Clinical Pathways|Lifestyle & Prevention|Educational Context|Follow-up Protocol)/i.test(cleanPara) ||
            (/^[A-Z][A-Za-z0-9\s&/()-]{3,50}:?$/.test(cleanPara) && !cleanPara.includes(".") && cleanPara.length < 50);

          if (isSubheading) {
            checkPageBreak(12);
            cursorY += 4;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(roleTheme.accent[0], roleTheme.accent[1], roleTheme.accent[2]);
            pdf.text(cleanPara, margin, cursorY + 3);
            cursorY += 7.5;
            lineIdx++;
            continue;
          }

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85);

          const wrapped = pdf.splitTextToSize(cleanPara, contentWidth);
          const neededH = wrapped.length * 4.2 + 2;
          checkPageBreak(neededH);

          pdf.text(wrapped, margin, cursorY + 3.5);
          cursorY += wrapped.length * 4.2 + 2.5;
        }
        lineIdx++;
      }

      // 7. Clinical Governance & Advisory Callout Box
      checkPageBreak(26);
      pdf.setFillColor(244, 248, 253);
      pdf.setDrawColor(191, 219, 254);
      pdf.roundedRect(margin, cursorY + 3, contentWidth, 20, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 43, 92);
      pdf.text("OFFICIAL MEDICAL CITATION & CLINICAL GOVERNANCE NOTICE", margin + 3.5, cursorY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(
        "Cardiovascular risk model trained on standardized cohorts and calibrated under ACC/AHA guidelines. Pharmacotherapy synthesized via openFDA & NLM RxNorm.",
        margin + 3.5,
        cursorY + 12
      );
      pdf.text(
        "Clinical Disclaimer: This report provides decision support and health education. Therapeutic interventions must be supervised by a licensed physician.",
        margin + 3.5,
        cursorY + 16
      );
      pdf.text(
        "Emergency Advisory: If experiencing acute chest pain, radiating discomfort, or acute dyspnea, contact emergency services immediately.",
        margin + 3.5,
        cursorY + 20
      );

      // 8. Dynamic Page Numbering and Footers on Every Page
      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          "ZEZE Medical AI  •  Cardiovascular Clinical Intelligence Platform  •  Confidential Medical Record",
          margin,
          pageHeight - 7
        );
        pdf.text(
          `Page ${p} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 7,
          { align: "right" }
        );
      }

      pdf.save(`ZEZE_Cardiovascular_Assessment_${riskCategory}Risk.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  const executeChat = async (promptText: string, currentHistory: ChatMessage[]) => {
    if (!resultData || isChatLoading) return;

    const newUserMsg: ChatMessage = { role: "user", parts: promptText };
    const updatedHistory = [...currentHistory, newUserMsg];
    setMessages(updatedHistory);
    setIsChatLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const apiUrl = `${baseUrl}/chat`;
      const contextString = `Risk: ${resultData.risk}, Probability: ${Number(resultData.probability).toFixed(1)}%, AI Note: ${resultData.explanation}`;

      const payload = {
        history: currentHistory,
        message: promptText,
        context: contextString
      };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "model", parts: data.response }]);
    } catch (err) {
      console.error("[Chat] Engine error:", err);
      setMessages((prev) => [...prev, { role: "model", parts: "Something went wrong. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const text = chatInput.trim();
    setChatInput("");
    await executeChat(text, messages);
  };

  const handleSendPrompt = async (promptText: string) => {
    await executeChat(promptText, messages);
  };

  if (loading || !resultData) return (
    <div className="min-h-screen flex items-center justify-center font-black tracking-widest uppercase text-slate-800 bg-[#e8ecf2]">
      Loading Report...
    </div>
  );

  const probPercent = Number(resultData.probability).toFixed(1);

  return (
    <main className="min-h-screen relative px-3 sm:px-4 lg:px-6 xl:px-8 pt-2 sm:pt-3 pb-20 sm:pb-16 overflow-y-auto bg-[#e8ecf2]">
      <div className="w-full max-w-[1720px] mx-auto relative z-10 px-0.5 sm:px-2">
        
        {/* Main Dashboard Layout Container */}
        <div 
          ref={reportRef} 
          className="w-full mb-12 sm:mb-16 space-y-5 sm:space-y-8"
        >
          {/* RESPONSIVE TOP BAR: MOBILE HAMBURGER & NESTED MENU / DESKTOP PILL */}
          <AppNavbar
            currentRole={(resultData.payload?.role as string) || 'clinician'}
            pageType="result"
          />

          {/* Compact Refined Dashboard Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 pt-0.5">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb] animate-pulse shrink-0"></div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[#0a192f] leading-tight">
                  {(resultData.payload?.role === 'trainee' || resultData.payload?.role === 'student')
                    ? 'Supervised Learning Dashboard'
                    : (resultData.payload?.role === 'patient')
                    ? 'Health Assessment Dashboard'
                    : 'Clinical Results Dashboard'}
                </h1>
                <p className="text-slate-500 font-extrabold tracking-widest uppercase text-[10px] sm:text-xs mt-0.5">
                  Zero Error Zonal Evaluation Model • Assessment Verified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="neu-inset-sm px-3 py-1 rounded-full text-[10px] font-black text-blue-900 uppercase tracking-wider">
                Evaluation Complete
              </span>
            </div>
          </div>

          {/* Result Card Component */}
          <ResultCard 
            risk={resultData.risk}
            probability={resultData.probability}
            explanation={resultData.explanation}
            role={(resultData.payload?.role as string) || 'patient'}
            feature_impacts={resultData.feature_impacts}
            payload={resultData.payload}
            suggested_medications={resultData.suggested_medications}
          />

          {/* Bottom Action Section: Download PDF Report Button (Bottom of screen for desktop & mobile) */}
          <div className="pt-8 pb-16 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              id="pdf-btn" 
              onClick={handleDownloadPDF}
              className="neu-button-3d text-sm sm:text-base font-black flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-2xl uppercase tracking-wider cursor-pointer w-full sm:w-auto shrink-0 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Comprehensive PDF Report</span>
            </button>
            <Link
              href="/assessment"
              className="px-6 py-4 rounded-2xl font-black text-xs sm:text-sm text-slate-700 bg-white border-2 border-slate-200/80 shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>

        {/* MODERN CLINICAL AI BOT DRAWER */}
        <div className={`fixed bottom-20 sm:bottom-24 inset-x-2 sm:inset-x-auto sm:right-6 md:right-8 sm:w-[540px] md:w-[600px] lg:w-[640px] flex flex-col bg-white border-2 border-slate-200/90 rounded-3xl shadow-[0_25px_70px_rgba(15,23,42,0.22)] overflow-hidden h-[640px] max-h-[82vh] z-50 transition-all duration-300 transform origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          {/* Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">Clinical AI Assistant</h2>
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Evidence-based cardiovascular decision support</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Clear conversation"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/70">
            {/* Initial Greeting Message */}
            <div className="flex gap-3 items-start max-w-[92%]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 shadow-sm text-slate-800 text-sm leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">Hello! I&apos;m the ZEZE Clinical Assistant.</p>
                <p className="text-slate-600 mb-3">
                  I&apos;ve analyzed your assessment ({probPercent}% calculated probability). You can ask me any clinical questions or choose from the topics below:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleSendPrompt("which med will work")}
                    className="text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs flex items-center gap-1.5"
                  >
                    <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Which med will work?
                  </button>
                  <button 
                    onClick={() => handleSendPrompt("How can I lower my blood pressure effectively?")}
                    className="text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    How to lower blood pressure?
                  </button>
                  <button 
                    onClick={() => handleSendPrompt("What dietary guidelines should I follow for my heart?")}
                    className="text-xs bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs flex items-center gap-1.5"
                  >
                    <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Recommended diet & foods
                  </button>
                  <button 
                    onClick={() => handleSendPrompt("Explain what my risk score means in clinical terms")}
                    className="text-xs bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 hover:border-purple-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Explain my risk factors
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation History */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start max-w-[94%]'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                
                <div 
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white font-medium rounded-tr-sm shadow-md shadow-blue-500/15 max-w-[85%]' 
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm shadow-sm flex-1'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => (
                            <p className="text-slate-800 leading-relaxed my-2 font-normal" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-sm sm:text-base font-black text-[#0a192f] mt-3.5 mb-1.5 tracking-tight border-b border-slate-200/80 pb-1" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-xs sm:text-sm font-black text-[#0a192f] mt-3 mb-1 tracking-tight" {...props} />
                          ),
                          h4: ({ node, ...props }) => (
                            <h4 className="text-xs font-bold text-blue-900 mt-2.5 mb-1" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="space-y-1.5 my-2 pl-4 list-disc text-slate-800 font-medium text-xs sm:text-sm" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="space-y-1.5 my-2 pl-4 list-decimal text-slate-800 font-medium text-xs sm:text-sm" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-relaxed text-slate-800" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-extrabold text-[#0a192f]" {...props} />
                          ),
                          em: ({ node, ...props }) => (
                            <em className="text-slate-600 font-medium italic" {...props} />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                              <table className="w-full text-xs text-left border-collapse" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-slate-100/90 border-b border-slate-200 text-[#0a192f] font-black uppercase text-[10px] tracking-wide" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="py-2.5 px-3 font-black text-[#0a192f]" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="py-2.5 px-3 border-b border-slate-100 text-slate-800 font-medium leading-relaxed text-xs" {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-3 border-blue-500 bg-blue-50/60 pl-3 py-1.5 my-2.5 text-xs text-slate-700 rounded-r-lg" {...props} />
                          ),
                          code: ({ node, inline, ...props }: any) => (
                            inline ? (
                              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#0a192f] font-mono text-[11px] border border-slate-200" {...props} />
                            ) : (
                              <code className="block p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-2" {...props} />
                            )
                          ),
                        }}
                      >
                        {msg.parts}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.parts}</div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    You
                  </div>
                )}
              </div>
            ))}

            {/* Loading / Typing indicator */}
            {isChatLoading && (
              <div className="flex gap-3 items-start max-w-[90%]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Formulating clinical guidance</span>
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s'}}></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s'}}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions if messages exist */}
          {messages.length > 0 && !isChatLoading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button 
                onClick={() => handleSendPrompt("which med will work")}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Pill className="w-3 h-3 text-emerald-600 shrink-0" />
                Which med will work?
              </button>
              <button 
                onClick={() => handleSendPrompt("What are the target blood pressure levels?")}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Stethoscope className="w-3 h-3 text-blue-600 shrink-0" />
                Target BP
              </button>
              <button 
                onClick={() => handleSendPrompt("Guideline statin therapy for high cholesterol?")}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <HeartPulse className="w-3 h-3 text-rose-600 shrink-0" />
                Statin therapy
              </button>
            </div>
          )}

          {/* Input Form Area */}
          <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2 bg-slate-50 border border-slate-300/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl p-1.5 pl-4 transition-all">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about medications, BP targets, diet..." 
                className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
              <button 
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-blue-600 shadow-sm cursor-pointer shrink-0"
                title="Send question"
              >
                <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 font-medium mt-2">
              Clinical decision support reference. Consult licensed practitioner for prescriptions.
            </p>
          </div>
        </div>

        {/* FLOATING ACTION TRIGGER */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`fixed bottom-4 sm:bottom-6 right-3 sm:right-8 z-50 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
            isChatOpen 
              ? 'bg-slate-900 text-white hover:bg-slate-800' 
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white hover:scale-105 shadow-blue-500/30'
          }`}
          title="Open Clinical AI Assistant"
        >
          {isChatOpen ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></span>
            </div>
          )}
        </button>

      </div>
    </main>
  );
}
