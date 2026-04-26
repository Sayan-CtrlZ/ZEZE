"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';

type ChatMessage = { role: "user" | "model"; parts: string };

export default function ResultDashboard() {
  const router = useRouter();
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("zeze_result");
    if (!data) {
      router.push("/");
    } else {
      setResultData(JSON.parse(data));
      setLoading(false);
    }
  }, [router]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const btn = document.getElementById("pdf-btn");
    if (btn) btn.style.display = "none"; // Hide button in PDF
    
    try {
      const element = reportRef.current;
      const imgData = await toPng(element, { quality: 1.0, backgroundColor: "#e6dace" });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("ZEZE_Clinical_Report.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      if (btn) btn.style.display = "flex";
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/predict", "/chat") || "http://localhost:10000/chat";
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

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* REPORT SECTION (Printable) */}
        <div 
          ref={reportRef} 
          className="lg:col-span-8 flex flex-col space-y-6 rounded-3xl"
        >
          <div className="backdrop-blur-[64px] bg-white/20 p-8 md:p-12 rounded-[2rem] border border-white/50 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            
            {/* Color Accent */}
            <div className={`absolute top-0 left-0 w-full h-2 ${isHighRisk ? 'bg-red-400' : 'bg-green-400'} opacity-70`}></div>

            <div className="flex justify-between w-full items-center mb-8">
              <Link href="/" className="text-sm font-bold text-brand-900 border border-brand-900/20 px-4 py-2 rounded-full hover:bg-brand-900 hover:text-white transition-colors">
                ← New Patient
              </Link>
              <button 
                id="pdf-btn" 
                onClick={handleDownloadPDF}
                className="text-sm font-bold flex items-center gap-2 text-white bg-brand-900 px-4 py-2 rounded-full hover:bg-black transition-colors"
              >
                Download PDF
              </button>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-brand-900 mb-2">Clinical Results Dashboard</h1>
            <p className="text-brand-900/60 font-medium mb-10 tracking-widest uppercase text-sm">Zero Error Zonal Evaluation Model</p>

            {/* Donut Chart */}
            <div className="relative w-64 h-64 mb-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-brand-900/10"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${isHighRisk ? 'text-red-500' : 'text-green-500'} transition-all duration-1000 ease-out`}
                  strokeDasharray={strokeDash}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-brand-900 tracking-tighter">{probPercent}%</span>
                <span className="text-xs font-bold tracking-widest uppercase text-brand-900/50 mt-1">Probability</span>
              </div>
            </div>

            <div className={`px-6 py-2 rounded-full border mb-8 font-bold tracking-widest uppercase ${isHighRisk ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              Risk Classification: {resultData.risk}
            </div>

            <div className="bg-white/40 p-10 rounded-2xl w-full border border-white/60 prose prose-sm md:prose-base text-left max-w-none text-brand-900 shadow-xl backdrop-blur-xl">
              <h3 className="text-xl font-black mb-4 tracking-tight border-b border-brand-900/10 pb-4">AI Diagnostic Summary</h3>
              <div className="prose prose-sm md:prose-base max-w-none">
                <ReactMarkdown>{resultData.explanation}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT SECTION */}
        <div className="lg:col-span-4 flex flex-col backdrop-blur-[64px] bg-brand-900/90 rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden text-brand-100 h-[80vh] lg:sticky lg:top-8">
          <div className="p-6 border-b border-brand-100/10 shrink-0">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Clinical Assistant
            </h2>
            <p className="text-xs text-brand-100/60 mt-1 uppercase tracking-widest">Ask about your results</p>
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

      </div>
    </main>
  );
}
