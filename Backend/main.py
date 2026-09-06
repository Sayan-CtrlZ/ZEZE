import os
import math
import joblib
import numpy as np
import pandas as pd
import logging
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from auth import auth_router

app = FastAPI(title="ZEZE Cardiovascular Risk Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Server exception intercepted: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again."}
    )

@app.get("/")
def health_check():
    return {
        "status": "ok", 
        "message": "ZEZE Backend is running", 
        "model": "Calibrated_HistGradientBoosting" if cardio_model else "Legacy_LogisticRegression"
    }

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("zeze-backend")

# Configure environment and Gemini
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client_env_path = os.path.join(os.path.dirname(__file__), '..', 'Client', '.env')
if os.path.exists(client_env_path):
    load_dotenv(client_env_path)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")
GEMINI_TEMPERATURE = os.getenv("GEMINI_TEMPERATURE")

if GEMINI_API_KEY and GEMINI_MODEL and GEMINI_TEMPERATURE:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    logger.info(f"Gemini client initialized with model: {GEMINI_MODEL}")
else:
    logger.warning("One or more Gemini environment variables missing. AI summaries will use rule-based fallback.")
    gemini_client = None

# Load Models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CARDIO_MODEL_PATH = os.path.join(BASE_DIR, "ml", "cardio_model.joblib")
CARDIO_META_PATH = os.path.join(BASE_DIR, "ml", "cardio_model_metadata.json")
LEGACY_WEIGHTS_PATH = os.path.join(BASE_DIR, "ml", "model_weights.json")

cardio_model = None
cardio_meta = None
legacy_weights = None

# Primary: 70,000-record Calibrated Gradient Boosting Model
if os.path.exists(CARDIO_MODEL_PATH) and os.path.exists(CARDIO_META_PATH):
    try:
        cardio_model = joblib.load(CARDIO_MODEL_PATH)
        with open(CARDIO_META_PATH, "r") as f:
            cardio_meta = json.load(f)
        logger.info(f"Loaded Calibrated Cardio Model. Validation ROC-AUC: {cardio_meta['metrics']['roc_auc']}")
    except Exception as e:
        logger.error(f"Failed to load cardio_model.joblib: {e}")

# Fallback: Legacy weights
if os.path.exists(LEGACY_WEIGHTS_PATH):
    try:
        with open(LEGACY_WEIGHTS_PATH, "r") as f:
            legacy_weights = json.load(f)
    except Exception as e:
        logger.warning(f"Could not load legacy weights: {e}")

class PatientData(BaseModel):
    role: str = Field("patient", description="User role: patient, practitioner, or researcher")
    age: float = Field(50.0, ge=1, le=120, description="Patient age in years")
    sex: float = Field(1.0, ge=0, le=1, description="1 = male; 0 = female; 0.5 = other")

    # Upgraded Clinical & Lifestyle Parameters
    height: Optional[float] = Field(None, ge=80, le=250, description="Height in cm")
    weight: Optional[float] = Field(None, ge=30, le=280, description="Weight in kg")
    ap_hi: Optional[float] = Field(None, ge=60, le=260, description="Systolic blood pressure in mm Hg")
    ap_lo: Optional[float] = Field(None, ge=40, le=180, description="Diastolic blood pressure in mm Hg")
    cholesterol: Optional[int] = Field(None, ge=1, le=3, description="1: Normal (<200 mg/dl), 2: Above Normal, 3: High (>240)")
    gluc: Optional[int] = Field(None, ge=1, le=3, description="1: Normal (<100 mg/dl), 2: Above Normal, 3: High (>126)")
    smoke: Optional[int] = Field(0, ge=0, le=1, description="Smoking status: 0 = No, 1 = Yes")
    alco: Optional[int] = Field(0, ge=0, le=1, description="Alcohol consumption: 0 = No, 1 = Yes")
    active: Optional[int] = Field(1, ge=0, le=1, description="Regular physical activity: 0 = No, 1 = Yes")

    # Legacy & Supplemental Clinical Parameters
    trestbps: Optional[float] = Field(None, description="Resting BP in mm Hg (fallback for ap_hi)")
    chol: Optional[float] = Field(None, description="Serum cholesterol in mg/dl (fallback for cholesterol tier)")
    fbs: Optional[int] = Field(0, description="Fasting blood sugar > 120 (fallback for gluc tier)")
    cp: Optional[int] = Field(0, description="Chest pain type (0-3)")
    restecg: Optional[int] = Field(0, description="Resting ECG (0-2)")
    thalach: Optional[float] = Field(None, description="Maximum heart rate achieved")
    exang: Optional[int] = Field(0, description="Exercise induced angina (1=yes, 0=no)")
    oldpeak: Optional[float] = Field(0.0, description="ST depression")
    slope: Optional[int] = Field(0, description="Slope of peak exercise ST segment")
    ca: Optional[int] = Field(0, description="Number of major vessels")
    thal: Optional[int] = Field(0, description="Thalassemia")
    symptoms: Optional[str] = Field(None, description="Optional natural language description of symptoms")

def compute_cardio_features(data: PatientData):
    """Engineers clinical cardiology metrics conforming to the trained 70,000-record dataset."""
    age_years = float(data.age)
    gender = 1 if data.sex >= 0.5 else 0

    # Height and Weight with population medians (165 cm, 72 kg)
    height = float(data.height) if data.height and data.height >= 100 else 165.0
    weight = float(data.weight) if data.weight and data.weight >= 35 else 72.0
    bmi = round(weight / ((height / 100.0) ** 2), 1)

    # Systolic Blood Pressure
    if data.ap_hi and data.ap_hi >= 70:
        ap_hi = float(data.ap_hi)
    elif data.trestbps and data.trestbps >= 70:
        ap_hi = float(data.trestbps)
    else:
        ap_hi = 120.0

    # Diastolic Blood Pressure
    if data.ap_lo and data.ap_lo >= 40:
        ap_lo = float(data.ap_lo)
    else:
        # Clinical estimation rule when only systolic is given
        ap_lo = float(min(max(round(ap_hi * 0.66), 60), 110))

    if ap_hi <= ap_lo:
        ap_hi = ap_lo + 30.0

    pulse_pressure = ap_hi - ap_lo
    mean_arterial_pressure = round(ap_lo + (pulse_pressure / 3.0), 1)

    # ACC/AHA Blood Pressure Stages
    if ap_hi >= 140 or ap_lo >= 90:
        bp_stage = 3
    elif (130 <= ap_hi < 140) or (80 <= ap_lo < 90):
        bp_stage = 2
    elif (120 <= ap_hi < 130) and ap_lo < 80:
        bp_stage = 1
    else:
        bp_stage = 0

    # WHO BMI Category
    if bmi < 25.0:
        bmi_cat = 0
    elif bmi < 30.0:
        bmi_cat = 1
    elif bmi < 35.0:
        bmi_cat = 2
    else:
        bmi_cat = 3

    # Cholesterol tier (1: Normal, 2: Above, 3: Well Above)
    if data.cholesterol in [1, 2, 3]:
        chol_cat = int(data.cholesterol)
    elif data.chol and data.chol > 0:
        if data.chol < 200:
            chol_cat = 1
        elif data.chol < 240:
            chol_cat = 2
        else:
            chol_cat = 3
    else:
        chol_cat = 1

    # Fasting Glucose tier
    if data.gluc in [1, 2, 3]:
        gluc_cat = int(data.gluc)
    elif data.fbs == 1:
        gluc_cat = 2
    else:
        gluc_cat = 1

    smoke = 1 if data.smoke == 1 else 0
    alco = 1 if data.alco == 1 else 0
    active = 1 if (data.active is None or data.active == 1) else 0
    lifestyle_risk = smoke + alco + (1 - active)

    record = {
        'age_years': age_years,
        'gender': gender,
        'height': height,
        'weight': weight,
        'bmi': bmi,
        'ap_hi': ap_hi,
        'ap_lo': ap_lo,
        'pulse_pressure': pulse_pressure,
        'map': mean_arterial_pressure,
        'bp_stage': bp_stage,
        'bmi_category': bmi_cat,
        'cholesterol': chol_cat,
        'gluc': gluc_cat,
        'smoke': smoke,
        'alco': alco,
        'active': active,
        'lifestyle_risk': lifestyle_risk
    }

    feature_cols = cardio_meta["feature_names"] if cardio_meta else list(record.keys())
    df_features = pd.DataFrame([record])[feature_cols]
    return df_features, record

def compute_feature_impacts(record: dict, meta: dict) -> dict:
    """Calculates directional risk feature contributions compared to population medians."""
    impacts = {}
    importances = meta.get("feature_importances", {})
    baselines = meta.get("baselines", {})

    labels = {
        "ap_hi": f"Systolic Blood Pressure ({int(record['ap_hi'])} mmHg)",
        "age_years": f"Age ({int(record['age_years'])} yrs)",
        "cholesterol": f"Cholesterol Tier ({record['cholesterol']}/3)",
        "bmi": f"Body Mass Index (BMI {record['bmi']})",
        "map": f"Mean Arterial Pressure ({record['map']} mmHg)",
        "active": f"Physical Activity ({'Active' if record['active'] else 'Sedentary'})",
        "smoke": f"Smoking Status ({'Smoker' if record['smoke'] else 'Non-smoker'})",
        "gluc": f"Glucose Tier ({record['gluc']}/3)",
        "pulse_pressure": f"Pulse Pressure ({int(record['pulse_pressure'])} mmHg)"
    }

    for key, label in labels.items():
        if key in record and key in importances and key in baselines:
            val = record[key]
            med = baselines[key]["median"]
            std = baselines[key]["std"] if baselines[key]["std"] > 0 else 1.0
            imp = importances[key]
            
            if key == "active":
                direction = -1.0 if val == 1 else 1.0
                impact = direction * imp * 10.0
            else:
                z_score = (val - med) / std
                impact = z_score * imp * 10.0

            if abs(impact) >= 0.01:
                impacts[label] = round(float(impact), 2)

    return impacts

def parse_symptoms(symptoms: str, current_data: PatientData) -> dict:
    if not gemini_client:
        return {}
    
    prompt = f"""
    You are an AI clinical parser. 
    The patient provided symptoms: "{symptoms}".
    Current inputs: Age: {current_data.age}, Systolic BP: {current_data.ap_hi or current_data.trestbps}, Smoke: {current_data.smoke}, Active: {current_data.active}.
    
    Identify any overriding clinical parameters (e.g. mentions 'smokes a pack a day' -> smoke: 1, 'sedentary desk job' -> active: 0, 'blood pressure 145/95' -> ap_hi: 145, ap_lo: 95).
    Return ONLY a JSON object: {{"smoke": 1}} or {{}}.
    """
    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=float(GEMINI_TEMPERATURE),
                response_mime_type="application/json"
            )
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"Failed to parse symptoms using Gemini: {e}")
        return {}

def generate_offline_clinical_report(data: PatientData, probability: float, risk: str, role: str, record: dict) -> str:
    prob_str = f"{probability*100:.1f}%" if probability <= 1.0 else f"{probability:.1f}%"
    bp_hi, bp_lo = int(record.get('ap_hi', 120)), int(record.get('ap_lo', 80))
    bmi = record.get('bmi', 24.0)
    bp_stage = record.get('bp_stage', 0)
    stage_names = ["Normal Blood Pressure", "Elevated Blood Pressure", "Stage 1 Hypertension", "Stage 2 Hypertension"]
    bp_label = stage_names[bp_stage] if bp_stage < len(stage_names) else "Hypertension"
    
    bmi_label = "Normal weight" if bmi < 25 else "Overweight" if bmi < 30 else "Class 1 Obesity" if bmi < 35 else "Severe Obesity"
    chol_label = "Desirable (<200 mg/dL)" if record.get('cholesterol', 1) == 1 else "Borderline Elevated (200-239 mg/dL)" if record.get('cholesterol', 1) == 2 else "High (≥240 mg/dL)"
    gluc_label = "Normal (<100 mg/dL)" if record.get('gluc', 1) == 1 else "Elevated / Pre-diabetic (100-125 mg/dL)" if record.get('gluc', 1) == 2 else "Diabetic Range (≥126 mg/dL)"
    lifestyle_tags = []
    if record.get('smoke'): lifestyle_tags.append("Active Tobacco Smoker")
    if record.get('alco'): lifestyle_tags.append("Alcohol Consumer")
    if not record.get('active', 1): lifestyle_tags.append("Sedentary Routine")
    if not lifestyle_tags: lifestyle_tags.append("Regular Physical Exercise, Non-smoker")

    role_clean = (role or "patient").lower()
    if role_clean in ["clinician", "practitioner", "doctor"]:
        return f"""**Clinical Findings**:
- **Blood Pressure**: {bp_hi}/{bp_lo} mmHg ({bp_label}) [Stage {record.get('bp_stage', 0)}]
- **Body Mass Index**: {bmi} kg/m² ({bmi_label})
- **Serum Cholesterol Profile**: Tier {record.get('cholesterol', 1)}/3 ({chol_label})
- **Glycemic Status**: Tier {record.get('gluc', 1)}/3 ({gluc_label})
- **Lifestyle & Clinical Markers**: {", ".join(lifestyle_tags)}

**Differential Assessment**:
Patient exhibits a **{risk} Risk** cardiovascular profile with an estimated **{prob_str}** calibrated probability of significant cardiovascular pathology. Arterial hemodynamics ({bp_hi}/{bp_lo} mmHg, Pulse Pressure: {int(record.get('pulse_pressure', 40))} mmHg, MAP: {record.get('map', 95)} mmHg) combined with atherogenic lipid parameters represent the primary modifiable cardiovascular risk drivers. Evidence points to increased cardiac afterload and early microvascular endothelial strain.

**Recommended Clinical Pathways**:
- **Diagnostic Baseline**: Order 12-lead Electrocardiogram (ECG) and consider 24-hour ambulatory blood pressure monitoring (ABPM) to rule out nocturnal non-dipping.
- **Laboratory Workup**: Fasting comprehensive lipid subfractions (ApoB, LDL-P), hs-CRP, renal panel with eGFR, and HbA1c to assess concurrent metabolic risk.
- **Pharmacological Considerations**: Review indication for guideline-directed antihypertensive monotherapy/combination (ACEi/ARB or DHP-CCB) and moderate-to-high intensity statin therapy if indicated by cumulative 10-year ASCVD risk.
- **Follow-up Protocol**: Re-evaluate blood pressure in 4 weeks and recheck lipid profile at 12 weeks."""

    elif role_clean in ["trainee", "student", "researcher"]:
        return f"""**Clinical Findings**:
- **Blood Pressure**: {bp_hi}/{bp_lo} mmHg ({bp_label}) [ACC/AHA Stage {record.get('bp_stage', 0)}]
- **Body Mass Index**: {bmi} kg/m² ({bmi_label})
- **Serum Cholesterol Profile**: Tier {record.get('cholesterol', 1)}/3 ({chol_label})
- **Glycemic Status**: Tier {record.get('gluc', 1)}/3 ({gluc_label})
- **Lifestyle Indicators**: {", ".join(lifestyle_tags)}

**Differential Assessment**:
Patient presents with **{risk} Risk** ({prob_str} calibrated likelihood). From a pathophysiological perspective, chronic elevated systolic pressure increases left ventricular wall stress according to Laplace's Law (Wall Stress = P × r / 2h). The resulting high oscillatory wall shear stress damages endothelial glycocalyx and downregulates endothelial nitric oxide synthase (eNOS), creating a permissive environment for subendothelial LDL retention and accelerated atherogenesis.

**Educational & Learning Context**:
- **Mechanistic Driver Analysis**: Notice the strong synergistic risk weighting between systolic pressure ({bp_hi} mmHg) and lipid tier {record.get('cholesterol', 1)}. In our tree ensemble, the concurrent presence of hypertension and dyslipidemia multiplies cardiovascular risk non-linearly compared to either variable alone.
- **Hemodynamic Principle**: Pulse pressure ({int(record.get('pulse_pressure', 40))} mmHg) is a clinical surrogate for arterial stiffness and central aortic compliance loss, particularly prominent in patients over age {int(record.get('age_years', 50))}.
- **Pharmacology Learning Pearl**: First-line RAAS blockade (ACEi/ARB) reduces afterload and provides end-organ anti-remodeling protection, while HMG-CoA reductase inhibitors (statins) stabilize existing plaque membranes beyond LDL lowering."""

    else:
        # Patient / General User: ZERO jargon, warm, empowering, actionable
        return f"""**Key Findings**:
- **Heart Health Score**: Your cardiovascular checkup places your overall risk in the **{risk} Risk** category ({prob_str} likelihood).
- **Blood Pressure**: Your reading is **{bp_hi}/{bp_lo} mmHg** ({bp_label}).
- **Body Weight & BMI**: Your Body Mass Index is **{bmi} kg/m²** ({bmi_label}).
- **Cholesterol Level**: Rated as **{chol_label}**.
- **Blood Sugar**: Rated as **{gluc_label}**.
- **Daily Habits**: {", ".join(lifestyle_tags)}.

**What This Means**:
{"Your heart and blood vessels are currently under extra pressure. When blood pressure and cholesterol levels stay above optimal ranges, the blood vessels that supply blood to your heart work harder, which can gradually stiffen arteries over time." if risk in ["High", "Moderate"] else "Your heart numbers indicate healthy circulation with low signs of vascular strain. Keeping these numbers in balance helps preserve your long-term vitality and heart health."} The good news is that these indicators are highly responsive to healthy daily choices you can start making today.

**Lifestyle & Prevention**:
- **Target Everyday Blood Pressure**: Check your blood pressure periodically at home or at your local pharmacy. Aim to keep resting numbers below 120/80 mmHg.
- **Heart-Protective Nutrition**: Prioritize whole grains, dark leafy vegetables, berries, olive oil, and unsalted nuts. Cut down on sodium (salt) and processed foods.
- **Consistent Physical Movement**: Aim for at least 30 minutes of moderate aerobic activity (like brisk walking, swimming, or cycling) on most days of the week.
- **Tobacco & Rest**: If you smoke, stopping is the single fastest way to lower heart strain. Prioritize 7–8 hours of restful sleep each night.
- **Questions for Your Doctor**: Bring this report to your next primary care appointment to discuss your blood pressure trends and whether any routine lab tests are recommended."""

def generate_explanation(data: PatientData, probability: float, risk: str, role: str, record: dict) -> str:
    role_clean = (role or "patient").lower()
    if not gemini_client:
        return generate_offline_clinical_report(data, probability, risk, role_clean, record)

    if role_clean in ["clinician", "practitioner", "doctor"]:
        tone_instruction = """
        TARGET AUDIENCE: Board-certified Physician / Clinical Cardiologist.
        TONE: Concise, highly professional, evidence-based, clinical chart style.
        FOCUS: ACC/AHA staging, hemodynamics (systolic/diastolic/pulse pressure), pharmacological therapy considerations (first-line agents, statin tier), and clear diagnostic pathways (ECG, ambulatory monitoring, lab intervals).
        """
        structure_instruction = """
    **Clinical Findings**:
    - (bulleted objective findings with exact numbers, staging, and metrics)
    
    **Differential Assessment**:
    (concise clinical assessment, hemodynamic afterload, and cardiovascular risk drivers)
    
    **Recommended Clinical Pathways**:
    - (actionable diagnostic next steps, monitoring protocols, and pharmacological considerations)
        """
    elif role_clean in ["trainee", "student", "researcher"]:
        tone_instruction = """
        TARGET AUDIENCE: Healthcare Trainee, Medical Student, or Resident.
        TONE: Supervised medical teaching tone, academic, explanatory, and pedagogical.
        FOCUS: Deeply explain pathophysiological mechanisms (Laplace law of wall tension, endothelial shear stress, eNOS downregulation, lipid oxidation), why multi-variable tree features compounded the risk score, and provide clinical learning pearls.
        """
        structure_instruction = """
    **Clinical Findings**:
    - (bulleted objective findings with stage classifications)
    
    **Differential Assessment**:
    (clinical assessment detailing underlying pathophysiological and hemodynamic mechanisms)
    
    **Educational & Learning Context**:
    - (mechanistic driver analysis, feature interaction weighting rationale, and pharmacology teaching points)
        """
    else:
        # Patient / General User
        tone_instruction = """
        TARGET AUDIENCE: The patient / general individual reading their personal health summary.
        TONE: Warm, empathetic, reassuring, and completely easy to understand.
        CRITICAL RULE: DO NOT use complex medical jargon (e.g. avoid 'atherogenesis', 'hemodynamics', 'pharmacopeia', 'nitric oxide bioavailability', 'subendothelial infiltration'). Translate every vital into clear language.
        FOCUS: Explain clearly what their blood pressure and cholesterol numbers mean, explain their risk tier reassuringly, and provide actionable lifestyle recommendations (DASH diet, daily exercise, lower sodium) and talking points for their doctor.
        """
        structure_instruction = """
    **Key Findings**:
    - (plain-language bullet points of their vitals and what they mean)
    
    **What This Means**:
    (supportive explanation of heart and vessel health in everyday terms)
    
    **Lifestyle & Prevention**:
    - (practical, encouraging daily steps for nutrition, physical activity, rest, and questions for their doctor)
        """

    prompt = f"""
    You are ZEZE (Zero Error Zonal Evaluation Model), an intelligent clinical cardiovascular risk assessment assistant.
    A patient's profile has been evaluated by our calibrated Machine Learning model (trained on 70,000 patient records).
    
    Model Result:
    - Stratified Risk Tier: {risk} Risk
    - Calibrated Probability: {probability*100:.1f}%
    - Assigned Persona: {role_clean.upper()}
    
    Patient Clinical Vitals:
    - Age: {record['age_years']} years
    - Biological Sex: {'Male' if record['gender'] == 1 else 'Female'}
    - Blood Pressure: {int(record['ap_hi'])}/{int(record['ap_lo'])} mmHg (Stage: {record['bp_stage']})
    - Body Mass Index (BMI): {record['bmi']} kg/m²
    - Cholesterol Level: Tier {record['cholesterol']}/3
    - Fasting Glucose: Tier {record['gluc']}/3
    - Smoking: {'Yes' if record['smoke'] else 'No'} | Alcohol: {'Yes' if record['alco'] else 'No'} | Exercise: {'Regular' if record['active'] else 'Inactive'}
    {f"- Reported Symptoms: {data.symptoms}" if data.symptoms else ""}

    {tone_instruction}

    CRITICAL REQUIREMENT: Format your response STRICTLY with these markdown headers:
    {structure_instruction}
    """
    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=float(GEMINI_TEMPERATURE))
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API failure: {e}")
        return f"Patient assessed at {risk.upper()} risk ({probability*100:.1f}%). (AI summary generation temporarily unavailable)."

@app.post("/predict")
def predict_risk(data: PatientData):
    logger.info(f"Received prediction request for age: {data.age}, sex: {data.sex}")
    try:
        if data.symptoms:
            overrides = parse_symptoms(data.symptoms, data)
            if overrides:
                for key, value in overrides.items():
                    if hasattr(data, key):
                        setattr(data, key, value)

        # Primary: Predict using 70k Calibrated Gradient Boosting Model
        if cardio_model and cardio_meta:
            df_features, record = compute_cardio_features(data)
            prob = float(cardio_model.predict_proba(df_features)[0, 1])
            
            # 3-Tier Clinical Stratification
            if prob < 0.25:
                risk = "Low"
            elif prob < 0.60:
                risk = "Moderate"
            else:
                risk = "High"

            feature_impacts = compute_feature_impacts(record, cardio_meta)
        else:
            # Fallback to legacy weights
            features = [
                data.age, data.sex, data.cp or 0, data.ap_hi or data.trestbps or 120,
                data.chol or 200, data.fbs or 0, data.restecg or 0, data.thalach or 150,
                data.exang or 0, data.oldpeak or 0.0, data.slope or 0, data.ca or 0, data.thal or 0
            ]
            scaled = (np.array(features) - np.array(legacy_weights["scaler_mean"])) / np.array(legacy_weights["scaler_scale"])
            logit = np.sum(scaled * np.array(legacy_weights["weights"])) + legacy_weights["intercept"]
            prob = float(1.0 / (1.0 + np.exp(-logit)))
            risk = "High" if prob > 0.7 else "Low"
            feature_impacts = {}
            record = {"age_years": data.age, "gender": data.sex, "ap_hi": 120, "ap_lo": 80, "bmi": 24.0, "cholesterol": 1, "gluc": 1, "smoke": 0, "alco": 0, "active": 1, "bp_stage": 0}

        explanation = generate_explanation(data, prob, risk, data.role, record)

        return {
            "risk": risk,
            "probability": round(prob * 100, 1),
            "explanation": explanation,
            "feature_impacts": feature_impacts,
            "vitals": {
                "bmi": record.get("bmi"),
                "bp": f"{int(record.get('ap_hi', 120))}/{int(record.get('ap_lo', 80))}",
                "bp_stage": record.get("bp_stage"),
                "cholesterol": record.get("cholesterol"),
                "lifestyle_risk": record.get("lifestyle_risk")
            }
        }
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during risk prediction.")

class ChatMessage(BaseModel):
    role: str
    parts: str

class ChatRequest(BaseModel):
    history: list[ChatMessage]
    message: str
    context: str

def generate_offline_chat_response(query: str, context: str) -> str:
    q = query.lower()
    
    # 1. Medications & Prescriptions
    if any(k in q for k in ["med", "drug", "pill", "prescription", "work", "treatment", "medicine"]):
        return (
            "**Evidence-Based Guideline Medications (ACC/AHA & FDA Formularies)**:\n\n"
            "• **For Blood Pressure Reduction**:\n"
            "  - **Amlodipine** (Calcium Channel Blocker): 5–10 mg **Once Daily (OD)** — First-line arterial vasodilator.\n"
            "  - **Lisinopril** (ACE Inhibitor): 10–20 mg **Once Daily (OD)** — Cardioprotective renal/arterial agent.\n"
            "  - **Losartan** (ARB): 50–100 mg **Once Daily (OD)** — Preferred if ACE inhibitors cause cough.\n\n"
            "• **For Elevated Cholesterol / ASCVD Prevention**:\n"
            "  - **Atorvastatin**: 20–40 mg **Once Daily (OD)** at bedtime — High-intensity LDL lowering.\n"
            "  - **Rosuvastatin**: 10–20 mg **Once Daily (OD)** — Potent hydrophilic statin.\n\n"
            "• **For Metabolic / Glycemic Control**:\n"
            "  - **Empagliflozin** (SGLT2i): 10 mg **Once Daily (OD)** in morning — Proven cardiovascular & renal protection.\n"
            "  - **Metformin**: 500–1000 mg **Twice Daily (BD)** with meals.\n\n"
            "*Important: Prescription selection and titration must be confirmed by your licensed healthcare provider.*"
        )
    
    # 2. Blood Pressure
    if any(k in q for k in ["bp", "blood pressure", "hypertension", "systolic", "diastolic", "pressure"]):
        return (
            "**Blood Pressure Clinical Guidance**:\n\n"
            "• **Target Blood Pressure**: Clinical guidelines recommend aiming for a resting level **below 120/80 mmHg**.\n"
            "• **DASH Dietary Pattern**: Restrict sodium to **<2,000 mg/day**; emphasize potassium-rich foods (leafy greens, bananas, legumes).\n"
            "• **Home Monitoring**: Record seated BP twice daily (morning and evening before meals) resting quietly for 5 minutes.\n"
            "• **First-Line Formularies**: Amlodipine (5–10 mg once daily) or ACE inhibitors / ARBs are guideline first-line therapies."
        )

    # 3. Cholesterol & Lipids
    if any(k in q for k in ["cholesterol", "statin", "lipid", "triglyceride", "ldl", "hdl"]):
        return (
            "**Lipid Management & Statin Guidance**:\n\n"
            "• **Guideline Target**: In elevated cardiovascular risk, guidelines target **≥50% LDL-C reduction** or LDL <70 mg/dL.\n"
            "• **First-Line Therapy**: High-intensity statins like **Atorvastatin (20–40 mg once daily at bedtime)** or **Rosuvastatin (10–20 mg once daily)**.\n"
            "• **Dietary Measures**: Eliminate trans-fats, reduce saturated fats to <7% of daily calories, and increase soluble fiber."
        )

    # 4. Lifestyle, diet, exercise
    if any(k in q for k in ["diet", "food", "eat", "exercise", "walk", "lifestyle", "habit", "sport"]):
        return (
            "**Cardiovascular Lifestyle & Prevention Protocol**:\n\n"
            "• **Aerobic Activity**: Minimum **150 minutes of moderate-intensity aerobic exercise** (e.g. brisk walking, cycling, swimming) each week.\n"
            "• **Cardioprotective Nutrition**: Mediterranean or DASH diet with extra-virgin olive oil, nuts, whole grains, and lean proteins.\n"
            "• **Tobacco Abstinence**: If smoking, cessation within weeks yields dramatic microvascular recovery."
        )

    # 5. Risk explanation
    if any(k in q for k in ["risk", "percentage", "score", "high", "moderate", "low", "mean", "calculated"]):
        return (
            "**Understanding Your Risk Score**:\n\n"
            "• Your risk percentage is calculated from our **70,000-cohort calibrated Gradient Boosted Decision Tree model**.\n"
            "• The model evaluates complex non-linear interactions among systolic blood pressure, cholesterol tier, age, and lifestyle habits.\n"
            "• Modifiable factors—especially blood pressure and cholesterol—represent high-leverage opportunities: optimizing them can reduce estimated cardiovascular risk significantly."
        )

    # Generic Clinical Response
    return (
        "**Clinical Decision Support Response**:\n\n"
        "Your cardiovascular risk profile reflects a multi-variable assessment of hemodynamics, lipid biomarkers, and lifestyle factors. "
        "Key priorities for risk reduction include maintaining resting blood pressure below 120/80 mmHg, following an evidence-based low-sodium/Mediterranean diet, and engaging in ≥150 minutes of weekly aerobic exercise. "
        "Please discuss personalized medication options and diagnostic follow-up with your healthcare provider."
    )

@app.post("/chat")
def chat_follow_up(req: ChatRequest):
    if not gemini_client:
        return {"response": generate_offline_chat_response(req.message, req.context)}
        
    try:
        system_instruction = (
            "You are the ZEZE AI Clinical Assistant. The user has just completed a cardiovascular health assessment.\n"
            f"Here is their exact clinical context: {req.context}\n\n"
            "Act as an intelligent, conversational agent and assistant. Answer their follow-up questions clearly and supportively.\n"
            "CRITICAL RULES:\n"
            "1. Be concise. Give exactly the required amount of information—no more, no less.\n"
            "2. Be helpful. Provide clear health, medication, diet, exercise, and clinical guidance citing ACC/AHA and FDA standards.\n"
            "3. Keep responses conversational, balanced, and easy to read."
        )
        
        formatted_history = []
        for msg in req.history:
            r = "user" if msg.role == "user" else "model"
            formatted_history.append(types.Content(role=r, parts=[types.Part.from_text(text=msg.parts)]))
            
        chat = gemini_client.chats.create(
            model=GEMINI_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=float(GEMINI_TEMPERATURE)
            ),
            history=formatted_history
        )
        response = chat.send_message(req.message)
        return {"response": response.text}
    except Exception as e:
        logger.warning(f"Gemini API chat fallback triggered: {str(e)}")
        return {"response": generate_offline_chat_response(req.message, req.context)}

from ml.ocr_extractor import process_document_pipeline

class DocumentExtractionSchema(BaseModel):
    age: Optional[float] = Field(None, description="Age in years")
    sex: Optional[float] = Field(None, description="1 for Male, 0 for Female")
    height: Optional[float] = Field(None, description="Height in cm")
    weight: Optional[float] = Field(None, description="Weight in kg")
    ap_hi: Optional[float] = Field(None, description="Systolic blood pressure in mmHg (e.g. 120)")
    ap_lo: Optional[float] = Field(None, description="Diastolic blood pressure in mmHg (e.g. 80)")
    cholesterol: Optional[int] = Field(None, description="1: Normal, 2: Above Normal, 3: High")
    gluc: Optional[int] = Field(None, description="1: Normal, 2: Above Normal, 3: High")
    smoke: Optional[int] = Field(None, description="1 if smoker, 0 if non-smoker")
    alco: Optional[int] = Field(None, description="1 if consumes alcohol, 0 if not")
    active: Optional[int] = Field(None, description="1 if physically active, 0 if sedentary")
    symptoms: Optional[str] = Field(None, description="Any reported medical symptoms or notes")

@app.post("/extract-vitals")
async def extract_vitals(
    files: List[UploadFile] = File(...),
    symptoms: Optional[str] = Form(None)
):
    """
    Dedicated Multi-Engine OCR & Clinical Extractor:
    1. Runs PyPDF (vector text) or RapidOCR (scanned images/photos)
    2. Runs medical regex extractor for BP, Cholesterol, Glucose, BMI, Demographics
    3. Reconciles with Gemini VLM if available to capture unstructured context
    4. Returns structured vitals, provenance text snippets, and confidence ratings for user review.
    """
    try:
        files_data = []
        parts_for_gemini = []

        for file in files:
            contents = await file.read()
            mime_type = file.content_type if file.content_type else "application/octet-stream"
            if mime_type == "application/octet-stream" or not mime_type:
                if file.filename:
                    ext = file.filename.split('.')[-1].lower()
                    if ext == 'pdf': mime_type = "application/pdf"
                    elif ext in ['jpg', 'jpeg']: mime_type = "image/jpeg"
                    elif ext == 'png': mime_type = "image/png"
                    elif ext == 'txt': mime_type = "text/plain"

            files_data.append((file.filename or "uploaded_file", contents, mime_type))
            parts_for_gemini.append(types.Part.from_bytes(data=contents, mime_type=mime_type))

        # 1. Run local multi-engine OCR & Clinical Regex
        pipeline_res = process_document_pipeline(files_data, user_symptoms=symptoms)
        vitals = pipeline_res.get("vitals", {})
        snippets = pipeline_res.get("snippets", {})
        confidence = pipeline_res.get("confidence", {})
        raw_ocr_text = pipeline_res.get("raw_text", "")

        # 2. If Gemini is available, run semantic enrichment to catch anything missed
        if gemini_client and (len(vitals) < 4 or "ap_hi" not in vitals or "cholesterol" not in vitals):
            try:
                gemini_prompt = f"""
                You are an expert clinical data extraction assistant.
                We have already performed Optical Character Recognition (OCR) on the attached document with this extracted text:
                ---
                {raw_ocr_text[:4000]}
                ---
                User reported symptoms: "{symptoms or ''}"

                Carefully inspect the OCR text and original document. Extract any of the following clinical vitals that were detected:
                - age (years)
                - sex (1 for male, 0 for female)
                - height (cm)
                - weight (kg)
                - ap_hi (systolic BP in mmHg, e.g. 130)
                - ap_lo (diastolic BP in mmHg, e.g. 85)
                - cholesterol (1 for Normal <200, 2 for Borderline 200-239, 3 for High >=240)
                - gluc (1 for Normal <100, 2 for Borderline 100-125, 3 for High >=126)
                - smoke (1 for Yes, 0 for No)
                - alco (1 for Yes, 0 for No)
                - active (1 for Yes, 0 for No)
                - symptoms (summary of any noted symptoms, complaints, or diagnoses)

                Return ONLY a JSON object adhering to this schema. If a value cannot be found, omit it or set to null.
                """
                gemini_parts = list(parts_for_gemini)
                gemini_parts.append(gemini_prompt)

                response = gemini_client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=gemini_parts,
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        response_mime_type="application/json",
                        response_schema=DocumentExtractionSchema
                    )
                )
                ai_extracted = json.loads(response.text.strip())
                for k, v in ai_extracted.items():
                    if v is not None and k not in vitals:
                        vitals[k] = v
                        confidence[k] = "ai_inferred"
                        snippets[k] = f"Extracted via AI visual parsing"
            except Exception as ge:
                logger.warning(f"Gemini enrichment skipped or failed: {ge}")

        # Ensure all numerical vitals are strictly rounded up to integer values
        for vk in ["age", "height", "weight", "ap_hi", "ap_lo", "cholesterol", "gluc", "smoke", "alco", "active"]:
            if vk in vitals and vitals[vk] is not None:
                try:
                    vitals[vk] = int(math.ceil(float(vitals[vk])))
                except (ValueError, TypeError):
                    pass

        return {
            "success": True,
            "vitals": vitals,
            "snippets": snippets,
            "confidence": confidence,
            "raw_text": raw_ocr_text[:1500]
        }

    except Exception as e:
        logger.error(f"OCR extraction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")

@app.post("/predict-document")
async def predict_document(
    files: List[UploadFile] = File(...), 
    symptoms: Optional[str] = Form(None), 
    role: Optional[str] = Form("patient")
):
    """Direct hybrid document pipeline: runs OCR extraction -> ML model risk calculation -> tailored explanation."""
    # First extract via our OCR pipeline
    extraction_res = await extract_vitals(files=files, symptoms=symptoms)
    extracted = extraction_res.get("vitals", {})

    patient_obj = PatientData(
        role=role,
        age=extracted.get("age") or 50.0,
        sex=extracted.get("sex") if extracted.get("sex") is not None else 1.0,
        height=extracted.get("height"),
        weight=extracted.get("weight"),
        ap_hi=extracted.get("ap_hi"),
        ap_lo=extracted.get("ap_lo"),
        cholesterol=extracted.get("cholesterol"),
        gluc=extracted.get("gluc"),
        smoke=extracted.get("smoke") or 0,
        alco=extracted.get("alco") or 0,
        active=extracted.get("active") if extracted.get("active") is not None else 1,
        symptoms=extracted.get("symptoms") or symptoms
    )

    result = predict_risk(patient_obj)
    result["extracted_parameters"] = extracted
    result["ocr_snippets"] = extraction_res.get("snippets", {})
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)
