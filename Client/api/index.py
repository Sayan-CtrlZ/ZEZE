import os
import joblib
import numpy as np
import pandas as pd
import logging
import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="ZEZE Cardiovascular Risk Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("zeze-backend")

# Configure environment and Gemini
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
else:
    logger.warning("GEMINI_API_KEY not found. Explanations will fallback to simple rule-based strings.")
    gemini_model = None

# Load Models
# Using relative paths since Render will start from the backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "logistic_regression_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "ml", "scaler.pkl")

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    logger.info("Successfully loaded ML models and scaler.")
except Exception as e:
    logger.error(f"Failed to load ML artifacts: {e}")
    raise e

class PatientData(BaseModel):
    age: float = Field(..., ge=1, le=120, description="Patient age in years")
    sex: float = Field(..., ge=0, le=1, description="1 = male; 0 = female; 0.5 = other")
    cp: int = Field(..., ge=0, le=3, description="Chest pain type (0-3)")
    trestbps: float = Field(..., ge=50, le=250, description="Resting blood pressure in mm Hg")
    chol: float = Field(..., ge=100, le=600, description="Serum cholesterol in mg/dl")
    fbs: int = Field(..., ge=0, le=1, description="Fasting blood sugar > 120 mg/dl (1 = true; 0 = false)")
    restecg: int = Field(..., ge=0, le=2, description="Resting electrocardiographic results (0-2)")
    thalach: float = Field(..., ge=50, le=250, description="Maximum heart rate achieved")
    exang: int = Field(..., ge=0, le=1, description="Exercise induced angina (1 = yes; 0 = no)")
    oldpeak: float = Field(..., ge=0.0, le=10.0, description="ST depression induced by exercise relative to rest")
    slope: int = Field(..., ge=0, le=2, description="The slope of the peak exercise ST segment (0-2)")
    ca: int = Field(..., ge=0, le=4, description="Number of major vessels (0-3) colored by fluoroscopy")
    thal: int = Field(..., ge=0, le=3, description="Thalassemia (0-3)")
    symptoms: Optional[str] = Field(None, description="Optional natural language description of symptoms")

def parse_symptoms(symptoms: str, current_data: PatientData) -> dict:
    if not gemini_model:
        return {}
    
    prompt = f"""
    You are an AI clinical parser. 
    The user has selected these structured inputs: Age: {current_data.age}, Sex: {current_data.sex}, Chest Pain (0-3): {current_data.cp}, Blood Pressure: {current_data.trestbps}, Cholesterol: {current_data.chol}, Exercise Angina (0 or 1): {current_data.exang}, etc.
    
    The user also provided this text description of their symptoms:
    "{symptoms}"
    
    Extract any overriding clinical variables strictly conforming to our data types. For example, if they describe "chest pain while walking", they likely have exercise-induced angina (exang = 1) or a specific chest pain type (cp).
    Possible keys to override: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal.
    
    Return ONLY a valid JSON object. Do not include markdown ticks. Example:
    {{"exang": 1, "cp": 2}}
    
    If nothing needs overriding, return {{}}.
    """
    try:
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        overrides = json.loads(text)
        return overrides
    except Exception as e:
        logger.error(f"Failed to parse symptoms using Gemini: {e}", exc_info=True)
        return {}

def generate_explanation(data: PatientData, probability: float, risk: str) -> str:
    # If Gemini is not configured, silently fallback to rule-based.
    if not gemini_model:
        return f"Patient has a {risk.lower()} risk profile. (Gemini AI not configured, fallback used)."

    prompt = f"""
    You are ZEZE (Zero Error Zonal Evaluation Model), an AI clinical risk assessment assistant. 
    A patient's data has been evaluated mathematically.
    Their predicted cardiovascular risk is {risk} (Probability: {probability*100:.1f}%).
    
    Patient Inputs:
    - Age: {data.age}
    - Sex (1=Male, 0=Female): {data.sex}
    - Chest Pain Type (0-3): {data.cp}
    - Resting Blood Pressure: {data.trestbps} mm Hg
    - Cholesterol: {data.chol} mg/dl
    - Fasting Blood Sugar > 120 (1=True, 0=False): {data.fbs}
    - Resting ECG (0-2): {data.restecg}
    - Maximum Heart Rate (thalach): {data.thalach}
    - Exercise Angina (1=Yes, 0=No): {data.exang}
    - ST Depression (oldpeak): {data.oldpeak}
    - Slope (0-2): {data.slope}
    - Number of major vessels (0-3): {data.ca}
    - Thalassemia (0-3): {data.thal}
    
    Provide a concise patient-friendly explanation interpreting these top factors without diagnosing. 
    Focus strictly on why the risk is {risk}. Be reassuring but clear. Use a professional, clinical but clear tone.

    CRITICAL REQUIREMENT: Format your entire response as a list of 3-4 bullet points using markdown `- `. Do not write introductory or concluding paragraphs. ONLY return bullet points.
    """
    
    try:
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API failure: {e}", exc_info=True)
        return f"Patient has a {risk.lower()} risk profile. (AI explanation generation temporarily unavailable)."

@app.post("/api/predict")
def predict_risk(data: PatientData):
    logger.info(f"Received prediction request for age: {data.age}, sex: {data.sex}")
    try:
        if data.symptoms:
            logger.info("Symptom text detected. Parsing overrides...")
            overrides = parse_symptoms(data.symptoms, data)
            if overrides:
                logger.info(f"Applying NLP overrides: {overrides}")
                for key, value in overrides.items():
                    if hasattr(data, key):
                        setattr(data, key, value)
                        
        # Convert input to array matching model's expected features
        features = [
            data.age, data.sex, data.cp, data.trestbps, data.chol,
            data.fbs, data.restecg, data.thalach, data.exang, 
            data.oldpeak, data.slope, data.ca, data.thal
        ]
        
        feature_array = np.array([features])
        
        # We use DataFrame to be safe against warning if scaler was fit on df.
        feature_columns = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"]
        df = pd.DataFrame(feature_array, columns=feature_columns)
        
        scaled_features = scaler.transform(df)
        
        # predict_proba returns [[P(class_0), P(class_1)]]
        prob = float(model.predict_proba(scaled_features)[0][1])
        
        risk = "High" if prob > 0.7 else "Low"
        
        explanation = generate_explanation(data, prob, risk)
        
        logger.info(f"Successfully generated prediction: Risk={risk}, Probability={prob:.2f}")
        
        return {
            "risk": risk,
            "probability": round(prob * 100, 2), # percentage
            "explanation": explanation
        }
    except Exception as e:
        logger.error(f"Prediction failed due to error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during risk prediction.")

class ChatMessage(BaseModel):
    role: str
    parts: str

class ChatRequest(BaseModel):
    history: list[ChatMessage]
    message: str
    context: str

@app.post("/api/chat")
def chat_follow_up(req: ChatRequest):
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI Chat is not configured.")
        
    try:
        # We append the context to the system instruction so the AI knows exactly what to talk about!
        system_instruction = (
            "You are the ZEZE AI Clinical Assistant. The user has just completed a cardiovascular health assessment.\n"
            f"Here is their exact clinical context: {req.context}\n\n"
            "Answer their follow-up questions clearly, supportively, and professionally based on this specific assessment. "
            "You may provide general health and lifestyle guidance, but explicitly state you are an AI and not a substitute for a real doctor if they ask for a deep diagnosis."
        )
        
        model_with_context = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction=system_instruction
        )
        
        formatted_history = []
        for msg in req.history:
            r = "user" if msg.role == "user" else "model"
            formatted_history.append({"role": r, "parts": [msg.parts]})
            
        chat = model_with_context.start_chat(history=formatted_history)
        response = chat.send_message(req.message)
        
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Chat endpoint failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during chat sequence.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)
