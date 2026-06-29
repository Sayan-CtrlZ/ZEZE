import os
import joblib
import numpy as np
import pandas as pd
import logging
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
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

@app.get("/")
def health_check():
    return {"status": "ok", "message": "ZEZE Backend is running"}

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("zeze-backend")

# Configure environment and Gemini
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Try to load from backend/.env first, then fallback to Client/.env
load_dotenv()
client_env_path = os.path.join(os.path.dirname(__file__), '..', 'Client', '.env')
if os.path.exists(client_env_path):
    load_dotenv(client_env_path)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")
GEMINI_TEMPERATURE = os.getenv("GEMINI_TEMPERATURE")

if GEMINI_API_KEY and GEMINI_MODEL and GEMINI_TEMPERATURE:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    logger.warning("One or more Gemini environment variables (GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TEMPERATURE) are missing. Explanations and AI features will be disabled.")
    gemini_client = None

# Load Models
# Using relative paths since Render will start from the backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "ml", "model_weights.json")

try:
    with open(WEIGHTS_PATH, "r") as f:
        ml_weights = json.load(f)
    logger.info("Successfully loaded ML weights from JSON.")
except Exception as e:
    logger.error(f"Failed to load ML weights: {e}")
    raise e

def predict_risk_from_weights(features: list, weights: dict) -> float:
    scaled = (np.array(features) - np.array(weights["scaler_mean"])) / np.array(weights["scaler_scale"])
    logit = np.sum(scaled * np.array(weights["weights"])) + weights["intercept"]
    prob = 1.0 / (1.0 + np.exp(-logit))
    return float(prob)

class PatientData(BaseModel):
    role: str = Field("patient", description="User role: patient, practitioner, or researcher")
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
    if not gemini_client:
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
            
        overrides = json.loads(text)
        return overrides
    except Exception as e:
        logger.error(f"Failed to parse symptoms using Gemini: {e}", exc_info=True)
        return {}

def generate_explanation(data: PatientData, probability: float, risk: str, role: str) -> str:
    # If Gemini is not configured, silently fallback to rule-based.
    if not gemini_client:
        return f"Patient has a {risk.lower()} risk profile. (Gemini AI not configured, fallback used)."

    if role == "practitioner":
        tone_instruction = "Use clinical terminology, provide a concise differential assessment, and focus on data-driven metrics. Be concise, like a doctor's medical chart."
        structure_instruction = """
    **Clinical Findings**:
    - (bulleted objective data)
    
    **Differential Assessment**:
    (concise clinical interpretation)
    
    **Recommended Clinical Pathways**:
    - (short actionable medical steps)
        """
    elif role == "researcher":
        tone_instruction = "Use statistical language, focus on the weight of anomalous features, and provide deep analytical interpretations. Provide proper notes for each issue, proper research context, and referenced drugs (e.g., 'Drug X can be used for Y')."
        structure_instruction = """
    **Anomalous Data Points**:
    - (detailed notes for each issue)
    
    **Mechanistic Analysis**:
    (detailed research-driven physiological explanation)
    
    **Literature / Pharmacological References**:
    - (list potential referenced drugs, e.g., 'Note: [Drug Name] can be used for [Condition] - Use: [Mechanism]')
        """
    else:
        tone_instruction = "Be reassuring but clear. Use a patient-friendly tone and avoid complex medical jargon. Provide a HIGHLY DETAILED, comprehensive explanation."
        structure_instruction = """
    **Key Findings**:
    - (short + scannable bullet points)
    
    **What This Means**:
    (highly detailed, comprehensive physiological explanation)
    
    **Possible Concerns**:
    (if abnormal, otherwise omit)
    
    **Lifestyle / Prevention**:
    - (short action items)
    
    **Additional Information**:
    (any longer explanations last)
        """

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
    
    Provide an explanation interpreting these top factors without diagnosing. 
    {tone_instruction}

    CRITICAL REQUIREMENT: Format your response STRICTLY using the following markdown structure. Do not include any introductory or concluding text outside of this structure. Ensure important concepts are bolded.
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
        logger.error(f"Gemini API failure: {e}", exc_info=True)
        return f"Patient has a {risk.lower()} risk profile. (AI explanation generation temporarily unavailable)."

@app.post("/predict")
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
        
        prob = predict_risk_from_weights(features, ml_weights)
        
        risk = "High" if prob > 0.7 else "Low"
        
        explanation = generate_explanation(data, prob, risk, data.role)
        
        # Calculate feature impacts for explainability (SHAP-like values using LR coefficients)
        feature_impacts = {}
        if data.role in ["practitioner", "researcher"]:
            feature_names = ["Age", "Sex", "Chest Pain", "Resting BP", "Cholesterol", "Fasting Blood Sugar", "Resting ECG", "Max HR", "Exercise Angina", "ST Depression", "Slope", "Vessels", "Thalassemia"]
            scaled_features = (np.array(features) - np.array(ml_weights["scaler_mean"])) / np.array(ml_weights["scaler_scale"])
            impacts = scaled_features * np.array(ml_weights["weights"])
            for name, impact in zip(feature_names, impacts):
                feature_impacts[name] = float(impact)
        
        logger.info(f"Successfully generated prediction: Risk={risk}, Probability={prob:.2f}, Role={data.role}")
        
        return {
            "risk": risk,
            "probability": round(prob * 100, 2), # percentage
            "explanation": explanation,
            "feature_impacts": feature_impacts
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

@app.post("/chat")
def chat_follow_up(req: ChatRequest):
    if not gemini_client:
        raise HTTPException(status_code=503, detail="AI Chat is not configured.")
        
    try:
        # We append the context to the system instruction so the AI knows exactly what to talk about!
        system_instruction = (
            "You are the ZEZE AI Clinical Assistant. The user has just completed a cardiovascular health assessment.\n"
            f"Here is their exact clinical context: {req.context}\n\n"
            "Act as an intelligent, conversational agent and assistant. Answer their follow-up questions clearly and supportively.\n"
            "CRITICAL RULES:\n"
            "1. Be concise. Do not give long, verbose answers unless explicitly asked. Give exactly the required amount of information—no more, no less.\n"
            "2. Be helpful. Do not refuse to answer relevant health, lifestyle, or clinical questions. You are fully allowed to provide general medical information and guidance.\n"
            "3. Keep responses conversational, balanced, and easy to read.\n"
            "4. Only add medical disclaimers if the user is asking for a deep, complex diagnosis or immediate emergency advice."
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
        logger.error(f"Chat endpoint failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during chat sequence.")

class AIPredictionResponse(BaseModel):
    risk: str = Field(description="Must be exactly 'High' or 'Low'")
    probability: float = Field(description="A percentage number between 0 and 100")
    explanation: str = Field(description="A structured patient-friendly explanation. Format STRICTLY with markdown headers.")

@app.post("/predict-document")
async def predict_document(files: List[UploadFile] = File(...), symptoms: Optional[str] = Form(None), role: Optional[str] = Form("patient")):
    if not gemini_client:
        raise HTTPException(status_code=503, detail="AI parsing is not configured.")
    
    SUPPORTED_MIME_TYPES = {
        "application/pdf", "image/png", "image/jpeg", 
        "image/jpg", "image/webp", "image/heic", 
        "image/heif", "text/plain"
    }

    parts = []
    for file in files:
        contents = await file.read()
        mime_type = file.content_type if file.content_type else "application/octet-stream"
        
        # Fallback mapping based on file extension
        if mime_type == "application/octet-stream" or not mime_type:
            if file.filename:
                ext = file.filename.split('.')[-1].lower()
                if ext == 'pdf': mime_type = "application/pdf"
                elif ext in ['jpg', 'jpeg']: mime_type = "image/jpeg"
                elif ext == 'png': mime_type = "image/png"
                elif ext == 'txt': mime_type = "text/plain"
        
        # Validate MIME type
        if mime_type not in SUPPORTED_MIME_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime_type}. Please upload an image (PNG/JPG) or PDF.")
            
        parts.append(types.Part.from_bytes(data=contents, mime_type=mime_type))
    
    symptoms_text = f"\nPatient reported symptoms: {symptoms}" if symptoms else ""

    if role == "practitioner":
        tone_instruction = "Use clinical terminology, provide a concise differential assessment, and focus on data-driven metrics. Be concise, like a doctor's medical chart."
        structure_instruction = "**Clinical Findings**:\\n- (bulleted objective data)\\n\\n**Differential Assessment**:\\n(concise clinical interpretation)\\n\\n**Recommended Clinical Pathways**:\\n- (short actionable medical steps)"
    elif role == "researcher":
        tone_instruction = "Use statistical language, focus on the weight of anomalous features, and provide deep analytical interpretations. Provide proper notes for each issue, proper research context, and referenced drugs (e.g., 'Drug X can be used for Y')."
        structure_instruction = "**Anomalous Data Points**:\\n- (detailed notes for each issue)\\n\\n**Mechanistic Analysis**:\\n(detailed research-driven physiological explanation)\\n\\n**Literature / Pharmacological References**:\\n- (list potential referenced drugs, e.g., 'Note: [Drug Name] can be used for [Condition] - Use: [Mechanism]')"
    else:
        tone_instruction = "Be reassuring but clear. Use a patient-friendly tone and avoid complex medical jargon. Provide a HIGHLY DETAILED, comprehensive explanation."
        structure_instruction = "**Key Findings**:\\n- (short bullet points)\\n\\n**What This Means**:\\n(highly detailed, comprehensive physiological explanation)\\n\\n**Possible Concerns**:\\n(if abnormal)\\n\\n**Lifestyle / Prevention**:\\n- (short action items)\\n\\n**Additional Information**:\\n(longer explanations last)"

    prompt = f"""
    You are ZEZE (Zero Error Zonal Evaluation Model), an advanced AI clinical risk assessment assistant.
    The user has uploaded one or more medical documents (which could be formal reports, handwritten notes, or casual summaries) for a single patient.{symptoms_text}
    
    Your job is to act exactly like our machine learning model. You must carefully analyze the documents and any provided symptoms to evaluate the patient's cardiovascular risk.
    {tone_instruction}
    
    CRITICAL INSTRUCTION:
    Provide the exact same output format as the machine learning model.
    Return ONLY a valid JSON object mapping these exact keys:
    - "risk": string (Must be exactly "High" or "Low")
    - "probability": float (A percentage number between 0 and 100, e.g., 75.5 or 12.0)
    - "explanation": string (Format STRICTLY with these markdown headers and no extra text outside them: {structure_instruction}. Ensure important concepts are bolded.)

    Do not include markdown ticks or any extra text outside the JSON. Example:
    {{"risk": "High", "probability": 82.5, "explanation": "{structure_instruction}"}}
    """
    
    try:
        parts.append(prompt)
        
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=float(GEMINI_TEMPERATURE),
                response_mime_type="application/json",
                response_schema=AIPredictionResponse
            )
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        prediction_data = json.loads(text)
        
        # Validate output structure
        if "risk" not in prediction_data or "probability" not in prediction_data or "explanation" not in prediction_data:
            raise ValueError("Gemini returned invalid structure.")
            
        logger.info(f"Successfully predicted risk from document: {prediction_data['risk']}")
        return prediction_data
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini JSON: {text}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to parse AI prediction. Please try again.")
    except Exception as e:
        logger.error(f"Failed to predict document using Gemini: {e}", exc_info=True)
        if "429" in str(e) or "Quota exceeded" in str(e):
            raise HTTPException(status_code=429, detail="AI usage limit reached. Please try again later or use manual entry.")
        raise HTTPException(status_code=500, detail="Failed to evaluate document. Ensure it is a clear image or PDF.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)
