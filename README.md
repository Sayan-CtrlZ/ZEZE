# ZEZE: Zero Error Zonal Evaluation Model
**An Intelligent Clinical Risk Assessment System**

> *"Precision in Prediction. Clarity in Care."*

ZEZE is a healthcare-focused analytical AI system designed to process structured patient data and generate accurate, interpretable cardiovascular risk assessments. 

---

## 🔹 1. Core Functionality

### 🧩 Input Layer (Manual & Smart Scan)
ZEZE collects patient data via two primary pathways:
1. **Manual Entry**: Users can input specific clinical parameters directly into the interactive dashboard.
2. **Smart Document Scan**: Users can upload clinical reports (PDF, JPG, PNG). The system uses AI-assisted vision to extract the clinical parameters from the documents seamlessly.

Both input pathways capture:
- **Demographics**: Age, Sex
- **Symptoms**: Chest pain type, Exercise-induced responses
- **Clinical Parameters**: Resting BP, Cholesterol levels, Max HR, ECG indicators, Thalassemia, ST Depression, etc.

### ⚙️ Processing Layer
- Extracted and entered data is passed directly into our **Predictive Machine Learning Model**.
- The ML pipeline identifies patterns and correlates the multi-dimensional clinical inputs.
- **Outputs**:
  - Risk classification (e.g., High / Low)
  - Probability score (0–100%)

### 📊 Output Layer
ZEZE translates complex ML outputs into a clear, clinical dashboard:
- **Risk Assessment Result**: Displayed with dynamic color psychology.
- **Confidence Score / Probability**: Exact percentage of risk likelihood.
- **AI Diagnostic Summary**: The system utilizes Google Gemini to provide a 3-4 bullet point, human-readable summary, translating the raw values into clear, supportive clinical insights.
- **Interactive Assistant**: Users can chat with the AI about their specific test results for lifestyle guidance.

---

## 🔹 2. System Architecture

`Input (Manual / Smart Scan) → ML Prediction Model → AI Diagnostic Summary → Dashboard UI`

- **Frontend**: Premium Next.js React UI (Tailwind CSS, App Router).
- **Backend**: Python FastAPI + Scikit-Learn Model Execution.
- **AI Layer**: Google GenAI (`gemini-2.5-flash`) for parsing documents and generating clinical explanations.

---

## 🔹 3. Deployment Guide

The project is structured to be deployed securely and independently.

### Deploying the Backend (Render)
The backend is a FastAPI application designed to run on a service like [Render](https://render.com/).

1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `Backend`.
4. Set the **Build Command** to: `pip install -r requirements.txt`
5. Set the **Start Command** to: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `GEMINI_TEMPERATURE`: `0.7`

### Deploying the Client (Vercel)
The frontend is a Next.js application perfectly optimized for [Vercel](https://vercel.com/).

1. Create a new **Project** on Vercel.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `Client`.
4. The Build and Output settings will be automatically detected for Next.js.
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed Render backend (e.g., `https://zeze-backend.onrender.com`). Do not include a trailing slash.
   
---

## 🔹 4. Local Development

**1. Run the Backend**
```bash
cd Backend
python -m venv venv
# Activate venv: source venv/bin/activate (Mac/Linux) or venv\Scripts\activate (Windows)
pip install -r requirements.txt
python main.py
```

**2. Run the Frontend**
```bash
cd Client
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the ZEZE platform locally!
