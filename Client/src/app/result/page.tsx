"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import ResultCard from '@/components/ResultCard';

type ChatMessage = { role: "user" | "model"; parts: string };

export default function ResultDashboard() {
  const router = useRouter();
  const [resultData, setResultData] = useState<any>(null);
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
      const role = resultData.payload?.role || 'patient';
      
      let themeTitle = "What do your test results mean?";
      let themeHeader = "ZEZE";
      let titleColor = [0, 102, 204]; // Blue
      let lineColor = [173, 216, 230]; // Light Blue
      
      if (role === 'practitioner') {
        themeTitle = "Medical Diagnostic Report";
        themeHeader = "ZEZE Clinical System";
        titleColor = [15, 118, 110]; // Teal 700
        lineColor = [20, 184, 166]; // Teal 500
      } else if (role === 'researcher') {
        themeTitle = "Cardiovascular Risk Data Profile";
        themeHeader = "ZEZE Research Analytics";
        titleColor = [51, 65, 85]; // Slate 700
        lineColor = [148, 163, 184]; // Slate 400
      }
      
      let cursorY = 40;
      let pageNum = 1;
      
      const drawHeader = () => {
        pdf.setTextColor(60, 60, 60);
        
        // Branding
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(themeHeader, margin, 20);
        
        // Date
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text(`Report Date: ${dateStr}`, pageWidth - margin, 20, { align: "right" });
        
        // Accent line
        pdf.setDrawColor(lineColor[0], lineColor[1], lineColor[2]); 
        pdf.setLineWidth(0.5);
        pdf.line(margin, 23, pageWidth - margin, 23);
      };
      
      const disclaimerText = "This report is only for information purpose and does not provide any diagnosis or treatment. There may be many other risk factors that must be considered for a complete assessment of your health. Please consult your healthcare provider to discuss your results and any questions you may have about your wellness.";
      
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
      
      // Title
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
        
        // 1. Calculate height of this block
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
        
        // Add page if needed
        if (cursorY + blockHeight > pageHeight - 35) {
          pdf.addPage();
          pageNum++;
          drawHeader();
          cursorY = 35;
        }
        
        // Draw background box or separator based on role
        if (role === 'researcher') {
          if (!isAltBg) { // Add subtle separator line for researchers instead of boxes
            pdf.setDrawColor(226, 232, 240); // slate-200
            pdf.setLineWidth(0.2);
            pdf.line(margin, cursorY - 2, pageWidth - margin, cursorY - 2);
          }
        } else {
          if (isAltBg) {
            if (role === 'practitioner') {
              pdf.setFillColor(240, 253, 250); // Teal 50
            } else {
              pdf.setFillColor(245, 250, 255); // VERY light blue (Patient)
            }
            pdf.rect(margin, cursorY, contentWidth, blockHeight, "F");
          }
        }
        
        // 2. Draw actual text
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
      
      // Draw footers on all pages
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
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/chat`;
      const contextString = `Risk: ${resultData.risk}, Probability: ${(resultData.probability * 100).toFixed(1)}%, AI Note: ${resultData.explanation}`;
      
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold tracking-widest uppercase">Loading Report...</div>;

  const isHighRisk = resultData.risk.toLowerCase() === "high";
  const probPercent = Number(resultData.probability).toFixed(1);
  const strokeDash = `${resultData.probability}, 100`;

  return (
    <main className="min-h-screen relative p-4 md:p-8 overflow-y-auto">
      {/* Background Bubbles */}
      <div className="bubble w-[300px] h-[300px] left-[5%]" style={{ animationDuration: '28s', animationDelay: '2s' }}></div>
      <div className="bubble w-[200px] h-[200px] right-[10%]" style={{ animationDuration: '20s', animationDelay: '6s' }}></div>

      <div className="w-full mx-auto relative z-10 px-0">
        
        {/* REPORT SECTION (Printable) */}
        <div 
          ref={reportRef} 
          className="w-full flex flex-col mb-24 bg-white/95 min-h-screen border-t-8 border-brand-900"
        >
          <div className="w-full max-w-6xl mx-auto p-4 md:p-12 lg:p-16 flex flex-col relative">
            
            {/* Color Accent */}
            <div className={`absolute top-0 left-0 w-full h-2 ${isHighRisk ? 'bg-red-500' : 'bg-green-500'}`}></div>

            <div className="flex justify-between w-full items-center mb-8">
              <div className="flex gap-2">
                <Link href="/" onClick={() => sessionStorage.removeItem('zeze_form_data')} className="text-xs md:text-sm font-bold text-brand-900 border border-brand-900/20 px-4 py-2 hover:bg-brand-900 hover:text-white transition-colors">
                  ← Start Over
                </Link>
                <Link href={`/assessment?mode=manual&role=${resultData.payload?.role || 'patient'}`} className="text-xs md:text-sm font-bold text-brand-900 bg-brand-900/10 px-4 py-2 hover:bg-brand-900 hover:text-white transition-colors">
                  Modify Inputs (What-If)
                </Link>
              </div>
              <button 
                id="pdf-btn" 
                onClick={handleDownloadPDF}
                className="text-xs md:text-sm font-bold flex items-center gap-2 text-white bg-brand-900 px-6 py-2 hover:bg-brand-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
            <div className="flex items-center gap-6 mb-12 border-b border-brand-900/10 pb-8">
              <img src="/icon.webp" alt="ZEZE Logo" className="w-20 h-20 md:w-24 md:h-24 drop-shadow-md" />
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-brand-900 mb-2">Clinical Results Dashboard</h1>
                <p className="text-brand-900/70 font-bold tracking-widest uppercase text-xs md:text-sm">Zero Error Zonal Evaluation Model</p>
              </div>
            </div>

            <ResultCard 
              risk={resultData.risk}
              probability={resultData.probability}
              explanation={resultData.explanation}
              role={resultData.payload?.role || 'patient'}
              feature_impacts={resultData.feature_impacts}
              payload={resultData.payload}
            />
          </div>
        </div>

        {/* FLOATING CHAT SECTION */}
        <div className={`fixed bottom-24 right-4 md:right-8 w-[90%] md:w-[400px] flex flex-col backdrop-blur-[64px] bg-brand-900/95 rounded-3xl md:rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden text-brand-100 h-[500px] max-h-[70vh] z-50 transition-all duration-300 transform origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          <div className="p-4 md:p-6 border-b border-brand-100/10 shrink-0 flex justify-between items-center">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Clinical Assistant
              </h2>
              <p className="text-[10px] md:text-xs text-brand-100/60 mt-1 uppercase tracking-widest">Ask about your results</p>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
            <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 w-5/6 text-sm">
              Hello! I'm the ZEZE AI. I've just analyzed your report. Need a deeper explanation or advice about your {probPercent}% probability score? Let's chat.
            </div>
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`text-sm p-4 rounded-2xl w-5/6 ${msg.role === 'user' ? 'bg-pink-600 ml-auto rounded-tr-none text-white' : 'bg-white/10 rounded-tl-none mr-auto'}`}>
                {msg.role === 'model' ? <div className="prose prose-invert prose-sm min-w-full"><ReactMarkdown>{msg.parts}</ReactMarkdown></div> : msg.parts}
              </div>
            ))}
            {isChatLoading && (
              <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 w-1/2 text-sm flex gap-1">
                <span className="w-2 h-2 bg-brand-100/50 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-brand-100/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s'}}></span>
                <span className="w-2 h-2 bg-brand-100/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></span>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 border-t border-brand-100/10 flex gap-2 w-full">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a health question..." 
              className="flex-1 bg-white/10 text-white placeholder-brand-100/40 rounded-full px-5 py-3 outline-none focus:bg-white/20 transition-colors text-sm"
            />
            <button 
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-white text-brand-900 rounded-full px-6 py-3 font-bold text-sm tracking-widest uppercase hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

        {/* FLOATING ACTION BUTTON */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`fixed bottom-6 right-4 md:right-8 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isChatOpen ? 'bg-red-500 text-white rotate-90 hover:bg-red-600' : 'bg-brand-900 text-white hover:bg-black hover:scale-110'}`}
        >
          {isChatOpen ? (
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          )}
        </button>

      </div>
    </main>
  );
}
