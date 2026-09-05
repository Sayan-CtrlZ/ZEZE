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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("zeze_result");
    if (!data) {
      router.push("/");
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
      
      if (role === 'practitioner') {
        themeTitle = "Medical Diagnostic Report";
        themeHeader = "ZEZE Clinical System";
        titleColor = [15, 118, 110];
        lineColor = [20, 184, 166];
      } else if (role === 'researcher') {
        themeTitle = "Cardiovascular Risk Data Profile";
        themeHeader = "ZEZE Research Analytics";
        titleColor = [51, 65, 85];
        lineColor = [148, 163, 184];
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !resultData) return;

    const newUserMsg: ChatMessage = { role: "user", parts: chatInput };
    setMessages((prev) => [...prev, newUserMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const apiUrl = `${baseUrl}/chat`;
      const contextString = `Risk: ${resultData.risk}, Probability: ${Number(resultData.probability).toFixed(1)}%, AI Note: ${resultData.explanation}`;
      
      const payload = {
        history: messages,
        message: newUserMsg.parts,
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

  if (loading || !resultData) return (
    <div className="min-h-screen flex items-center justify-center font-black tracking-widest uppercase text-slate-800 bg-[#e8ecf2]">
      Loading Report...
    </div>
  );

  const probPercent = Number(resultData.probability).toFixed(1);

  return (
    <main className="min-h-screen relative p-3 sm:p-6 lg:p-8 overflow-y-auto bg-[#e8ecf2]">
      <div className="w-full max-w-7xl 2xl:max-w-[1400px] mx-auto relative z-10 px-1 sm:px-2">
        
        {/* Main Neumorphic Card Surface (Master Card stretched horizontally) */}
        <div 
          ref={reportRef} 
          className="w-full neu-flat-lg rounded-3xl p-6 sm:p-10 lg:p-14 mb-20 bg-[#e8ecf2]"
        >
          {/* Top Bar: Action Buttons */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-8 pb-6 border-b border-slate-300/60">
            <div className="flex flex-wrap gap-2.5">
              <Link 
                href="/" 
                onClick={() => sessionStorage.removeItem('zeze_form_data')} 
                className="neu-button text-xs sm:text-sm font-black text-slate-800 px-4 py-2.5 rounded-xl hover:text-[#17805d]"
              >
                ← Start Over
              </Link>
              <Link 
                href={`/assessment?mode=manual&role=${(resultData.payload?.role as string) || 'patient'}`} 
                className="neu-button text-xs sm:text-sm font-black text-[#2563eb] px-4 py-2.5 rounded-xl"
              >
                Modify Inputs (What-If)
              </Link>
            </div>
            
            <button 
              id="pdf-btn" 
              onClick={handleDownloadPDF}
              className="neu-button-green text-xs sm:text-sm font-black flex items-center gap-2 px-6 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF Report
            </button>
          </div>

          {/* Header Title with Logo Medallion */}
          <div className="flex items-center gap-5 sm:gap-6 mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl neu-flat flex items-center justify-center p-2.5 shrink-0">
              <img src="/icon.webp" alt="ZEZE Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                Clinical Results Dashboard
              </h1>
              <p className="text-slate-500 font-extrabold tracking-widest uppercase text-xs sm:text-sm mt-1">
                Zero Error Zonal Evaluation Model
              </p>
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
          />
        </div>

        {/* 3D NEUMORPHIC FLOATING CHAT DRAWER */}
        <div className={`fixed bottom-24 right-4 sm:right-8 w-[92%] sm:w-[420px] flex flex-col neu-flat-lg rounded-3xl overflow-hidden h-[520px] max-h-[75vh] z-50 transition-all duration-300 transform origin-bottom-right bg-[#e8ecf2] ${isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          <div className="p-4 sm:p-5 neu-convex border-b border-slate-300/60 shrink-0 flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#17805d] shadow-[0_0_8px_#17805d] animate-pulse"></span>
                Clinical Assistant
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Ask questions about your risk score</p>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)} 
              className="neu-button w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="neu-inset p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm font-bold text-slate-800 w-5/6">
              Hello! I&apos;m the ZEZE AI Assistant. I&apos;ve analyzed your results ({probPercent}% calculated probability). Feel free to ask about your blood pressure, biomarkers, or lifestyle guidance!
            </div>
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`text-xs sm:text-sm p-4 rounded-2xl w-5/6 font-bold ${msg.role === 'user' ? 'neu-button-green ml-auto rounded-tr-none text-white' : 'neu-inset rounded-tl-none mr-auto text-slate-800'}`}
              >
                {msg.role === 'model' ? <div className="prose prose-sm max-w-none prose-p:my-1"><ReactMarkdown>{msg.parts}</ReactMarkdown></div> : msg.parts}
              </div>
            ))}

            {isChatLoading && (
              <div className="neu-inset p-3.5 rounded-2xl rounded-tl-none w-1/3 text-xs flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-[#17805d] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#17805d] rounded-full animate-bounce" style={{ animationDelay: '0.15s'}}></span>
                <span className="w-2 h-2 bg-[#17805d] rounded-full animate-bounce" style={{ animationDelay: '0.3s'}}></span>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 neu-convex border-t border-slate-300/60 flex gap-2 w-full">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..." 
              className="flex-1 neu-input rounded-full px-4 py-2.5 text-xs sm:text-sm font-bold placeholder:text-slate-400"
            />
            <button 
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="neu-button-green rounded-full px-5 py-2.5 font-black text-xs uppercase tracking-wider disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* 3D FLOATING ACTION TRIGGER */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`fixed bottom-6 right-4 sm:right-8 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full neu-button flex items-center justify-center transition-transform duration-200 cursor-pointer ${isChatOpen ? 'text-red-600' : 'text-[#17805d]'}`}
          title="Open AI Chat Assistant"
        >
          {isChatOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          )}
        </button>

      </div>
    </main>
  );
}
