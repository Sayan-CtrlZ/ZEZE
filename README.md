# ZEZE: Zero Error Zonal Evaluation Model
**An Intelligent Clinical Risk Assessment System**

> *“Precision in Prediction. Clarity in Care.”*

ZEZE is a healthcare-focused analytical AI system designed to process structured patient data and generate accurate, interpretable risk assessments. It aims to bridge the gap between clinical inputs and actionable insights, enabling early-stage evaluation and decision support.

---

## 🔹 1. Objective
- To provide data-driven risk assessment based on patient inputs.
- To enhance the interpretability of clinical predictions using Generative AI.
- To support early detection and awareness in cardiovascular health.

---

## 🔹 2. Core Functionality

### 🧩 Input Layer
ZEZE collects structured clinical data along with natural language symptom descriptions:
- **Demographics**: Age, Sex
- **Symptoms**: Chest pain type, Exercise-induced responses
- **Clinical Parameters**:
  - Blood pressure (Resting BP)
  - Cholesterol levels
  - Heart rate (Max HR)
  - ECG indicators
  - Other diagnostic variables (Thalassemia, ST Depression, Vessels)

### ⚙️ Processing Layer
- Data is processed through a predictive machine learning model (Logistic Regression).
- The model identifies patterns and correlations.
- **Outputs**:
  - Risk classification (e.g., High / Low)
  - Probability score (0–100%)

### 📊 Output Layer
ZEZE provides:
- **Risk Assessment Result**: Clearly displayed with dynamic color psychology.
- **Confidence Score / Probability**: Exact percentage of risk likelihood.
- **Simplified Explanation**: AI-generated (via Google Gemini) for user clarity, translating complex medical values into a simple, human-readable summary.

---

## 🔹 3. Key Features

✅ **Predictive Risk Evaluation**
- Identifies the likelihood of cardiovascular conditions based on structured clinical datasets.

✅ **Explainable AI Integration**
- Translates ML predictions into simple, human-readable insights. If a patient enters natural language symptoms, the AI intelligently maps them directly to the risk form variables.

✅ **Zero Error Philosophy**
- Designed with a focus on minimizing prediction errors and improving reliability over time through strict structured input parameters.

✅ **Modular Interface**
- Currently deployed as a premium Glassmorphic Web Application (Next.js), but easily adaptable for chatbot interfaces or other form-based systems via the decoupled FastAPI backend.

✅ **Real-Time Processing**
- Generates instant predictions from user inputs.

---

## 🔹 4. System Architecture

`Input → Model → Prediction → Explanation → Output`

- **Frontend**: Premium Next.js React UI (Form input & Results UI).
- **Backend**: Python FastAPI data processing + Scikit-Learn Model Execution.
- **AI Layer**: Google Gemini 1.5 Flash (Symptom parsing + Explanation generation).
- **Output**: Risk result + AI Insights.

---

## 🔹 5. Development & Deployment

### Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind V4 CSS, React 19, TypeScript
- **Backend**: FastAPI, Python 3.10+, Scikit-Learn, Pandas, NumPy, Uvicorn
- **AI**: Google Generative AI (`gemini-1.5-flash`)

### How to Run Locally

**1. Run the Backend**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # (Windows)
pip install -r requirements.txt
# Ensure .env is populated with GEMINI_API_KEY
uvicorn main:app --host 0.0.0.0 --port 10000 --reload
```

**2. Run the Frontend**
```bash
cd Client
npm install
# Ensure .env.local has NEXT_PUBLIC_API_URL=http://localhost:10000/predict
npm run dev
```

Visit `http://localhost:3000` to interact with the ZEZE platform!
