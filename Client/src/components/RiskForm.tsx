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

type RiskFormProps = {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
};

export default function RiskForm({ onSubmit, isLoading }: RiskFormProps) {
  const [formData, setFormData] = useState<FormData>({
    age: '', sex: '', cp: '', trestbps: '', chol: '', fbs: '', restecg: '', thalach: '',
    exang: '', oldpeak: '', slope: '', ca: '', thal: '', symptoms: ''
  });

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

  const inputClasses = "w-full bg-white/50 backdrop-blur-2xl border-2 border-white/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-900/40 focus:border-brand-900/60 focus:bg-white/80 transition-all font-semibold text-gray-900 placeholder:font-medium placeholder:text-gray-500 shadow-sm";
  const labelClasses = "block text-xs font-bold tracking-wider text-gray-800 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6 backdrop-blur-[64px] bg-white/30 p-6 lg:p-12 min-h-[60vh] rounded-[2rem] border border-white/50 shadow-[0_16px_48px_0_rgba(0,0,0,0.1)] overflow-hidden flex flex-col justify-center text-brand-900">
      
      {/* Decorative inner glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-white/60 via-brand-100/40 to-white/60 blur-xl opacity-60 z-[-1] pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
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
        <div className="lg:col-span-4 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-white/50 pt-6 lg:pt-0 lg:pl-8">
          <div className="flex-1 flex flex-col">
            <label className={`${labelClasses} flex items-center justify-between mb-3 text-brand-900`}>
              <span>Patient Symptoms Journal</span>
              <span className="text-[10px] bg-brand-900 text-brand-100 px-3 py-1 rounded-full shadow-sm tracking-widest">AI POWERED</span>
            </label>
            <textarea 
              name="symptoms" 
              value={formData.symptoms} 
              onChange={handleTextChange} 
              className={`${inputClasses} flex-1 resize-none min-h-[160px]`} 
              placeholder="Describe what you're feeling here... e.g. 'chest pain while walking, shortness of breath, etc.' Our AI will map these." 
            />
          </div>
          
          <div className="pt-6 mt-auto">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-6 py-4 bg-brand-900 hover:bg-black text-white rounded-xl font-bold tracking-widest uppercase py-4 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-900/30 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : "Predict"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
