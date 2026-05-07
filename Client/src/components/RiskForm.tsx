import React, { useState, useEffect } from 'react';

export type FormData = {
  age: number | '';
  sex: number | '';
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

interface RiskFormProps {
  onSubmit: (data: FormData) => void;
  onDocumentSubmit?: (files: FileList | File[], symptoms: string) => void;
  isLoading: boolean;
  mode?: 'upload' | 'manual';
}

export default function RiskForm({ onSubmit, onDocumentSubmit, isLoading, mode = 'upload' }: RiskFormProps) {
  const [formData, setFormData] = useState<FormData>({
    age: '', sex: '', cp: '', trestbps: '', chol: '', fbs: '', restecg: '', thalach: '',
    exang: '', oldpeak: '', slope: '', ca: '', thal: '', symptoms: ''
  });
  
  const [parseError, setParseError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | File[] | null>(null);

  // Preserve form data when navigating physically back and forth
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) >= 0 || value.includes('.') ? Number(value) : value }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, symptoms: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSelectedFiles(files);
    setParseError("");
  };

  const handleDocumentSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      setParseError("Please select a document first.");
      return;
    }
    if (onDocumentSubmit) {
      onDocumentSubmit(selectedFiles, formData.symptoms);
    }
  };

  const inputClasses = "w-full bg-white/50 backdrop-blur-2xl border-2 border-white/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-900/40 focus:border-brand-900/60 focus:bg-white/80 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-500 shadow-sm";
  const labelClasses = "block text-xs font-bold tracking-wider text-gray-800 mb-1.5";

  return (
    <form onSubmit={mode === 'upload' ? handleDocumentSubmitClick : handleSubmit} className="relative space-y-4 md:space-y-6 backdrop-blur-[64px] bg-white/30 p-4 sm:p-6 lg:p-10 rounded-2xl md:rounded-[2rem] border border-white/50 shadow-[0_16px_48px_0_rgba(0,0,0,0.1)] overflow-hidden flex flex-col justify-center text-brand-900 w-full max-w-full">
      
      {/* Decorative inner glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-white/60 via-brand-100/40 to-white/60 blur-xl opacity-60 z-[-1] pointer-events-none"></div>

      {mode === 'upload' ? (
        <div className="flex flex-col space-y-4 max-w-4xl mx-auto w-full">
          {/* Smart Document Upload */}
          <div className="w-full bg-white/40 backdrop-blur-xl border-2 border-dashed border-white/80 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center transition-all hover:bg-white/60 relative group shadow-sm">
            <input 
              type="file" 
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileUpload}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
            />
            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              {selectedFiles && selectedFiles.length > 0 ? (
                <>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center shadow-lg border-2 border-green-500">
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="font-black text-xl md:text-2xl text-brand-900 tracking-tight">{selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''} Ready</h3>
                  <p className="text-xs md:text-sm font-bold tracking-wider text-green-600 uppercase">Click or Drag to change</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-900 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <h3 className="font-black text-xl md:text-2xl text-brand-900 tracking-tight">Upload Clinical Report</h3>
                  <p className="text-xs md:text-sm font-bold tracking-wider text-brand-900/70 uppercase">Drag & Drop (PDF, JPG, PNG)</p>
                </>
              )}
            </div>
          </div>

          {parseError && (
            <div className="p-4 bg-red-50/80 backdrop-blur border border-red-200 text-red-600 rounded-xl text-center text-sm font-bold tracking-widest uppercase shadow-sm">
              {parseError}
            </div>
          )}



          {/* ChatGPT-style input area */}
          <div className="w-full bg-white/60 backdrop-blur-3xl border border-white/60 rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-xl focus-within:ring-4 focus-within:ring-brand-900/20 transition-all">
            <textarea 
              name="symptoms" 
              value={formData.symptoms} 
              onChange={handleTextChange} 
              className="w-full bg-transparent border-none outline-none resize-none min-h-[80px] md:min-h-[100px] p-2 md:p-4 text-brand-900 placeholder:text-brand-900/50 font-medium text-base md:text-lg leading-relaxed" 
              placeholder="Add any extra symptoms or clinical context here... (e.g. 'Patient reports chest pain when climbing stairs')" 
            />
            <div className="flex flex-col sm:flex-row justify-between items-center pt-3 md:pt-4 border-t border-brand-900/10 mt-1 md:mt-2 gap-3 sm:gap-0">
              <span className="text-[10px] md:text-xs font-bold tracking-widest text-brand-900/40 uppercase px-2 md:px-4">Optional AI Context</span>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-brand-900 hover:bg-black text-white rounded-xl md:rounded-2xl font-bold tracking-widest uppercase transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-3 text-sm md:text-base"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Evaluating...
                  </>
                ) : (
                  <>
                    Predict Risk
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full">
          {/* Left Column: Essential Clinic Metrics */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClasses}>Age limit</label>
                <input required type="number" name="age" value={formData.age} onChange={handleChange} className={inputClasses} placeholder="55" />
              </div>
              <div>
                <label className={labelClasses}>Gender</label>
                <select required name="sex" value={formData.sex} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>Select</option>
                  <option value={1}>Male</option>
                  <option value={0}>Female</option>
                  <option value={0.5}>Non-binary / Trans</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClasses}>Chest Pain Description</label>
                <select required name="cp" value={formData.cp} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>Select...</option>
                  <option value={0}>Typical Pain</option>
                  <option value={1}>Atypical Pain</option>
                  <option value={2}>Non-anginal Pain</option>
                  <option value={3}>No Pain (Asymptomatic)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClasses}>Pain from Exercise?</label>
                <select required name="exang" value={formData.exang} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>Select</option>
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Resting Heart Rhythm</label>
                <select required name="restecg" value={formData.restecg} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>Select</option>
                  <option value={0}>Normal</option>
                  <option value={1}>Abnormal Wave</option>
                  <option value={2}>Enlarged (LVH)</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Heart Rate Slope</label>
                <select required name="slope" value={formData.slope} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>Select</option>
                  <option value={0}>Upsloping</option>
                  <option value={1}>Flat</option>
                  <option value={2}>Downsloping</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Blocked Vessels</label>
                <select required name="ca" value={formData.ca} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>0</option>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClasses}>Resting BP (mmHg)</label>
                <input required type="number" name="trestbps" value={formData.trestbps} onChange={handleChange} className={inputClasses} placeholder="120" />
              </div>
              <div>
                <label className={labelClasses}>Cholesterol</label>
                <input required type="number" name="chol" value={formData.chol} onChange={handleChange} className={inputClasses} placeholder="200" />
              </div>
              <div>
                <label className={labelClasses}>Max Heart Rate</label>
                <input required type="number" name="thalach" value={formData.thalach} onChange={handleChange} className={inputClasses} placeholder="150" />
              </div>
              <div>
                <label className={labelClasses}>Stress Test Depress</label>
                <input required type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleChange} className={inputClasses} placeholder="0.0" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className={labelClasses}>High Blood Sugar {'>'} 120</label>
                <select required name="fbs" value={formData.fbs} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>Select</option>
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClasses}>Blood Profile (Thalassemia)</label>
                <select required name="thal" value={formData.thal} onChange={handleChange} className={inputClasses}>
                  <option value="" disabled>Select...</option>
                  <option value={1}>Normal</option>
                  <option value={2}>Fixed Defect</option>
                  <option value={3}>Reversible</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: AI Symptoms Input */}
          <div className="lg:col-span-4 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-white/50 pt-6 mt-4 lg:mt-0 lg:pt-0 lg:pl-8">
            <div className="flex-1 flex flex-col">
              <label className={`${labelClasses} flex items-center justify-between mb-3 text-brand-900`}>
                <span>Patient Symptoms</span>
                <span className="text-[10px] bg-brand-900 text-brand-100 px-2 md:px-3 py-1 rounded-full shadow-sm tracking-widest">AI POWERED</span>
              </label>
              <textarea 
                name="symptoms" 
                value={formData.symptoms} 
                onChange={handleTextChange} 
                className={`${inputClasses} flex-1 resize-none min-h-[120px] md:min-h-[160px]`} 
                placeholder="Describe what you're feeling here... e.g. 'chest pain while walking, shortness of breath, etc.' Our AI will map these." 
              />
            </div>
            
            <div className="pt-6 mt-auto">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full px-6 py-4 bg-brand-900 hover:bg-black text-white rounded-xl font-bold tracking-widest uppercase transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-900/30 disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2 text-sm md:text-base"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : "Predict Risk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
