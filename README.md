# ZEZE: Zero Error Zonal Evaluation Engine
### *AI-Assisted Clinical Decision Support & Cardiovascular Risk Stratification*

[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20%2F%20React%2019-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-HistGradientBoosting%20%2B%20Isotonic%20Calibration-F7931E?style=flat&logo=scikit-learn)](https://scikit-learn.org/)
[![RapidOCR](https://img.shields.io/badge/OCR-RapidOCR%20ONNX-blue?style=flat)](https://github.com/RapidAI/RapidOCR)
[![TailwindCSS v4](https://img.shields.io/badge/Styling-Tailwind%20v4%20%2B%20Neumorphic%20Glass-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker Ready](https://img.shields.io/badge/Deployment-Docker%20%2F%20Vercel%20%2F%20Render-blueviolet?style=flat&logo=docker)](https://www.docker.com/)

---

## 📌 Executive Summary

**ZEZE (Zero Error Zonal Evaluation)** is an enterprise-grade Clinical Decision Support System (CDSS) built to bridge machine learning precision with actionable medical workflows. Trained and calibrated on an empirical cohort of **70,000 patient records**, ZEZE analyzes complex hemodynamic, anthropometric, and metabolic indicators to stratify cardiovascular risk with a **95.8% validation accuracy** and **0.875 ROC-AUC**.

ZEZE provides **three tailored operational modes**:
1. **🩺 Clinicians / Doctors**: Evidence-based risk stratification, ACC/AHA blood pressure staging, differential assessment flags, and recommended clinical pathways.
2. **🎓 Healthcare Trainees**: Supervised learning workspace with transparent feature attribution drivers, physiological mechanisms, and pharmacology pearls.
3. **👤 Patients / General Public**: Plain-language health translations, visual score dials, lifestyle interventions, and preventive guidance.

---

## 🚀 Key Clinical & Technical Features

### 1. Dual-Channel Clinical Data Ingestion
- **Smart Document Scan (On-Device RapidOCR)**: Upload lab slips or clinical notes in PDF, PNG, or JPG format. The built-in ONNX pipeline extracts blood pressure, total cholesterol tiers, fasting glucose, and vitals in **< 800ms** without transmitting raw document images to external servers.
- **Review & Verify Workspace**: Missing fields are highlighted in amber before submission to ensure data completeness.
- **Manual Clinical Entry**: Interactive tactile form with live BMI calculation and real-time ACC/AHA blood pressure stage validation.

### 2. Calibrated Machine Learning Engine
- **Model Architecture**: Histogram-based Gradient Boosted Decision Trees (`HistGradientBoostingClassifier`) coupled with **Isotonic Probability Calibration**.
- **Transparent Feature Attribution**: The "What Contributed Most" section deconstructs exact log-odds impact across resting hemodynamics, atherogenic lipid tiers, vascular compliance (age), glycemic status, and lifestyle factors.
- **Milestone-Calibrated Risk Dials**: Multi-tiered visual dials featuring dark-red clinical thresholds for severe zones.

### 3. Interactive What-If Scenario Simulator
- Enables clinicians and patients to simulate the therapeutic effect of modifiable risk interventions:
  - Systolic BP reduction (90–180 mmHg)
  - Smoking cessation
  - Lipid lowering (Tier 3 &rarr; Tier 1)
  - Physical activity adoption
- Displays dynamic before-and-after risk delta (e.g., `-28.5% Estimated Risk Reduction`).

### 4. Integrated Clinical Pharmacopeia & Drug Reference
- Filterable reference covering **Antihypertensives**, **Lipid-Lowering Agents (Statins/PCSK9i)**, **Antiplatelets**, **Antidiabetic SGLT2i/GLP-1 RA**, and **Antiarrhythmics**.
- Includes mechanisms of action, daily kinetics, ACC/AHA guidelines, and trainee learning pearls.

### 5. Automated Clinical Report Generation (PDF)
- One-click export producing an A4 structured clinical summary report containing patient vitals, risk zone classification, differential audit tables, and non-prescriptive review prompts.

### 6. Fully Responsive Mobile & Desktop Interface
- Engineered with fluid layouts that scale seamlessly from compact mobile screens (320px–640px) to ultra-wide desktop monitors without card clipping or horizontal overflows.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │   Lab Report / PDF / Image    │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
┌───────────────────────────┐      ┌───────────────────────────────┐
│ Manual Clinical Parameter │      │   RapidOCR (ONNX Runtime)     │
│       Entry Form          │      │ + Clinical Entity Extraction  │
└─────────────┬─────────────┘      └──────────────┬────────────────┘
              │                                   │
              └─────────────────┬─────────────────┘
                                │
                                ▼
               ┌─────────────────────────────────┐
               │    FastAPI Validation Layer     │
               └────────────────┬────────────────┘
                                │
                                ▼
               ┌─────────────────────────────────┐
               │ 70k Cohort Gradient Boosting    │
               │   + Isotonic Calibrated Model   │
               └────────────────┬────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Clinician CDS │      │ Trainee Rationale│     │ Patient Guidance│
│ Pathways      │      │ & Feature Drivers│     │ & Lifestyle     │
└───────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, TypeScript 5) |
| **UI & Styling** | React 19, Vanilla CSS Design System, [TailwindCSS v4](https://tailwindcss.com/), Lucide React Icons |
| **Backend Service** | [FastAPI](https://fastapi.tiangolo.com/), Uvicorn ASGI, Pydantic v2 |
| **Machine Learning** | [scikit-learn](https://scikit-learn.org/), Joblib, NumPy, Pandas, SciPy |
| **Document Processing** | RapidOCR ONNX, PyPDF, OpenCV Headless, Pillow |
| **Generative AI & Chat** | Groq SDK (`llama-3.3-70b-versatile`) with optional Gemini fallback for clinical conversational context |
| **Containerization** | Docker, Docker Compose, Multi-stage Builds |

---

## 📁 Repository Structure

```
ZEZE/
├── Backend/
│   ├── ml/
│   │   ├── cardio_model.joblib          # Calibrated ML Model (1.6 MB, tracked)
│   │   ├── cardio_model_metadata.json   # Model validation metrics & parameters
│   │   ├── cardio_train.csv             # 70,000-cohort training dataset (2.9 MB)
│   │   ├── model_weights.json           # Fallback linear reference weights
│   │   ├── ocr_extractor.py             # RapidOCR clinical entity extractor
│   │   └── train_cardio.py              # Offline model training & calibration script
│   ├── Dockerfile                       # Production container definition for FastAPI
│   ├── main.py                          # FastAPI application & endpoints
│   ├── requirements.txt                 # Pinned Python dependencies
│   └── .env.example                     # Backend environment template
│
├── Client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout & mobile viewport configuration
│   │   │   ├── page.tsx                 # Landing page & Persona selector
│   │   │   ├── globals.css              # Neumorphic design system & scroll utilities
│   │   │   ├── assessment/page.tsx      # Assessment intake & Mode switcher
│   │   │   └── result/page.tsx          # Results dashboard & AI drawer
│   │   └── components/
│   │       ├── ResultCard.tsx           # Comprehensive result dashboard component
│   │       ├── RiskForm.tsx             # OCR review & manual entry form
│   │       └── MedicationReference.tsx  # Clinical Pharmacopeia modal & accordion
│   ├── Dockerfile                       # Multi-stage production container for Next.js
│   ├── package.json                     # Frontend scripts & dependencies
│   ├── vercel.json                      # Vercel deployment configuration
│   └── .env.example                     # Frontend environment template
│
├── .gitignore                           # Production git exclusion rules
├── docker-compose.yml                   # One-command full-stack containerization
└── README.md                            # Complete documentation
```

---

## ⚡ Quickstart: Local Development

### Prerequisites
- **Node.js**: v18.18+ or v20+
- **Python**: v3.10 or v3.11
- **Git**

### Option A: Running with Docker Compose (Fastest)

Clone the repository and spin up both services with a single command:

```bash
git clone https://github.com/Sayan-CtrlZ/ZEZE.git
cd ZEZE

# Launch backend (port 8000) and frontend (port 3000)
docker compose up --build
```

Access the frontend at `http://localhost:3000` and the backend healthcheck at `http://localhost:8000/`.

---

### Option B: Running Manually

#### 1. Backend Setup (FastAPI)
```bash
cd Backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Optional: add your GEMINI_API_KEY inside .env for interactive AI chat

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI backend will be available at `http://localhost:8000`. Swagger API documentation is available at `http://localhost:8000/docs`.

#### 2. Frontend Setup (Next.js)
```bash
cd Client

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Production Deployment Guide

ZEZE is architected for zero-friction deployment on modern cloud platforms.

### 1. Deploy Backend (Render / Railway / Fly.io / AWS ECS)

#### Deploying on Render:
1. Create a new **Web Service** on [Render](https://render.com/).
2. Select your GitHub repository.
3. Configure the service settings:
   - **Root Directory**: `Backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `GROQ_API_KEY`: Your Groq API Key (from https://console.groq.com/keys).
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `GROQ_TEMPERATURE`: `0.5`
   - `CORS_ORIGINS`: `*` (or your frontend Vercel domain).
   - *(Optional)* `GEMINI_API_KEY`: Fallback Google Gemini API key.
5. Deploy the service and copy the public URL (e.g., `https://zeze-backend.onrender.com`).

---

### 2. Deploy Frontend (Vercel)

#### Deploying on Vercel:
1. Create a new project on [Vercel](https://vercel.com/).
2. Import your GitHub repository.
3. Set **Root Directory** to `Client`.
4. Framework preset will automatically detect **Next.js**.
5. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: The public URL of your deployed backend (e.g., `https://zeze-backend.onrender.com` without trailing slash).
6. Click **Deploy**.

---

## 🔒 Environment Variables Reference

### Backend (`Backend/.env`)
| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `PORT` | Port for the ASGI server to bind to | `8000` | No |
| `HOST` | Host address for the server | `0.0.0.0` | No |
| `GROQ_API_KEY` | Groq API key for clinical chat & extraction | `gsk_...` | Recommended |
| `GROQ_MODEL` | Groq LLM model identifier | `llama-3.3-70b-versatile` | No |
| `GROQ_TEMPERATURE` | Sampling temperature | `0.5` | No |
| `GEMINI_API_KEY` | Optional fallback Gemini key | `AIzaSy...` | Optional |
| `GEMINI_MODEL` | Gemini LLM version identifier | `gemini-2.5-flash` | No |
| `GEMINI_TEMPERATURE` | Temperature for response generation | `0.7` | No |
| `CORS_ORIGINS` | Comma-delimited list of allowed CORS origins | `*` | No |

### Frontend (`Client/.env.local`)
| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base HTTP endpoint of the ZEZE Backend | `http://localhost:8000` | Yes |

---

## ⚖️ Clinical Governance & Regulatory Disclaimer

> [!IMPORTANT]
> **ZEZE is a clinical decision support and educational research tool.**
>
> 1. **Not an Autonomous Diagnostic Device**: Outputs generated by this system represent statistical probabilities derived from historical cohort data. They do not constitute an autonomous medical diagnosis or a binding prescription.
> 2. **Professional Clinical Supervision**: All risk assessments, biomarker flags, and medication references must be evaluated by a licensed healthcare professional in the context of comprehensive patient history and diagnostic testing.
> 3. **Emergency Care**: If a patient is experiencing acute symptoms such as severe chest pain, radiating discomfort, or dyspnea, seek immediate emergency medical care.

---

## 📄 License
This project is released under the **MIT License**. See [LICENSE](LICENSE) for details.
