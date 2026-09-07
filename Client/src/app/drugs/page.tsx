"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AppNavbar from "@/components/AppNavbar";
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Send,
  Download,
  RotateCcw,
  FileText,
  ArrowRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SourceMetadata {
  name: string;
  url?: string;
  source_type: string;
  retrieved_at: string;
}

interface ConditionEntity {
  name: string;
  normalized_name?: string;
  identifier?: string;
}

interface DrugEntity {
  name: string;
  generic_name?: string;
  rxnorm_id?: string;
  drug_class: string[];
  indications: string[];
  contraindications: string[];
  warnings: string[];
  adverse_reactions: string[];
  dosage_information: string[];
  interactions: string[];
  evidence: string[];
  sources: SourceMetadata[];
}

interface DrugSearchResponse {
  query: string;
  condition?: ConditionEntity;
  drugs: DrugEntity[];
  report: string;
  limitations: string[];
  retrieval_metadata: {
    sources_used?: string[];
    total_drugs_retrieved?: number;
    retrieved_at?: string;
    intent?: string;
  };
}

// Clean, uniform inquiry suggestions (no emoji clutter, matching neumorphic buttons)
const QUICK_QUERIES = [
  { label: "Type 2 Diabetes", query: "Drugs used for type 2 diabetes" },
  { label: "Hypertension", query: "Medications commonly used for hypertension" },
  { label: "Heart Failure", query: "What drugs are associated with heart failure?" },
  { label: "Metformin", query: "Tell me about metformin" },
  { label: "Atorvastatin", query: "Atorvastatin indications and warnings" },
  { label: "Empagliflozin", query: "Empagliflozin clinical evidence" },
];

const FOLLOW_UP_PROMPTS = [
  "What are the most common side effects?",
  "Can this medication be taken with meals?",
  "What clinical monitoring is required during the first month?",
  "What should I do if a dose is accidentally missed?",
  "Are there alternative medications if this is not tolerated?",
];

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const PROGRESS_STAGES = [
  { percent: 10, message: "Connecting to openFDA & NLM RxNorm databases...", minDuration: 320 },
  { percent: 22, message: "Identifying active molecular compounds & drug classes...", minDuration: 380 },
  { percent: 35, message: "Evaluating approved clinical indications & dosage regimens...", minDuration: 420 },
  { percent: 50, message: "Screening boxed warnings, adverse reactions & safety alerts...", minDuration: 450 },
  { percent: 70, message: "Cross-referencing evidence guidelines & interaction matrices...", minDuration: 450 },
  { percent: 85, message: "Synthesizing clinical medical intelligence report...", minDuration: 480 },
  { percent: 90, message: "Finalizing comprehensive clinical evidence summary...", minDuration: 500 },
];

function DrugSearchContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "clinician";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(10);
  const [statusMessage, setStatusMessage] = useState("Connecting to openFDA & NLM RxNorm databases...");
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<DrugSearchResponse | null>(null);

  // Active view: 'report' | 'drugs' | 'sources'
  const [activeTab, setActiveTab] = useState<"report" | "drugs" | "sources">("report");

  // Expanded drug card indexes
  const [expandedDrugs, setExpandedDrugs] = useState<Record<number, boolean>>({ 0: true, 1: true });

  // Patient Context drawer
  const [showPatientContext, setShowPatientContext] = useState(false);
  const [patientEgfr, setPatientEgfr] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientPregnancy, setPatientPregnancy] = useState(false);
  const [patientAllergies, setPatientAllergies] = useState("");

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Follow-up chat state
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Progress animation refs
  const simulationAbortedRef = useRef(false);
  const creepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialSearchDoneRef = useRef(false);

  const stopProgressSimulation = () => {
    simulationAbortedRef.current = true;
    if (creepTimerRef.current) {
      clearInterval(creepTimerRef.current);
      creepTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopProgressSimulation();
  }, []);

  // Session storage persistence & auto-search
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlQuery = searchParams.get("q") || searchParams.get("query");
      const savedResult = sessionStorage.getItem("zeze_drug_result");
      const savedQuery = sessionStorage.getItem("zeze_drug_query");
      const savedChat = sessionStorage.getItem("zeze_drug_chat");

      if (savedChat) {
        try {
          setChatMessages(JSON.parse(savedChat));
        } catch (e) {}
      }

      if (urlQuery && urlQuery.trim()) {
        const trimmedUrlQ = urlQuery.trim();
        // If we already have this exact query cached in session, restore immediately without re-querying!
        if (
          savedResult &&
          savedQuery &&
          savedQuery.toLowerCase() === trimmedUrlQ.toLowerCase()
        ) {
          try {
            const parsed = JSON.parse(savedResult);
            setSearchResult(parsed);
            setQuery(savedQuery);
            initialSearchDoneRef.current = true;
            return;
          } catch (e) {}
        }
        if (!initialSearchDoneRef.current) {
          initialSearchDoneRef.current = true;
          setQuery(trimmedUrlQ);
          handleSearch(trimmedUrlQ);
        }
      } else if (savedResult && savedQuery) {
        // Navigated via navbar (no query in URL) -> restore previous search result!
        try {
          const parsed = JSON.parse(savedResult);
          setSearchResult(parsed);
          setQuery(savedQuery);
        } catch (e) {}
      }
    }
  }, [searchParams]);

  // Sync follow-up chat to session
  useEffect(() => {
    if (typeof window !== "undefined" && chatMessages.length > 0) {
      sessionStorage.setItem("zeze_drug_chat", JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!q) return;

    if (searchQuery !== undefined) {
      setQuery(searchQuery);
    }

    setLoading(true);
    setError(null);
    simulationAbortedRef.current = false;
    if (creepTimerRef.current) {
      clearInterval(creepTimerRef.current);
      creepTimerRef.current = null;
    }

    // Set initial 10% step
    setProgressPercent(10);
    setStatusMessage("Connecting to openFDA & NLM RxNorm databases...");

    // Progressive stage promise: guarantees user sees the full sequence 10% -> 22% -> 35% -> 50% -> 70% -> 85% -> 90%
    const runStages = async () => {
      for (let i = 0; i < PROGRESS_STAGES.length; i++) {
        if (simulationAbortedRef.current) return;
        const stage = PROGRESS_STAGES[i];
        setProgressPercent(stage.percent);
        setStatusMessage(stage.message);
        await new Promise((res) => setTimeout(res, stage.minDuration));
      }
      if (simulationAbortedRef.current) return;
      // Start slow creeping between 90% and 94% until the backend completes
      let currentVal = 90;
      creepTimerRef.current = setInterval(() => {
        if (simulationAbortedRef.current) {
          if (creepTimerRef.current) clearInterval(creepTimerRef.current);
          return;
        }
        if (currentVal < 94) {
          currentVal += 1;
          setProgressPercent(currentVal);
        }
      }, 1000);
    };

    const stagesPromise = runStages();

    // Start backend request
    let patient_context: Record<string, any> | undefined = undefined;
    if (patientEgfr || patientAge || patientPregnancy || patientAllergies) {
      patient_context = {};
      if (patientEgfr) patient_context.egfr = parseFloat(patientEgfr);
      if (patientAge) patient_context.age = parseFloat(patientAge);
      if (patientPregnancy) patient_context.pregnant = true;
      if (patientAllergies) {
        patient_context.allergies = patientAllergies.split(",").map((a) => a.trim());
      }
    }

    const fetchPromise = (async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const res = await fetch(`${baseUrl}/api/drugs/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, patient_context, role: roleParam }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error (${res.status})`);
      }

      return (await res.json()) as DrugSearchResponse;
    })();

    try {
      // 1. Wait for the backend data
      const data = await fetchPromise;

      // 2. Even if the report arrives faster, let the loading animation complete its stages first
      await stagesPromise;

      // 3. Stop creep timer
      if (creepTimerRef.current) {
        clearInterval(creepTimerRef.current);
        creepTimerRef.current = null;
      }

      // 4. Smoothly hit 100% and show "Summary ready!"
      setStatusMessage("Summary ready!");
      setProgressPercent(100);

      // 5. Brief display of 100% completion before revealing the report
      await new Promise((resolve) => setTimeout(resolve, 400));

      setSearchResult(data);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("zeze_drug_result", JSON.stringify(data));
        sessionStorage.setItem("zeze_drug_query", q);
      }
      setExpandedDrugs({ 0: true, 1: true });
      setChatMessages([]);
      setChatError(null);
    } catch (err: any) {
      stopProgressSimulation();
      console.error("Drug search failed:", err);
      setError(err.message || "Failed to retrieve drug information. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandDrug = (idx: number) => {
    setExpandedDrugs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyReport = () => {
    if (!searchResult?.report) return;
    navigator.clipboard.writeText(searchResult.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearReport = () => {
    setSearchResult(null);
    setQuery("");
    setChatMessages([]);
    setChatError(null);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("zeze_drug_result");
      sessionStorage.removeItem("zeze_drug_query");
      sessionStorage.removeItem("zeze_drug_chat");
      window.history.replaceState({}, "", `/drugs?role=${roleParam}`);
    }
    setTimeout(() => {
      const input = document.getElementById("drug-search-input");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleDownloadPDF = () => {
    if (!searchResult) return;

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
      let cursorY = 24;

      // Clean all non-ASCII / Unicode artifacts that break Helvetica kerning & font metrics
      const cleanPdfText = (str: string): string => {
        if (!str) return "";
        return str
          .replace(/[\u202f\u00a0]/g, " ") // narrow non-breaking space / nbsp -> standard space
          .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-") // unicode dashes/hyphens -> standard dash
          .replace(/[\u2018\u2019]/g, "'") // curly single quotes -> standard quote
          .replace(/[\u201c\u201d]/g, '"') // curly double quotes -> standard double quote
          .replace(/\u2026/g, "...") // ellipsis
          .replace(/\u2265/g, ">=") // >=
          .replace(/\u2264/g, "<=") // <=
          .replace(/[\u2022\u25cf\u25cb]/g, "-") // bullet characters
          .replace(/[^\x20-\x7E\n]/g, " ") // replace any remaining non-ascii with space
          .replace(/[ \t]+/g, " "); // collapse multiple spaces
      };

      const drawHeader = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 43, 92);
        pdf.text("ZEZE MED AI  |  CLINICAL DRUG INTELLIGENCE", margin, 14);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          `Date: ${new Date().toLocaleDateString()}`,
          pageWidth - margin,
          14,
          { align: "right" }
        );

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

      // 2. Report Overview Card
      pdf.setFillColor(244, 248, 253);
      pdf.setDrawColor(191, 219, 254);
      pdf.roundedRect(margin, cursorY, contentWidth, 23, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(15, 43, 92);
      pdf.text("Evidence-Based Drug Intelligence Report", margin + 4, cursorY + 7);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(29, 78, 216);
      pdf.text(cleanPdfText(`Inquiry Query: "${searchResult.query}"`), margin + 4, cursorY + 13.5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      const conditionName =
        searchResult.condition?.normalized_name ||
        searchResult.condition?.name ||
        "Targeted Clinical Evaluation";
      pdf.text(
        cleanPdfText(`Indication: ${conditionName}  |  Medications Evaluated: ${searchResult.drugs.length}  |  Sources: openFDA, NLM RxNorm, ACC/AHA`),
        margin + 4,
        cursorY + 19.5
      );

      cursorY += 28;

      // 3. Parse Markdown line by line
      const rawLines = (searchResult.report || "").split("\n");
      let idx = 0;

      while (idx < rawLines.length) {
        const originalLine = rawLines[idx];
        const trimmed = originalLine.trim();

        // Blank lines
        if (!trimmed) {
          cursorY += 2;
          idx++;
          continue;
        }

        // Horizontal Separator (---, ***, ___)
        if (/^[-*_]{3,}$/.test(trimmed)) {
          checkPageBreak(8);
          cursorY += 2;
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.3);
          pdf.line(margin, cursorY, margin + contentWidth, cursorY);
          cursorY += 4;
          idx++;
          continue;
        }

        // Markdown Table Block
        if (trimmed.startsWith("|")) {
          const tableLines: string[] = [];
          while (idx < rawLines.length && rawLines[idx].trim().startsWith("|")) {
            tableLines.push(rawLines[idx].trim());
            idx++;
          }

          if (tableLines.length >= 2) {
            const isSeparator = (line: string) => line.replace(/[|\s-:]/g, "").length === 0;

            const parsedRows = tableLines
              .map((line) =>
                line
                  .split("|")
                  .slice(1, -1)
                  .map((cell) =>
                    cleanPdfText(
                      cell
                        .replace(/\*\*/g, "")
                        .replace(/`/g, "")
                        .trim()
                    )
                  )
              )
              .filter((row, rIdx) => {
                if (rIdx === 1 && isSeparator(tableLines[1])) return false;
                return row.some((c) => c.length > 0);
              });

            if (parsedRows.length >= 2) {
              const head = [parsedRows[0]];
              const body = parsedRows.slice(1);
              const colCount = head[0].length;

              // Tailored column widths to prevent overlapping
              let columnStyles: Record<number, any> = {};
              if (colCount === 6) {
                columnStyles = {
                  0: { cellWidth: 8, halign: "center" }, // #
                  1: { cellWidth: 26, fontStyle: "bold" }, // Medication
                  2: { cellWidth: 22 }, // Generic Name
                  3: { cellWidth: 15, halign: "center" }, // RxCUI
                  4: { cellWidth: 50 }, // Drug Class
                  5: { cellWidth: "auto" }, // Key Guideline / Trial Benchmark
                };
              } else if (colCount <= 3) {
                columnStyles = {
                  0: { cellWidth: 25, fontStyle: "bold" },
                  1: { cellWidth: 35 },
                  2: { cellWidth: "auto" },
                };
              }

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
                  cellPadding: 2.5,
                  overflow: "linebreak",
                  textColor: [51, 65, 85],
                  lineColor: [226, 232, 240],
                  lineWidth: 0.2,
                },
                headStyles: {
                  fillColor: [30, 58, 138], // Deep navy
                  textColor: [255, 255, 255],
                  fontStyle: "bold",
                  fontSize: 7.8,
                  halign: "left",
                },
                alternateRowStyles: {
                  fillColor: [248, 250, 252],
                },
                columnStyles,
                didDrawPage: () => {
                  drawHeader();
                },
              });

              cursorY = (pdf as any).lastAutoTable?.finalY
                ? (pdf as any).lastAutoTable.finalY + 6
                : cursorY + 20;
            }
          }
          continue;
        }

        // Headings (Level 1 to 5)
        if (/^#{1,5}\s+/.test(trimmed)) {
          const headingLevel = trimmed.match(/^(#{1,5})\s+/)?.[1].length || 2;
          const rawHeadingText = trimmed.replace(/^#{1,5}\s+/, "").replace(/\*\*/g, "").trim();
          const cleanHeading = cleanPdfText(rawHeadingText);

          if (headingLevel === 1) {
            checkPageBreak(14);
            cursorY += 4;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(13);
            pdf.setTextColor(15, 43, 92);
            pdf.text(cleanHeading, margin, cursorY + 4);
            cursorY += 9;
          } else if (headingLevel === 2) {
            checkPageBreak(12);
            cursorY += 3;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11.5);
            pdf.setTextColor(15, 43, 92);
            pdf.text(cleanHeading, margin, cursorY + 4);
            cursorY += 8;
          } else if (headingLevel === 3) {
            checkPageBreak(10);
            cursorY += 3;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10.5);
            pdf.setTextColor(29, 78, 216);
            pdf.text(cleanHeading, margin, cursorY + 3.5);

            pdf.setDrawColor(191, 219, 254);
            pdf.setLineWidth(0.35);
            pdf.line(margin, cursorY + 5.5, margin + 45, cursorY + 5.5);

            cursorY += 8;
          } else {
            // Level 4/5: E.g., #### 1. Amlodipine besylate tablets...
            checkPageBreak(9);
            cursorY += 2.5;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(15, 43, 92);
            const wrapped = pdf.splitTextToSize(cleanHeading, contentWidth);
            pdf.text(wrapped, margin, cursorY + 3.5);
            cursorY += wrapped.length * 4.2 + 2;
          }
          idx++;
          continue;
        }

        // Bullet points & Lists (- , * , + , or 1. )
        if (/^(\s*[-*+]|\s*\d+\.)\s+/.test(originalLine)) {
          const isIndented = /^\s{2,}/.test(originalLine);
          const indentOffset = isIndented ? 6 : 0;
          const bulletSymbol = isIndented ? "-" : "•";

          const contentAfterBullet = originalLine
            .replace(/^\s*[-*+]\s+/, "")
            .replace(/^\s*\d+\.\s+/, "");

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
              pdf.setTextColor(29, 78, 216);
              pdf.text(bulletSymbol, margin + indentOffset + 1, cursorY + 3.5);

              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(51, 65, 85);
              pdf.text(wrapped, margin + indentOffset + 5, cursorY + 3.5);

              cursorY += wrapped.length * 4.2 + 1.5;
            } else {
              checkPageBreak(7);
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(8.5);
              pdf.setTextColor(29, 78, 216);
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
            pdf.setTextColor(29, 78, 216);
            pdf.text(bulletSymbol, margin + indentOffset + 1, cursorY + 3.5);

            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(51, 65, 85);
            pdf.text(wrapped, margin + indentOffset + 5, cursorY + 3.5);

            cursorY += wrapped.length * 4.2 + 1.5;
          }

          idx++;
          continue;
        }

        // Blockquote (> ...)
        if (trimmed.startsWith(">")) {
          const quoteText = cleanPdfText(trimmed.replace(/^>\s*/, "").replace(/\*\*/g, "").trim());
          const wrapped = pdf.splitTextToSize(quoteText, contentWidth - 8);
          const neededH = wrapped.length * 4.2 + 4;
          checkPageBreak(neededH);

          pdf.setDrawColor(59, 130, 246);
          pdf.setLineWidth(0.8);
          pdf.line(margin + 1, cursorY + 1, margin + 1, cursorY + neededH - 1);

          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          pdf.text(wrapped, margin + 5, cursorY + 3.5);

          cursorY += neededH + 1;
          idx++;
          continue;
        }

        // Standard Paragraph
        const cleanPara = cleanPdfText(trimmed.replace(/\*\*/g, "").replace(/`/g, "").trim());
        if (cleanPara) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85);

          const wrapped = pdf.splitTextToSize(cleanPara, contentWidth);
          const neededH = wrapped.length * 4.2 + 2;
          checkPageBreak(neededH);

          pdf.text(wrapped, margin, cursorY + 3.5);
          cursorY += wrapped.length * 4.2 + 2.5;
        }
        idx++;
      }

      // 4. Clinical Evidence Source Endorsement & Disclaimer
      checkPageBreak(22);
      pdf.setFillColor(244, 248, 253);
      pdf.setDrawColor(191, 219, 254);
      pdf.roundedRect(margin, cursorY + 3, contentWidth, 16, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 43, 92);
      pdf.text("OFFICIAL MEDICAL CITATION & EVIDENCE SOURCE", margin + 3, cursorY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);
      pdf.text(
        "Data synthesized from official FDA drug labels via openFDA and normalized through NLM RxNorm. Formulated according to ACC/AHA clinical practice guidelines.",
        margin + 3,
        cursorY + 12
      );
      pdf.text(
        "Clinical Disclaimer: For informational decision support. Prescribing clinicians must review full individual patient history.",
        margin + 3,
        cursorY + 16
      );

      // 5. Number all pages cleanly with footer
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
          "ZEZE Medical AI • Clinical Drug Intelligence • Confidential",
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

      const safeFilename = `ZEZE_Drug_Report_${(
        searchResult.condition?.normalized_name ||
        searchResult.query ||
        "report"
      )
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 30)}.pdf`;

      pdf.save(safeFilename);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  const handleSendFollowUp = async (customPrompt?: string) => {
    const textToSend = (customPrompt || chatInput).trim();
    if (!textToSend || !searchResult || chatLoading) return;

    if (!customPrompt) {
      setChatInput("");
    }
    setChatError(null);

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const historyPayload = chatMessages.map((m) => ({
        role: m.role,
        parts: m.content,
      }));

      const contextPayload = `Condition/Search Query: ${searchResult.query}\nRetrieved Medications: ${searchResult.drugs.map((d) => `${d.name} (${d.drug_class.join(", ")})`).join("; ")}\nSynthesized Medical Intelligence Report:\n${searchResult.report}`;

      const res = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          context: contextPayload,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat follow-up failed (${res.status})`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "I could not generate a response at this time. Please consult a licensed provider.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      console.error("Chat follow-up error:", err);
      setChatError("Unable to retrieve an answer right now. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative px-3 sm:px-4 lg:px-6 xl:px-8 pt-2 sm:pt-3 pb-20 sm:pb-16 overflow-y-auto bg-[#e8ecf2]">
      <div className="w-full max-w-[1720px] mx-auto relative z-10 px-0.5 sm:px-2">
        <div className="w-full mb-12 sm:mb-16 space-y-5 sm:space-y-8">
          
          {/* Universal App Navigation Bar - Exactly Unchanged Across the Application */}
          <AppNavbar currentRole={roleParam} pageType="drugs" />

          {/* Clean Section Header (Matching ResultCard / Assessment) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 pt-0.5 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb] animate-pulse shrink-0"></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0a192f] leading-tight">
                  Authoritative Drug Reference &amp; Clinical Intelligence
                </h1>
                <p className="text-slate-500 font-extrabold tracking-widest uppercase text-[10px] sm:text-xs mt-0.5">
                  Evidence-Based Medical Formulary • openFDA &amp; NLM RxNorm Verified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href={`/assessment?role=${roleParam}`}
                className="neu-button-secondary px-3.5 py-1.5 text-xs font-black text-slate-700 hover:text-blue-800 transition-all rounded-xl cursor-pointer"
              >
                ← Back to Assessment
              </Link>
            </div>
          </div>

          {/* Unified Neumorphic Search Card (Spacious, Clear, Non-Congested) */}
          <div className="p-5 sm:p-7 md:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Search Disease Indications or Medications
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 leading-relaxed">
                Query official medical databases for approved treatments, mechanisms, contraindications, and national clinical guidelines.
              </p>
            </div>

            {/* Inset Search Field & 3D Action Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  id="drug-search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by condition or drug (e.g. 'Type 2 diabetes' or 'Metformin')..."
                  className="w-full neu-inset bg-[#edf3f9] rounded-2xl px-5 py-3.5 text-sm sm:text-base font-semibold text-[#0a192f] placeholder-slate-400 focus:outline-hidden border border-white/80 shadow-inner"
                  disabled={loading}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPatientContext(!showPatientContext)}
                className={`neu-button-secondary px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer transition-all ${
                  showPatientContext || patientEgfr || patientAge
                    ? "bg-blue-100 text-blue-900 border-blue-300"
                    : "text-slate-700"
                }`}
              >
                Safety Filter
              </button>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="neu-button-3d px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider text-white shrink-0 disabled:opacity-50 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Optional Patient Context Drawer */}
            {showPatientContext && (
              <div className="p-4 sm:p-5 rounded-2xl neu-inset bg-[#edf3f9] border border-white/80 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Personalized Safety Parameters (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPatientContext(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">eGFR (mL/min/1.73m²)</label>
                    <input
                      type="number"
                      value={patientEgfr}
                      onChange={(e) => setPatientEgfr(e.target.value)}
                      placeholder="e.g. 55"
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="e.g. 68"
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="pregnancyCheck"
                      checked={patientPregnancy}
                      onChange={(e) => setPatientPregnancy(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="pregnancyCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Pregnant / Lactating
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Allergies</label>
                    <input
                      type="text"
                      value={patientAllergies}
                      onChange={(e) => setPatientAllergies(e.target.value)}
                      placeholder="e.g. Sulfa, Penicillin"
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Common Inquiries (Clean Neumorphic Secondary Buttons) */}
            <div className="pt-4 border-t border-slate-200/70 space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Common Inquiries
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {QUICK_QUERIES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSearch(item.query)}
                    disabled={loading}
                    className="neu-button-secondary px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading Progress State */}
          {loading && (
            <div className="neu-flat rounded-3xl p-8 max-w-xl mx-auto text-center bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] border border-slate-200/80 my-8 space-y-4">
              <h3 className="text-base font-black text-[#0a192f]">
                Retrieving Official Medication Evidence
              </h3>
              <p className="text-xs text-blue-800 font-bold min-h-[1.25rem]">
                {statusMessage}
              </p>
              <div className="w-full bg-[#edf3f9] h-3.5 rounded-full overflow-hidden p-0.5 border border-white/80 neu-inset shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full rounded-full transition-all duration-400 ease-out shadow-[0_0_12px_rgba(37,99,235,0.45)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                <span>Querying openFDA &amp; NLM RxNorm</span>
                <span className="font-extrabold text-blue-800">{Math.round(progressPercent)}%</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && !loading && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Results Area */}
          {searchResult && !loading && (
            <div className="space-y-6 sm:space-y-8">
              
              {/* Tab Switcher & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Results For
                    </span>
                    {searchResult.condition && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-200">
                        {searchResult.condition.normalized_name || searchResult.condition.name}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {searchResult.drugs.length} Medications
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-[#0a192f] mt-1">
                    &ldquo;{searchResult.query}&rdquo;
                  </h2>
                </div>

                {/* View Switcher Tabs using standard button sizes */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("report")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      activeTab === "report"
                        ? "neu-button-3d text-white"
                        : "neu-button-secondary text-slate-700 hover:text-blue-800"
                    }`}
                  >
                    Medical Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("drugs")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      activeTab === "drugs"
                        ? "neu-button-3d text-white"
                        : "neu-button-secondary text-slate-700 hover:text-blue-800"
                    }`}
                  >
                    Medication Profiles ({searchResult.drugs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("sources")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      activeTab === "sources"
                        ? "neu-button-3d text-white"
                        : "neu-button-secondary text-slate-700 hover:text-blue-800"
                    }`}
                  >
                    Official Sources
                  </button>
                </div>
              </div>

              {/* TAB 1: Clinical Medical Summary (Spacious, Dark High-Contrast Text) */}
              {activeTab === "report" && (
                <div className="p-6 sm:p-8 md:p-10 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#0a192f]">
                        Synthesized Medical Intelligence Report
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Structured clinical synthesis from peer-reviewed evidence &amp; FDA databases
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearReport}
                        className="neu-button-secondary px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-800 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                        title="Clear this report and search another drug"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Explore Another Medication</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="neu-button-3d text-white px-3.5 py-1.5 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                        title="Download structured evidence report as PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyReport}
                        className="neu-button-secondary px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-800 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Copy markdown text to clipboard"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Render Markdown with Dark Text and Generous Paragraph Spacing */}
                  <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed space-y-5">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="text-slate-800 text-sm sm:text-base leading-relaxed my-4 font-normal" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200 neu-inset p-2 bg-white/95 shadow-inner">
                            <table className="w-full text-xs sm:text-sm text-left border-collapse" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-100 border-b border-slate-200 text-[#0a192f] font-black uppercase text-xs tracking-wider" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="py-3.5 px-4 font-black text-[#0a192f]" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="py-3.5 px-4 border-b border-slate-100 text-slate-800 font-medium leading-relaxed" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-lg sm:text-2xl font-black text-[#0a192f] tracking-tight mt-8 mb-4 pb-2 border-b border-slate-200" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-base sm:text-lg font-black text-[#0a192f] mt-7 mb-3 pb-1 border-b border-slate-200" {...props} />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 className="text-sm font-bold text-blue-950 mt-5 mb-2" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="space-y-3 my-4 pl-6 list-disc text-slate-800 font-medium text-sm sm:text-base" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed text-slate-800" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-extrabold text-[#0a192f]" {...props} />
                        ),
                      }}
                    >
                      {searchResult.report}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* TAB 2: Medication Profiles Cards */}
              {activeTab === "drugs" && (
                <div className="space-y-5">
                  {searchResult.drugs.map((drug, idx) => {
                    const isExpanded = !!expandedDrugs[idx];
                    return (
                      <div
                        key={idx}
                        className="neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] overflow-hidden"
                      >
                        <div
                          onClick={() => toggleExpandDrug(idx)}
                          className="p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-base sm:text-lg font-black text-[#0a192f]">
                                {drug.name}
                              </h3>
                              {drug.generic_name && (
                                <span className="text-xs text-slate-500 font-semibold">
                                  ({drug.generic_name})
                                </span>
                              )}
                            </div>
                            {drug.drug_class.length > 0 && (
                              <p className="text-xs font-bold text-blue-900 mt-1">
                                {drug.drug_class.join(", ")}
                              </p>
                            )}
                          </div>
                          <button type="button" className="text-slate-500 hover:text-slate-800">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-200/60 space-y-4 text-xs sm:text-sm">
                            {drug.indications.length > 0 && (
                              <div>
                                <strong className="text-slate-900 block font-black uppercase text-[11px] mb-1">Approved Indications</strong>
                                <p className="text-slate-700 leading-relaxed font-medium">{drug.indications.slice(0, 3).join("; ")}</p>
                              </div>
                            )}
                            {drug.dosage_information.length > 0 && (
                              <div className="p-3.5 rounded-2xl neu-inset bg-slate-50/70 border border-slate-200/70">
                                <strong className="text-slate-900 block font-black uppercase text-[11px] mb-1">Dosage Guidance</strong>
                                <p className="text-slate-800 leading-relaxed font-medium">{drug.dosage_information[0]}</p>
                              </div>
                            )}
                            {drug.adverse_reactions.length > 0 && (
                              <div>
                                <strong className="text-slate-900 block font-black uppercase text-[11px] mb-1">Common Reactions &amp; Warnings</strong>
                                <p className="text-slate-700 leading-relaxed font-medium">{drug.adverse_reactions.slice(0, 3).join(" • ")}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: Official Sources */}
              {activeTab === "sources" && (
                <div className="p-6 sm:p-8 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] space-y-4">
                  <h3 className="text-base font-black text-[#0a192f]">
                    Verified Public Health Sources
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/90 text-[#0a192f] font-black uppercase text-[11px] tracking-wider">
                          <th className="py-3 px-4">Authority</th>
                          <th className="py-3 px-4">Repository</th>
                          <th className="py-3 px-4">Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                        <tr>
                          <td className="py-3 px-4 font-bold">U.S. Food &amp; Drug Administration (FDA)</td>
                          <td className="py-3 px-4">openFDA Drug Labeling Database</td>
                          <td className="py-3 px-4">
                            <a href="https://open.fda.gov/apis/drug/label/" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1 font-bold">
                              <span>open.fda.gov</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold">National Library of Medicine (NLM)</td>
                          <td className="py-3 px-4">RxNorm Clinical Drug Ontologies</td>
                          <td className="py-3 px-4">
                            <a href="https://rxnav.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1 font-bold">
                              <span>rxnav.nlm.nih.gov</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FOLLOW-UP QUESTIONS CHAT (Spacious, Neumorphic, Dark Text) */}
              <div className="p-6 sm:p-8 md:p-10 neu-flat rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-[#eef3f8]/90 shadow-[6px_6px_20px_rgba(163,177,198,0.35),-6px_-6px_20px_rgba(255,255,255,0.9)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/70">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#0a192f]">
                      Follow-Up Clinical Questions
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 leading-relaxed">
                      Ask questions grounded directly in the retrieved clinical evidence and FDA monographs.
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 self-start sm:self-auto">
                    Evidence-Grounded Assistant
                  </span>
                </div>

                {/* Prompt Suggestions */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    Suggested Questions
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {FOLLOW_UP_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendFollowUp(prompt)}
                        disabled={chatLoading}
                        className="neu-button-secondary px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-800 transition-all cursor-pointer text-left active:scale-95 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversation Thread */}
                {chatMessages.length > 0 && (
                  <div className="space-y-4 pt-2 max-h-[500px] overflow-y-auto pr-1 divide-y divide-slate-200/70">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col pt-4 ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-3xl p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white shadow-xs rounded-br-xs font-semibold"
                              : "neu-inset bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-inner"
                          }`}
                        >
                          {msg.role === "assistant" ? (
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
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1 font-semibold">
                          {msg.role === "user" ? "You" : "ZEZE Clinical AI"} • {msg.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 w-fit">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Reviewing FDA monographs and synthesizing advice...</span>
                  </div>
                )}

                {chatError && (
                  <p className="text-xs text-rose-700 font-semibold">{chatError}</p>
                )}

                {/* Text Input & Submit */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendFollowUp();
                  }}
                  className="flex items-center gap-3 pt-3 border-t border-slate-200/60"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about side effects, precautions, interactions, or dosage..."
                    disabled={chatLoading}
                    className="w-full neu-inset bg-[#edf3f9] rounded-2xl px-5 py-3 text-xs sm:text-sm text-slate-900 font-semibold placeholder-slate-400 focus:outline-hidden border border-white/80 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="neu-button-3d px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white shrink-0 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <span>Ask</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Medical Notice (Spacious & Clean) */}
              <div className="p-4 sm:p-5 rounded-2xl neu-inset bg-[#edf3f9] border border-white/80 text-xs text-slate-600 leading-relaxed font-medium shadow-inner">
                <span className="font-black uppercase tracking-wider mr-1 text-slate-800">
                  Notice:
                </span>
                This clinical intelligence search retrieves information from verified public regulatory repositories (openFDA, NLM RxNorm). It is provided for educational and clinical decision-support purposes and does not substitute professional medical judgment.
              </div>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}

export default function DrugSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#e8ecf2]">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <DrugSearchContent />
    </Suspense>
  );
}
