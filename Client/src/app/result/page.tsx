"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import ResultCard from '@/components/ResultCard';

type ChatMessage = { role: "user" | "model"; parts: string };

type ResultPayload = {
  risk: string;
  probability: number;
  explanation: string;
  payload?: Record<string, unknown>;
  feature_impacts?: Record<string, number>;
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
        }
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
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const dateStr = new Date().toLocaleDateString();
      const role = (resultData.payload?.role as string) || 'patient';
      
      let themeTitle = "What do your test results mean?";
      let themeHeader = "ZEZE";
      let titleColor = [23, 128, 93]; // Medical emerald green
      let lineColor = [167, 243, 208];
      
      if (role === 'clinician' || role === 'practitioner') {
        themeTitle = "Clinical Decision Support Report";
        themeHeader = "ZEZE Clinical Decision System";
        titleColor = [29, 78, 216];
        lineColor = [191, 219, 254];
      } else if (role === 'trainee' || role === 'student') {
        themeTitle = "Supervised Learning & Educational Report";
        themeHeader = "ZEZE Medical Education System";
        titleColor = [126, 34, 206];
        lineColor = [233, 213, 255];
      } else {
        themeTitle = "Cardiovascular Risk & Lifestyle Guidance";
        themeHeader = "ZEZE Health Assessment";
        titleColor = [23, 128, 93];
        lineColor = [167, 243, 208];
      }
      
      let cursorY = 40;
      let pageNum = 1;
      
      const drawHeader = () => {
        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(themeHeader, margin, 20);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text(`Report Date: ${dateStr}`, pageWidth - margin, 20, { align: "right" });
        
        pdf.setDrawColor(lineColor[0], lineColor[1], lineColor[2]); 
        pdf.setLineWidth(0.5);
        pdf.line(margin, 23, pageWidth - margin, 23);
      };
      
      const disclaimerText = "This report is only for information purpose and does not provide any diagnosis or treatment. There may be many other risk factors that must be considered for a complete assessment of your health. Please consult your healthcare provider to discuss your results.";
      
      const drawFooter = (page: number) => {
        pdf.setPage(page);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        const splitDisclaimer = pdf.splitTextToSize(disclaimerText, contentWidth - 20);
        pdf.text(splitDisclaimer, margin, pageHeight - 20);
        
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Page ${page}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      };

      drawHeader();
      
      pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]); 
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text(themeTitle, margin, cursorY);
      cursorY += 15;
      
      const rawText = resultData.explanation || "";
      const processText = rawText
        .replace(/^\*\s/gm, "- ") 
        .replace(/\*\*/g, "*") 
        .replace(/#{1,6}\s?(.*?)\n/g, "$1\n") 
        .replace(/`/g, "") 
        .replace(/\[(.*?)\]\(.*?\)/g, "$1"); 

      const paragraphs = processText.split('\n').filter((p: string) => p.trim() !== '');
      let isAltBg = true;
      const lineHeight = 5.5;
      
      paragraphs.forEach((paragraph: string) => {
        const segments = paragraph.split('*');
        let tempCursorX = margin + 3;
        let tempCursorY = cursorY + 6;
        
        segments.forEach((segment: string, index: number) => {
          const isBold = index % 2 === 1;
          pdf.setFont("helvetica", isBold ? "bold" : "normal");
          pdf.setFontSize(10);
          
          const words = segment.split(/(\s+)/);
          words.forEach((word: string) => {
            if (!word) return;
            const wordWidth = pdf.getTextWidth(word);
            if (tempCursorX + wordWidth > pageWidth - margin - 3) {
              if (word.trim() === "") return;
              tempCursorX = margin + 3;
              tempCursorY += lineHeight;
            }
            if (word.trim() !== "" || tempCursorX > margin + 3) {
              tempCursorX += wordWidth;
            }
          });
        });
        
        const blockHeight = tempCursorY - cursorY + 5;
        
        if (cursorY + blockHeight > pageHeight - 35) {
          pdf.addPage();
          pageNum++;
          drawHeader();
          cursorY = 35;
        }
        
        if (isAltBg) {
          pdf.setFillColor(245, 250, 255);
          pdf.rect(margin, cursorY, contentWidth, blockHeight, "F");
        }
        
        let writeCursorX = margin + 3;
        let writeCursorY = cursorY + 6;
        
        segments.forEach((segment: string, index: number) => {
          const isBold = index % 2 === 1;
          pdf.setFont("helvetica", isBold ? "bold" : "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(40, 40, 40);
          
          const words = segment.split(/(\s+)/);
          words.forEach((word: string) => {
            if (!word) return;
            const wordWidth = pdf.getTextWidth(word);
            if (writeCursorX + wordWidth > pageWidth - margin - 3) {
              if (word.trim() === "") return;
              writeCursorX = margin + 3;
              writeCursorY += lineHeight;
            }
            if (word.trim() !== "" || writeCursorX > margin + 3) {
              pdf.text(word, writeCursorX, writeCursorY);
              writeCursorX += wordWidth;
            }
          });
        });
        
        cursorY += blockHeight + 3;
        isAltBg = !isAltBg;
      });
      
      for (let i = 1; i <= pageNum; i++) {
        drawFooter(i);
      }
      
      pdf.save("ZEZE_Clinical_Report.pdf");
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
      console.error(err);
      setMessages((prev) => [...prev, { role: "model", parts: "Sorry, I could not connect to the analysis engine." }]);
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
    <main className="min-h-screen relative px-2 sm:px-4 lg:px-6 xl:px-8 pt-2 sm:pt-3 pb-16 overflow-y-auto bg-[#e8ecf2]">
      <div className="w-full max-w-[1720px] mx-auto relative z-10 px-1 sm:px-2">
        
        {/* Main Dashboard Layout Container */}
        <div 
          ref={reportRef} 
          className="w-full mb-16 space-y-6 sm:space-y-8"
        >
          {/* Top Nav: Moved higher up with minimal top margin */}
          <div className="flex items-center gap-3 pt-0.5 pb-1">
            <Link 
              href="/" 
              onClick={() => sessionStorage.removeItem('zeze_form_data')} 
              className="neu-button text-xs font-black text-slate-800 px-3.5 py-1.5 rounded-lg hover:text-[#17805d] transition-colors"
            >
              ← Start Over
            </Link>
            <span className="text-slate-400 font-bold">•</span>
            <Link 
              href={`/assessment?mode=manual&role=${(resultData.payload?.role as string) || 'patient'}`} 
              className="neu-button text-xs font-black text-blue-600 px-3.5 py-1.5 rounded-lg hover:text-blue-800 transition-colors"
            >
              Modify Inputs (What-If)
            </Link>
          </div>

          {/* Header Title with Logo Medallion & Aligned Contrasting Download PDF Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl neu-flat flex items-center justify-center p-2 shrink-0">
                <img src="/icon.webp" alt="ZEZE Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  Clinical Results Dashboard
                </h1>
                <p className="text-slate-500 font-extrabold tracking-widest uppercase text-[11px] sm:text-xs mt-0.5">
                  Zero Error Zonal Evaluation Model
                </p>
              </div>
            </div>

            {/* 3D Structured Download PDF Report Button (matching home screen 3D theme) */}
            <button 
              id="pdf-btn" 
              onClick={handleDownloadPDF}
              className="neu-button-3d text-xs sm:text-sm font-black flex items-center gap-2.5 px-6 py-3 rounded-xl uppercase tracking-wider cursor-pointer self-start sm:self-auto shrink-0 shadow-lg"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF Report
            </button>
          </div>

          {/* Result Card Component */}
          <ResultCard 
            risk={resultData.risk}
            probability={resultData.probability}
            explanation={resultData.explanation}
            role={(resultData.payload?.role as string) || 'patient'}
            feature_impacts={resultData.feature_impacts}
            payload={resultData.payload}
          />
        </div>

        {/* MODERN CLINICAL AI BOT DRAWER */}
        <div className={`fixed bottom-20 sm:bottom-24 right-2 sm:right-6 md:right-8 w-[95%] sm:w-[540px] md:w-[600px] lg:w-[640px] flex flex-col bg-white border-2 border-slate-200/90 rounded-3xl shadow-[0_25px_70px_rgba(15,23,42,0.22)] overflow-hidden h-[680px] max-h-[85vh] z-50 transition-all duration-300 transform origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
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
                    className="text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    💊 Which med will work?
                  </button>
                  <button 
                    onClick={() => handleSendPrompt("How can I lower my blood pressure effectively?")}
                    className="text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    🩺 How to lower blood pressure?
                  </button>
                  <button 
                    onClick={() => handleSendPrompt("What dietary guidelines should I follow for my heart?")}
                    className="text-xs bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    🥗 Recommended diet & foods
                  </button>
                  <button 
                    onClick={() => handleSendPrompt("Explain what my risk score means in clinical terms")}
                    className="text-xs bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-slate-200 hover:border-purple-300 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    ⚡ Explain my risk factors
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
                    <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-1.5 prose-headings:font-bold prose-headings:text-slate-900 prose-strong:text-slate-900 prose-ul:my-1.5 prose-li:my-0.5 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown>{msg.parts}</ReactMarkdown>
                    </div>
                  ) : (
                    <div>{msg.parts}</div>
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
                className="text-[11px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                💊 Which med will work?
              </button>
              <button 
                onClick={() => handleSendPrompt("What are the target blood pressure levels?")}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                🩺 Target BP
              </button>
              <button 
                onClick={() => handleSendPrompt("Guideline statin therapy for high cholesterol?")}
                className="text-[11px] whitespace-nowrap bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                🫀 Statin therapy
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
          className={`fixed bottom-6 right-4 sm:right-8 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
            isChatOpen 
              ? 'bg-slate-900 text-white hover:bg-slate-800' 
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white hover:scale-105 shadow-blue-500/30'
          }`}
          title="Open Clinical AI Assistant"
        >
          {isChatOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></span>
            </div>
          )}
        </button>

      </div>
    </main>
  );
}
