"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen relative p-4 md:p-8 selection:bg-brand-900 selection:text-brand-100 overflow-hidden flex flex-col justify-center items-center">
      {/* Animated Glass Bubbles */}
      <div className="bubble w-[150px] h-[150px] left-[10%]" style={{ animationDuration: '18s', animationDelay: '0s' }}></div>
      <div className="bubble w-[250px] h-[250px] left-[30%]" style={{ animationDuration: '25s', animationDelay: '4s' }}></div>
      <div className="bubble w-[100px] h-[100px] left-[55%]" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
      <div className="bubble w-[200px] h-[200px] left-[75%]" style={{ animationDuration: '22s', animationDelay: '6s' }}></div>
      <div className="bubble w-[120px] h-[120px] left-[85%]" style={{ animationDuration: '19s', animationDelay: '1s' }}></div>
      <div className="bubble w-[300px] h-[300px] left-[5%]" style={{ animationDuration: '28s', animationDelay: '8s' }}></div>
      <div className="bubble w-[180px] h-[180px] left-[45%]" style={{ animationDuration: '20s', animationDelay: '10s' }}></div>

      <div className="max-w-6xl mx-auto relative z-10 w-full text-center">
        <header className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center">
          <div className="inline-flex items-baseline gap-2 px-4 py-1 rounded-full bg-white/80 backdrop-blur shadow-sm text-xs font-bold tracking-widest text-brand-900 mb-6 border border-brand-900/10">
            <span className="w-2 h-2 rounded-full mt-[0.15rem] bg-green-500 animate-pulse inline-block"></span>
            ACTIVE AI ASSESSMENT
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-brand-900 mb-1 md:mb-2 drop-shadow-md">
            ZEZE
          </h1>

          <h2 className="text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase text-brand-900/80 mb-2 md:mb-4 drop-shadow-sm">
            Zero Error Zonal Evaluation Model
          </h2>

          <p className="text-sm sm:text-base md:text-lg font-bold text-brand-900 tracking-wide drop-shadow-sm max-w-2xl mt-2 md:mt-4 px-4">
            Select your preferred method of clinical data entry to begin the cardiovascular risk assessment.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both px-2">
          
          {/* Card 1: Document Scan */}
          <Link href="/assessment?mode=upload" className="group relative w-full bg-white/30 backdrop-blur-3xl border border-white/60 rounded-3xl md:rounded-[2rem] p-6 md:p-10 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/50 hover:shadow-2xl hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl md:rounded-[2rem] transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-900/10 flex items-center justify-center text-brand-900 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner border border-white/40">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <h3 className="text-xl md:text-2xl font-black text-brand-900 tracking-tight mb-2 md:mb-3">Smart Document Scan</h3>
            <p className="text-brand-900/80 font-semibold text-xs md:text-sm leading-relaxed">
              Upload a PDF or image of your clinical report. Our AI will automatically parse and extract your medical parameters.
            </p>
            
            <div className="mt-4 md:mt-8 px-6 py-2 rounded-full bg-brand-900 text-brand-100 font-bold text-xs md:text-sm tracking-wider uppercase opacity-90 group-hover:opacity-100 transition-opacity">
              Upload File
            </div>
          </Link>

          {/* Card 2: Manual Entry */}
          <Link href="/assessment?mode=manual" className="group relative w-full bg-white/30 backdrop-blur-3xl border border-white/60 rounded-3xl md:rounded-[2rem] p-6 md:p-10 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/50 hover:shadow-2xl hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl md:rounded-[2rem] transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-900/10 flex items-center justify-center text-brand-900 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner border border-white/40">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            
            <h3 className="text-xl md:text-2xl font-black text-brand-900 tracking-tight mb-2 md:mb-3">Manual Clinical Entry</h3>
            <p className="text-brand-900/80 font-semibold text-xs md:text-sm leading-relaxed">
              Directly input your 13 critical clinical parameters into our smart form for immediate AI cardiovascular evaluation.
            </p>
            
            <div className="mt-4 md:mt-8 px-6 py-2 rounded-full bg-brand-900/10 text-brand-900 border border-brand-900/20 font-bold text-xs md:text-sm tracking-wider uppercase opacity-90 group-hover:opacity-100 group-hover:bg-brand-900 group-hover:text-brand-100 transition-all">
              Start Typing
            </div>
          </Link>

        </section>
      </div>
    </main>
  );
}
