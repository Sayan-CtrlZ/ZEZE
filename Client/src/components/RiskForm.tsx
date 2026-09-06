import React, { useState, useEffect, useMemo, useRef } from 'react';

export type FormData = {
  age: number | '';
  sex: number | '';
  height: number | '';
  weight: number | '';
  ap_hi: number | '';
  ap_lo: number | '';
  cholesterol: number | '';
  gluc: number | '';
  smoke: number | '';
  alco: number | '';
  active: number | '';
  // Legacy & Advanced Clinical Markers
  cp: number | '';
  trestbps: number | '';
  chol: number | '';
  fbs: number | '';
  restecg: number | '';
  thalach: number | '';
  exang: number | '';
  oldpeak: number | '';
  slope: number | '';
  ca: number | '';
  thal: number | '';
  symptoms: string;
};

type RiskFormProps = {
  onSubmit: (data: FormData) => void;
  onDocumentSubmit?: (files: FileList | File[], symptoms: string) => void;
  isLoading: boolean;
  mode?: 'manual' | 'upload';
};

export default function RiskForm({ onSubmit, isLoading, mode = 'upload' }: RiskFormProps) {
  const [formData, setFormData] = useState<FormData>({
    age: '',
    sex: 1,
    height: '',
    weight: '',
    ap_hi: '',
    ap_lo: '',
    cholesterol: 1,
    gluc: 1,
    smoke: 0,
    alco: 0,
    active: 1,
    cp: 0,
    trestbps: '',
    chol: '',
    fbs: 0,
    restecg: 0,
    thalach: '',
    exang: 0,
    oldpeak: '',
    slope: 0,
    ca: 0,
    thal: 1,
    symptoms: ""
  });

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [parseError, setParseError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated OCR State Flow
  const [uploadStep, setUploadStep] = useState<'drop' | 'scanning' | 'review'>('drop');
  const [scanStatus, setScanStatus] = useState<string>("Preparing document for analysis...");
  const [ocrSnippets, setOcrSnippets] = useState<Record<string, string>>({});
  const [ocrConfidence, setOcrConfidence] = useState<Record<string, string>>({});
  const [rawOcrText, setRawOcrText] = useState<string>("");

  // Live BMI calculation
  const liveBmi = useMemo(() => {
    if (formData.height && formData.weight && Number(formData.height) > 0) {
      const hM = Number(formData.height) / 100;
      const bmi = Number(formData.weight) / (hM * hM);
      let cat = 'Normal';
      let color = 'text-[#17805d] neu-inset-sm';
      if (bmi < 18.5) {
        cat = 'Underweight';
        color = 'text-blue-700 neu-inset-sm';
      } else if (bmi >= 25 && bmi < 30) {
        cat = 'Overweight';
        color = 'text-amber-700 neu-inset-sm';
      } else if (bmi >= 30) {
        cat = 'Obese';
        color = 'text-red-700 neu-inset-sm';
      }
      return { val: bmi.toFixed(1), cat, color };
    }
    return null;
  }, [formData.height, formData.weight]);

  // Live BP Stage Indicator
  const liveBpStage = useMemo(() => {
    if (formData.ap_hi && formData.ap_lo) {
      const hi = Number(formData.ap_hi);
      const lo = Number(formData.ap_lo);
      if (hi >= 140 || lo >= 90) {
        return { label: 'Stage 2 Hypertension', color: 'text-red-700' };
      } else if (hi >= 130 || lo >= 80) {
        return { label: 'Stage 1 Hypertension', color: 'text-amber-700' };
      } else if (hi >= 120 && lo < 80) {
        return { label: 'Elevated BP', color: 'text-yellow-700' };
      } else {
        return { label: 'Normal BP', color: 'text-[#17805d]' };
      }
    }
    return { label: null, color: '' };
  }, [formData.ap_hi, formData.ap_lo]);

  const loadPreset = (preset: 'high' | 'atypical' | 'low') => {
    if (preset === 'high') {
      setFormData({
        age: 62, sex: 1, height: 172, weight: 93, ap_hi: 155, ap_lo: 95,
        cholesterol: 3, gluc: 2, smoke: 1, alco: 1, active: 0,
        cp: 2, trestbps: 155, chol: 265, fbs: 1, restecg: 1, thalach: 125,
        exang: 1, oldpeak: 2.2, slope: 1, ca: 2, thal: 3,
        symptoms: "Patient experiences severe chest tightness when climbing stairs. Persistent shortness of breath and smoker for 20 years."
      });
    } else if (preset === 'atypical') {
      setFormData({
        age: 54, sex: 0, height: 162, weight: 77, ap_hi: 135, ap_lo: 85,
        cholesterol: 2, gluc: 1, smoke: 0, alco: 0, active: 0,
        cp: 1, trestbps: 135, chol: 220, fbs: 0, restecg: 0, thalach: 145,
        exang: 0, oldpeak: 0.6, slope: 0, ca: 0, thal: 1,
        symptoms: "Patient reports general fatigue, occasional atypical discomfort, sedentary desk routine."
      });
    } else if (preset === 'low') {
      setFormData({
        age: 32, sex: 0, height: 168, weight: 60, ap_hi: 115, ap_lo: 75,
        cholesterol: 1, gluc: 1, smoke: 0, alco: 0, active: 1,
        cp: 3, trestbps: 115, chol: 175, fbs: 0, restecg: 0, thalach: 170,
        exang: 0, oldpeak: 0.0, slope: 0, ca: 0, thal: 1,
        symptoms: "Routine health screening. Active runner, non-smoker, no cardiovascular complaints."
      });
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('zeze_form_data');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('zeze_form_data', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }
    if (type === 'number') {
      const parsed = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(parsed) ? '' : parsed
      }));
    } else if (e.target.tagName === 'SELECT') {
      const parsed = Number(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(parsed) ? value : parsed }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, symptoms: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // OCR Extraction Handler
  const handleStartOcr = async (filesToProcess: FileList | File[] | null = selectedFiles) => {
    if (!filesToProcess || (Array.isArray(filesToProcess) ? filesToProcess.length === 0 : filesToProcess.length === 0)) {
      setParseError("Please select a medical report or document first.");
      return;
    }

    setUploadStep('scanning');
    setParseError("");
    setScanStatus("Initializing Optical Character Recognition (RapidOCR)...");

    const timer1 = setTimeout(() => {
      setScanStatus("Parsing text layers & extracting clinical vitals...");
    }, 900);
    const timer2 = setTimeout(() => {
      setScanStatus("Detecting Blood Pressure, Cholesterol tiers & biomarkers...");
    }, 1800);

    try {
      const uploadData = new window.FormData();
      Array.from(filesToProcess).forEach(file => {
        uploadData.append("files", file);
      });
      if (formData.symptoms) {
        uploadData.append("symptoms", formData.symptoms);
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const response = await fetch(`${baseUrl}/extract-vitals`, {
        method: "POST",
        body: uploadData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        let msg = "OCR failed to parse document.";
        try {
          const err = await response.json();
          if (err && err.detail) msg = err.detail;
        } catch {
          // fallback
        }
        throw new Error(msg);
      }

      const res = await response.json();
      const extracted = res.vitals || {};

      const roundUp = (val: unknown): number | "" => {
        if (val === undefined || val === null || val === '') return '';
        const num = Number(val);
        return isNaN(num) ? '' : Math.ceil(num);
      };

      setFormData(prev => ({
        ...prev,
        age: extracted.age !== undefined && extracted.age !== null ? roundUp(extracted.age) : prev.age,
        sex: extracted.sex !== undefined && extracted.sex !== null ? extracted.sex : prev.sex,
        height: extracted.height !== undefined && extracted.height !== null ? roundUp(extracted.height) : prev.height,
        weight: extracted.weight !== undefined && extracted.weight !== null ? roundUp(extracted.weight) : prev.weight,
        ap_hi: extracted.ap_hi !== undefined && extracted.ap_hi !== null ? roundUp(extracted.ap_hi) : prev.ap_hi,
        ap_lo: extracted.ap_lo !== undefined && extracted.ap_lo !== null ? roundUp(extracted.ap_lo) : prev.ap_lo,
        cholesterol: extracted.cholesterol !== undefined && extracted.cholesterol !== null ? roundUp(extracted.cholesterol) : prev.cholesterol,
        gluc: extracted.gluc !== undefined && extracted.gluc !== null ? roundUp(extracted.gluc) : prev.gluc,
        smoke: extracted.smoke !== undefined && extracted.smoke !== null ? roundUp(extracted.smoke) : prev.smoke,
        alco: extracted.alco !== undefined && extracted.alco !== null ? roundUp(extracted.alco) : prev.alco,
        active: extracted.active !== undefined && extracted.active !== null ? roundUp(extracted.active) : prev.active,
        symptoms: extracted.symptoms || prev.symptoms
      }));

      setOcrSnippets(res.snippets || {});
      setOcrConfidence(res.confidence || {});
      setRawOcrText(res.raw_text || "");
      setUploadStep('review');

    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const msg = err instanceof Error ? err.message : "Could not complete OCR analysis. Please enter values manually or try another file.";
      setParseError(msg);
      setUploadStep('drop');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSelectedFiles(files);
    setParseError("");
    handleStartOcr(files);
  };

  const loadDemoReport = () => {
    const demoContent = "Patient Name: Rajesh Kumar\nAge: 58\nSex: Male\nHospital: AIIMS New Delhi - Cardiology OPD\nAttending: Dr. Aarav Sharma, MD (NMC-2019-038291)\nBlood Pressure: 140/90 mmHg\nTotal Cholesterol: 245 mg/dL\nFasting Blood Sugar: 110 mg/dL\nHeight: 175 cm\nWeight: 82 kg\nSymptoms: Retrosternal chest tightness and exertional breathlessness when walking uphill.\n";
    const blob = new Blob([demoContent], { type: "text/plain" });
    const demoFile = new File([blob], "sample_lab_report.txt", { type: "text/plain" });
    setParseError("");
    handleStartOcr([demoFile]);
  };

  const handleClearFiles = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFiles(null);
    setUploadStep('drop');
    setOcrSnippets({});
    setOcrConfidence({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const inputClasses = "w-full neu-input rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 outline-none font-extrabold text-slate-900 placeholder:text-slate-400 text-base sm:text-sm transition-all";
  const labelClasses = "block text-xs font-black tracking-wider text-slate-700 mb-2 uppercase";

  return (
    <form onSubmit={handleSubmit} className={`neu-card-glass p-4 sm:p-7 lg:p-10 w-full max-w-full text-slate-900 ${mode === 'upload' && uploadStep === 'drop' ? 'flex-1 flex flex-col justify-between min-h-[500px] sm:min-h-[560px] lg:min-h-[620px]' : ''}`}>
      
      {mode === 'upload' ? (
        <div className={`flex flex-col w-full ${uploadStep === 'drop' ? 'flex-1 justify-between space-y-4 sm:space-y-6' : 'space-y-6 sm:space-y-8'}`}>
          
          {/* STEP 1: DROP / SELECT FILE */}
          {uploadStep === 'drop' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setSelectedFiles(e.dataTransfer.files);
                    setParseError("");
                    handleStartOcr(e.dataTransfer.files);
                  }
                }}
                className={`w-full neu-inset-deep rounded-3xl p-6 sm:p-12 lg:p-16 text-center transition-all relative group border-2 border-dashed flex-1 flex flex-col items-center justify-center min-h-[350px] sm:min-h-[420px] lg:min-h-[480px] ${
                  isDragging 
                    ? 'border-blue-700 ring-4 ring-blue-700/20 scale-[1.01]' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*,application/pdf,text/plain"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                />
                <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-5 pointer-events-none">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl neu-inset flex items-center justify-center text-blue-700 group-hover:scale-105 transition-transform bg-white/60 shadow-sm">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <div>
                    <h3 className="font-black text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight">Upload Clinical Report / Lab Slip</h3>
                    <p className="text-xs sm:text-sm font-bold tracking-wider text-slate-500 uppercase mt-1">PDF, PNG, JPG, or TXT (Lipid Profile, Blood Pressure, Medical Records)</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-inset-sm text-xs font-black text-blue-800">
                    <span>⚡ On-Device RapidOCR + Clinical Entity Extraction</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Demo Button (Exact 3D Navy Button) */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:pt-2 shrink-0">
                <span className="text-xs font-bold text-slate-500">Don&apos;t have a report on hand?</span>
                <button
                  type="button"
                  onClick={loadDemoReport}
                  className="neu-button-3d inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black"
                >
                  <svg className="w-3.5 h-3.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Test With Sample Lab Slip
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING IN PROGRESS STATE */}
          {uploadStep === 'scanning' && (
            <div className="w-full neu-inset rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 bg-white/40">
              <div className="relative w-24 h-24 flex items-center justify-center neu-convex rounded-full">
                <div className="absolute inset-0 rounded-full border-4 border-blue-700 border-t-transparent animate-spin"></div>
                <svg className="w-10 h-10 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Scanning Document</h3>
                <p className="text-sm font-extrabold text-blue-700">{scanStatus}</p>
                <div className="w-full neu-inset-sm rounded-full h-3 overflow-hidden mt-4 p-0.5">
                  <div className="bg-gradient-to-r from-blue-700 to-sky-500 h-full rounded-full animate-pulse" style={{ width: '85%' }}></div>
                </div>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-black">Analyzing parameters...</span>
            </div>
          )}

          {/* STEP 3: REVIEW & VERIFY SCREEN */}
          {uploadStep === 'review' && (
            <div className="w-full space-y-8">

              {/* Editable Fields Grid (Spacious, Un-congested) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full">
                <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                  
                  {/* 1. Demographics & Anthropometrics */}
                  <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#17805d] shadow-[0_0_8px_#17805d]"></span>
                        1. Demographics & Body Metrics
                      </h4>
                      {liveBmi && (
                        <span className={`text-xs px-3.5 py-1 font-black rounded-full neu-inset-sm ${liveBmi.color}`}>
                          BMI: {liveBmi.val} ({liveBmi.cat})
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={labelClasses}>Age (years)</label>
                          {ocrSnippets.age && <span className="text-[10px] text-[#17805d] neu-inset-sm px-2 py-0.5 rounded-full font-black" title={ocrSnippets.age}>[OCR]</span>}
                        </div>
                        <input required type="number" name="age" value={formData.age} onChange={handleChange} className={inputClasses} placeholder="55" min={1} max={120} />
                      </div>
                      <div>
                        <label className={labelClasses}>Biological Sex</label>
                        <select name="sex" value={formData.sex} onChange={handleChange} className={inputClasses}>
                          <option value={1}>Male</option>
                          <option value={0}>Female</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={labelClasses}>Height (cm)</label>
                          {ocrSnippets.height && <span className="text-[10px] text-[#17805d] neu-inset-sm px-2 py-0.5 rounded-full font-black" title={ocrSnippets.height}>[OCR]</span>}
                        </div>
                        <input type="number" name="height" value={formData.height} onChange={handleChange} className={inputClasses} placeholder="170" min={50} max={250} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={labelClasses}>Weight (kg)</label>
                          {ocrSnippets.weight && <span className="text-[10px] text-[#17805d] neu-inset-sm px-2 py-0.5 rounded-full font-black" title={ocrSnippets.weight}>[OCR]</span>}
                        </div>
                        <input type="number" name="weight" value={formData.weight} onChange={handleChange} className={inputClasses} placeholder="75" min={20} max={300} />
                      </div>
                    </div>
                  </div>

                  {/* 2. Blood Pressure */}
                  <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                          2. Blood Pressure (mmHg)
                        </h4>
                        {ocrSnippets.blood_pressure && (
                          <span className="text-[10px] text-[#17805d] neu-inset-sm px-2.5 py-0.5 rounded-full font-black" title={ocrSnippets.blood_pressure}>
                            {ocrSnippets.blood_pressure}
                          </span>
                        )}
                      </div>
                      {liveBpStage.label && (
                        <span className={`text-xs px-3.5 py-1 font-black rounded-full neu-inset-sm ${liveBpStage.color}`}>
                          {liveBpStage.label}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className={labelClasses}>Systolic BP (ap_hi)</label>
                        <input required type="number" name="ap_hi" value={formData.ap_hi} onChange={handleChange} className={inputClasses} placeholder="120" min={50} max={260} />
                      </div>
                      <div>
                        <label className={labelClasses}>Diastolic BP (ap_lo)</label>
                        <input required type="number" name="ap_lo" value={formData.ap_lo} onChange={handleChange} className={inputClasses} placeholder="80" min={30} max={180} />
                      </div>
                    </div>
                  </div>

                  {/* 3. Clinical Laboratory Tiers */}
                  <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                    <div className="pb-2 border-b border-slate-200/60">
                      <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                        3. Clinical Laboratory Tiers
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={labelClasses}>Total Cholesterol</label>
                          {ocrSnippets.cholesterol && <span className="text-[10px] text-[#17805d] neu-inset-sm px-2 py-0.5 rounded-full font-black" title={ocrSnippets.cholesterol}>[OCR]</span>}
                        </div>
                        <select name="cholesterol" value={formData.cholesterol} onChange={handleChange} className={inputClasses}>
                          <option value={1}>Normal (&lt; 200 mg/dL)</option>
                          <option value={2}>Above Normal (200 - 239 mg/dL)</option>
                          <option value={3}>Well Above Normal (≥ 240 mg/dL)</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={labelClasses}>Fasting Glucose (Blood Sugar)</label>
                          {ocrSnippets.glucose && <span className="text-[10px] text-[#17805d] neu-inset-sm px-2 py-0.5 rounded-full font-black" title={ocrSnippets.glucose}>[OCR]</span>}
                        </div>
                        <select name="gluc" value={formData.gluc} onChange={handleChange} className={inputClasses}>
                          <option value={1}>Normal (&lt; 100 mg/dL)</option>
                          <option value={2}>Above Normal (100 - 125 mg/dL)</option>
                          <option value={3}>Well Above Normal (≥ 126 mg/dL)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Lifestyle Indicators */}
                  <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                    <div className="pb-2 border-b border-slate-200/60">
                      <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#17805d] shadow-[0_0_8px_#17805d]"></span>
                        4. Lifestyle & Behavioral Factors
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                      <div>
                        <label className={labelClasses}>Tobacco / Smoking</label>
                        <select name="smoke" value={formData.smoke} onChange={handleChange} className={inputClasses}>
                          <option value={0}>Non-smoker</option>
                          <option value={1}>Smoker</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Alcohol Consumption</label>
                        <select name="alco" value={formData.alco} onChange={handleChange} className={inputClasses}>
                          <option value={0}>No / Minimal</option>
                          <option value={1}>Regular Consumer</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Physical Activity</label>
                        <select name="active" value={formData.active} onChange={handleChange} className={inputClasses}>
                          <option value={1}>Regularly Active</option>
                          <option value={0}>Sedentary</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Symptoms & Final Action */}
                <div className="lg:col-span-4 flex flex-col justify-between p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-5 sm:space-y-6 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                  <div className="space-y-3">
                    <label className={`${labelClasses} flex items-center justify-between`}>
                      <span>Reported Symptoms / Notes</span>
                      <span className="text-[10px] neu-inset-sm text-[#17805d] px-2.5 py-0.5 rounded-full font-black">NLP ASSISTED</span>
                    </label>
                    <textarea 
                      name="symptoms" 
                      value={formData.symptoms} 
                      onChange={handleTextChange} 
                      className="w-full neu-input rounded-2xl p-3.5 sm:p-4 text-slate-900 text-sm placeholder:text-slate-400 outline-none min-h-[160px] sm:min-h-[220px] resize-none font-semibold leading-relaxed" 
                      placeholder="Symptoms or clinical notes from lab slip (e.g. retrosternal chest discomfort, exertional breathlessness, palpitations)..." 
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200/60">
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="neu-button-matte-3d w-full py-3.5 sm:py-4.5 rounded-2xl font-black tracking-wider uppercase text-xs sm:text-sm cursor-pointer shadow-xl disabled:opacity-60 flex justify-center items-center gap-2.5"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                          Running Assessment...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                          Run Clinical AI Assessment
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-500 font-bold mt-3 uppercase tracking-wider">
                      Calibrated Clinical Decision Support Model
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {parseError && (
            <div className="p-5 neu-inset text-red-700 rounded-3xl border border-red-200 text-center text-xs sm:text-sm font-black tracking-wider uppercase">
              {parseError}
            </div>
          )}

        </div>
      ) : (
        /* MANUAL ENTRY MODE (Spacious Neumorphic Layout) */
        <div className="flex flex-col w-full space-y-8">
          {/* Quick Fill Presets */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 neu-inset rounded-3xl">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-[11px] sm:text-xs font-black tracking-wider text-slate-700 uppercase">Presets:</span>
              <button type="button" onClick={() => loadPreset('high')} className="neu-button px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black text-red-700 rounded-full hover:bg-red-50 transition-all">High Risk Male (62y)</button>
              <button type="button" onClick={() => loadPreset('atypical')} className="neu-button px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black text-amber-700 rounded-full hover:bg-amber-50 transition-all">Borderline Risk (54y)</button>
              <button type="button" onClick={() => loadPreset('low')} className="neu-button px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-black text-emerald-700 rounded-full hover:bg-emerald-50 transition-all">Low Risk (32y)</button>
            </div>
            {liveBmi && (
              <div className={`px-3.5 py-1.5 text-xs font-black rounded-full neu-inset-sm self-start sm:self-auto ${liveBmi.color}`}>
                BMI: {liveBmi.val} ({liveBmi.cat})
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full">
            <div className="lg:col-span-8 space-y-5 sm:space-y-6">
              
              {/* 1. Demographics & Anthropometrics */}
              <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                <div className="pb-2 border-b border-slate-200/60">
                  <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#17805d] shadow-[0_0_8px_#17805d]"></span>
                    1. Demographics & Anthropometrics
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                  <div>
                    <label className={labelClasses}>Age (years)</label>
                    <input required type="number" name="age" value={formData.age} onChange={handleChange} className={inputClasses} placeholder="55" min={1} max={120} />
                  </div>
                  <div>
                    <label className={labelClasses}>Biological Sex</label>
                    <select name="sex" value={formData.sex} onChange={handleChange} className={inputClasses}>
                      <option value={1}>Male</option>
                      <option value={0}>Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Height (cm)</label>
                    <input type="number" name="height" value={formData.height} onChange={handleChange} className={inputClasses} placeholder="170" min={50} max={250} />
                  </div>
                  <div>
                    <label className={labelClasses}>Weight (kg)</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} className={inputClasses} placeholder="75" min={20} max={300} />
                  </div>
                </div>
              </div>

              {/* 2. Blood Pressure */}
              <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                    2. Blood Pressure (mmHg)
                  </h4>
                  {liveBpStage.label && (
                    <span className={`text-xs px-3.5 py-1 font-black rounded-full neu-inset-sm ${liveBpStage.color}`}>
                      {liveBpStage.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={labelClasses}>Systolic BP (ap_hi)</label>
                    <input required type="number" name="ap_hi" value={formData.ap_hi} onChange={handleChange} className={inputClasses} placeholder="120" min={50} max={260} />
                  </div>
                  <div>
                    <label className={labelClasses}>Diastolic BP (ap_lo)</label>
                    <input required type="number" name="ap_lo" value={formData.ap_lo} onChange={handleChange} className={inputClasses} placeholder="80" min={30} max={180} />
                  </div>
                </div>
              </div>

              {/* 3. Clinical Laboratory Tiers */}
              <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                <div className="pb-2 border-b border-slate-200/60">
                  <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                    3. Clinical Laboratory Tiers
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className={labelClasses}>Total Cholesterol</label>
                    <select name="cholesterol" value={formData.cholesterol} onChange={handleChange} className={inputClasses}>
                      <option value={1}>Normal (&lt; 200 mg/dL)</option>
                      <option value={2}>Above Normal (200 - 239 mg/dL)</option>
                      <option value={3}>Well Above Normal (≥ 240 mg/dL)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Fasting Glucose (Blood Sugar)</label>
                    <select name="gluc" value={formData.gluc} onChange={handleChange} className={inputClasses}>
                      <option value={1}>Normal (&lt; 100 mg/dL)</option>
                      <option value={2}>Above Normal (100 - 125 mg/dL)</option>
                      <option value={3}>Well Above Normal (≥ 126 mg/dL)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Lifestyle Indicators */}
              <div className="p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-4 sm:space-y-5 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
                <div className="pb-2 border-b border-slate-200/60">
                  <h4 className="text-xs font-black tracking-widest text-slate-800 uppercase flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#17805d] shadow-[0_0_8px_#17805d]"></span>
                    4. Lifestyle & Behavioral Factors
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <div>
                    <label className={labelClasses}>Smoking Status</label>
                    <select name="smoke" value={formData.smoke} onChange={handleChange} className={inputClasses}>
                      <option value={0}>Non-smoker</option>
                      <option value={1}>Smoker</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Alcohol Consumption</label>
                    <select name="alco" value={formData.alco} onChange={handleChange} className={inputClasses}>
                      <option value={0}>No / Minimal</option>
                      <option value={1}>Regular Consumer</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Physical Activity</label>
                    <select name="active" value={formData.active} onChange={handleChange} className={inputClasses}>
                      <option value={1}>Regularly Active</option>
                      <option value={0}>Sedentary</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Collapsible Advanced Cardiac Markers */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="neu-button inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl transition-all"
                >
                  <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  {showAdvanced ? "Hide Advanced Cardiac Markers" : "Add Advanced Clinical Markers (ECG & Stress)"}
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 sm:p-6 md:p-8 neu-inset rounded-3xl space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                      <div>
                        <label className={labelClasses}>Chest Pain Type</label>
                        <select name="cp" value={formData.cp} onChange={handleChange} className={inputClasses}>
                          <option value={0}>Typical Angina</option>
                          <option value={1}>Atypical Angina</option>
                          <option value={2}>Non-Anginal</option>
                          <option value={3}>Asymptomatic</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Max Heart Rate</label>
                        <input type="number" name="thalach" value={formData.thalach} onChange={handleChange} className={inputClasses} placeholder="150" />
                      </div>
                      <div>
                        <label className={labelClasses}>Exercise Angina</label>
                        <select name="exang" value={formData.exang} onChange={handleChange} className={inputClasses}>
                          <option value={0}>No</option>
                          <option value={1}>Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>ST Depression</label>
                        <input type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} className={inputClasses} placeholder="0.0" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Symptoms & Final Action */}
            <div className="lg:col-span-4 flex flex-col justify-between p-4 sm:p-6 md:p-8 neu-flat rounded-3xl space-y-5 sm:space-y-6 border border-white/60 shadow-[6px_6px_16px_rgba(163,177,198,0.3),-6px_-6px_16px_rgba(255,255,255,0.8)]">
              <div className="space-y-3">
                <label className={`${labelClasses} flex items-center justify-between`}>
                  <span>Reported Symptoms</span>
                  <span className="text-[10px] neu-inset-sm text-[#17805d] px-2.5 py-0.5 rounded-full font-black">NLP ENHANCED</span>
                </label>
                <textarea 
                  name="symptoms" 
                  value={formData.symptoms} 
                  onChange={handleTextChange} 
                  className="w-full neu-input rounded-2xl p-3.5 sm:p-4 text-slate-800 text-sm placeholder:text-slate-400 outline-none min-h-[160px] sm:min-h-[220px] resize-none font-semibold leading-relaxed" 
                  placeholder="Describe feelings, symptoms, or clinical notes (e.g. 'retrosternal heaviness on exertion, shortness of breath, palpitations')..." 
                />
              </div>

              <div className="pt-4 border-t border-slate-200/60">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="neu-button-matte-3d w-full py-3.5 sm:py-4.5 rounded-2xl font-black tracking-wider uppercase text-xs sm:text-sm cursor-pointer shadow-xl disabled:opacity-60 flex justify-center items-center gap-2.5"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      Evaluating Patient...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      Predict Cardiovascular Risk
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </form>
  );
}
