import io
import re
import logging
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image, ImageEnhance
import numpy as np
import pypdf
from rapidocr_onnxruntime import RapidOCR

logger = logging.getLogger("zeze.ocr")
ocr_engine = None

def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        try:
            ocr_engine = RapidOCR()
            logger.info("RapidOCR engine initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize RapidOCR: {e}")
    return ocr_engine

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Preprocess image for optimal OCR extraction: contrast enhance, normalize scale."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    w, h = img.size
    if w < 1000 or h < 1000:
        scale = max(1000 / w, 1000 / h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    elif w > 3000 or h > 3000:
        scale = min(3000 / w, 3000 / h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    # Enhance contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.4)
    
    return np.array(img)

def extract_text_from_pdf(pdf_bytes: bytes) -> Tuple[str, List[Dict[str, Any]]]:
    """Extract text from PDF pages, falling back to RapidOCR for embedded images if text is empty."""
    extracted_text = []
    blocks = []
    
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_text.append(f"--- Page {idx+1} ---\n{page_text}")
                blocks.append({"page": idx + 1, "text": page_text, "type": "pdf_vector"})
            
            # If page text is very sparse (e.g. scanned document), extract images and OCR them
            if len(page_text.strip()) < 60 and hasattr(page, "images") and page.images:
                for img_idx, img_obj in enumerate(page.images):
                    try:
                        img_text, _ = extract_text_from_image(img_obj.data)
                        if img_text.strip():
                            extracted_text.append(f"--- Page {idx+1} (OCR) ---\n{img_text}")
                            blocks.append({"page": idx + 1, "text": img_text, "type": "pdf_image_ocr"})
                    except Exception as ie:
                        logger.warning(f"Failed to OCR embedded image on PDF page {idx+1}: {ie}")
    except Exception as e:
        logger.warning(f"Error reading PDF text stream: {e}")

    return "\n\n".join(extracted_text), blocks

def extract_text_from_image(image_bytes: bytes) -> Tuple[str, List[Dict[str, Any]]]:
    """Extract text from image bytes using RapidOCR."""
    engine = get_ocr_engine()
    if not engine:
        return "", []

    try:
        img_np = preprocess_image(image_bytes)
        ocr_result, _ = engine(img_np)
        
        lines = []
        blocks = []
        if ocr_result:
            for item in ocr_result:
                if len(item) >= 3:
                    box, text, score = item[0], item[1], float(item[2])
                    if score > 0.35:
                        lines.append(text)
                        blocks.append({"text": text, "confidence": score, "box": box})
                        
        return "\n".join(lines), blocks
    except Exception as e:
        logger.error(f"Image OCR processing failed: {e}", exc_info=True)
        return "", []

import math

def parse_clinical_regex(raw_text: str) -> Dict[str, Any]:
    """
    Robust clinical regex extractor with comprehensive patterns for:
    - Blood Pressure (composite BP, SBP/DBP, hyphenated, multi-format)
    - Total Cholesterol (mg/dL and mmol/L conversions, tiers)
    - Blood Glucose (fasting, FBS, RBS, mmol/L conversions, tiers)
    - Demographics (Age, Biological Sex, DOB-derived)
    - Anthropometrics (Height in cm/meters/ft+in, Weight in kg/lbs)
    - Lifestyle (Smoking, Alcohol, Physical Activity)
    All decimal vitals are rounded up to the nearest integer as requested.
    """
    results: Dict[str, Any] = {
        "vitals": {},
        "snippets": {},
        "confidence": {}
    }
    
    # Normalize text representation
    clean_text = raw_text.replace('\r', '\n')
    # Collapse multiple inline spaces for flexible regex matching
    single_line_text = re.sub(r'[ \t]+', ' ', clean_text)

    # -------------------------------------------------------------
    # 1. Blood Pressure
    # e.g., "BP: 148/94", "148 / 94 mmHg", "148-94", "BP 148\94", "NIBP: 135/85"
    # -------------------------------------------------------------
    bp_match = re.search(
        r'(?:\b(?:bp|blood\s*pressure|b\.?p\.?|nibp|sys\s*[/\\-]\s*dia|pressure)\b[:\s]*)?(\b(?:[6-9]\d|1\d\d|2[0-4]\d))\s*[/\\|\-]\s*(\b(?:[3-9]\d|1[0-6]\d))\b(?:\s*(?:mm\s*hg|mmhg))?', 
        single_line_text, 
        re.IGNORECASE
    )
    if bp_match:
        ap_hi_raw = float(bp_match.group(1))
        ap_lo_raw = float(bp_match.group(2))
        if ap_hi_raw > ap_lo_raw and 60 <= ap_hi_raw <= 260 and 30 <= ap_lo_raw <= 180:
            results["vitals"]["ap_hi"] = int(math.ceil(ap_hi_raw))
            results["vitals"]["ap_lo"] = int(math.ceil(ap_lo_raw))
            results["snippets"]["blood_pressure"] = bp_match.group(0).strip()
            results["confidence"]["blood_pressure"] = "high"

    # Secondary BP check if not found composite
    if "ap_hi" not in results["vitals"]:
        sys_match = re.search(
            r'(?:\b(?:systolic|sbp|sys\b|systolic\s*bp)\b[:\s]+)(\b(?:[6-9]\d|1\d\d|2[0-4]\d))\b', 
            single_line_text, 
            re.IGNORECASE
        )
        dia_match = re.search(
            r'(?:\b(?:diastolic|dbp|dia\b|diastolic\s*bp)\b[:\s]+)(\b(?:[3-9]\d|1[0-6]\d))\b', 
            single_line_text, 
            re.IGNORECASE
        )
        if sys_match and dia_match:
            sys_val = float(sys_match.group(1))
            dia_val = float(dia_match.group(1))
            if sys_val > dia_val:
                results["vitals"]["ap_hi"] = int(math.ceil(sys_val))
                results["vitals"]["ap_lo"] = int(math.ceil(dia_val))
                results["snippets"]["blood_pressure"] = f"{sys_match.group(0)} / {dia_match.group(0)}"
                results["confidence"]["blood_pressure"] = "medium"

    # -------------------------------------------------------------
    # 2. Total Cholesterol
    # e.g., "Total Cholesterol: 245 mg/dL", "Cholesterol, Total: 215", "CHOL: 210", "Cholesterol: 5.4 mmol/L"
    # -------------------------------------------------------------
    chol_match = re.search(
        r'(?:\b(?:total\s*cholesterol|cholesterol[,\s]+total|serum\s*cholesterol|s\.?\s*chol(?:esterol)?|chol\b|tc\b)\b[:\s]+)(\d{1,3}(?:\.\d+)?)\s*(mg/dl|mmol/l)?', 
        single_line_text, 
        re.IGNORECASE
    )
    if not chol_match:
        # Fallback to general cholesterol mention
        chol_match = re.search(
            r'(?:\bcholesterol\b[:\s]+)(\d{1,3}(?:\.\d+)?)\s*(mg/dl|mmol/l)?',
            single_line_text,
            re.IGNORECASE
        )

    if chol_match:
        val = float(chol_match.group(1))
        unit = (chol_match.group(2) or "").lower()
        if unit == "mmol/l" or val < 15.0:
            val = val * 38.67
        
        # Round up decimal cholesterol
        val_rounded = int(math.ceil(val))
        tier = 1 if val_rounded < 200 else (2 if val_rounded < 240 else 3)
        results["vitals"]["cholesterol"] = tier
        results["vitals"]["cholesterol_mgdl"] = val_rounded
        results["snippets"]["cholesterol"] = chol_match.group(0).strip()
        results["confidence"]["cholesterol"] = "high"

    # -------------------------------------------------------------
    # 3. Blood Glucose
    # e.g. "Fasting Glucose: 110 mg/dL", "FBS: 108", "FBG: 95", "Blood Sugar: 115", "Glucose: 5.8 mmol/L"
    # -------------------------------------------------------------
    gluc_match = re.search(
        r'(?:\b(?:fasting\s*(?:blood\s*)?glucose|fasting\s*(?:blood\s*)?sugar|fbs\b|fbg\b|fpg\b|blood\s*sugar|blood\s*glucose|serum\s*glucose|rbs\b|plasma\s*glucose)\b[:\s]+)(\d{1,3}(?:\.\d+)?)\s*(mg/dl|mmol/l)?', 
        single_line_text, 
        re.IGNORECASE
    )
    if not gluc_match:
        gluc_match = re.search(
            r'(?:\bglucose\b[:\s]+)(\d{1,3}(?:\.\d+)?)\s*(mg/dl|mmol/l)?',
            single_line_text,
            re.IGNORECASE
        )

    if gluc_match:
        val = float(gluc_match.group(1))
        unit = (gluc_match.group(2) or "").lower()
        if unit == "mmol/l" or val < 20.0:
            val = val * 18.0182
        
        # Round up decimal glucose
        val_rounded = int(math.ceil(val))
        tier = 1 if val_rounded < 100 else (2 if val_rounded < 126 else 3)
        results["vitals"]["gluc"] = tier
        results["vitals"]["gluc_mgdl"] = val_rounded
        results["snippets"]["glucose"] = gluc_match.group(0).strip()
        results["confidence"]["glucose"] = "high"

    # -------------------------------------------------------------
    # 4. Age
    # e.g. "Age: 55", "55 years", "55 yo", "Age / Sex: 55 / M"
    # -------------------------------------------------------------
    age_match = re.search(r'(?:\b(?:age|aged|patient\s*age)\b[:\s]*)(\d{1,2}(?:\.\d+)?)\b', single_line_text, re.IGNORECASE)
    if not age_match:
        age_match = re.search(r'\b(\d{1,2}(?:\.\d+)?)\s*(?:years|yrs|y\.?o\.?|yo)\b', single_line_text, re.IGNORECASE)
    if not age_match:
        age_match = re.search(r'(?:\b(?:age\s*[/\\,]\s*(?:sex|gender))\b[:\s]*)(\d{1,2}(?:\.\d+)?)\b', single_line_text, re.IGNORECASE)

    if age_match:
        age_val = float(age_match.group(1))
        if 18 <= age_val <= 110:
            results["vitals"]["age"] = int(math.ceil(age_val))
            results["snippets"]["age"] = age_match.group(0).strip()
            results["confidence"]["age"] = "high"

    # -------------------------------------------------------------
    # 5. Sex / Gender
    # e.g. "Sex: Male", "Gender: F", "Sex / Age: Male / 55", "55 yo M"
    # -------------------------------------------------------------
    sex_match = re.search(r'(?:\b(?:sex|gender|biological\s*sex)\b[:\s]*)(male|female|man|woman|\bm\b|\bf\b)', single_line_text, re.IGNORECASE)
    if not sex_match:
        # Check combined age/sex format e.g. "55 M" or "55/M" or "55yo male"
        combined_sex = re.search(r'\b\d{1,2}\s*(?:yo|y/o|years|yrs)?\s*[/,\s]\s*(male|female|\bm\b|\bf\b)\b', single_line_text, re.IGNORECASE)
        if combined_sex:
            sex_match = combined_sex

    if sex_match:
        token = sex_match.group(1).strip().upper()
        results["vitals"]["sex"] = 1.0 if token.startswith('M') else 0.0
        results["snippets"]["sex"] = sex_match.group(0).strip()
        results["confidence"]["sex"] = "high"

    # -------------------------------------------------------------
    # 6. Height (cm) & Weight (kg)
    # Handles metric and imperial conversions, and rounds up decimals
    # -------------------------------------------------------------
    # Height: cm, meters, or feet/inches
    ht_match = re.search(r'(?:\b(?:height|ht|stature)\b[:\s]*)(\d{2,3}(?:\.\d+)?)\s*(?:cm)?\b', single_line_text, re.IGNORECASE)
    if ht_match:
        ht = float(ht_match.group(1))
        if 100 <= ht <= 235:
            results["vitals"]["height"] = int(math.ceil(ht))
            results["snippets"]["height"] = ht_match.group(0).strip()
            results["confidence"]["height"] = "high"
    else:
        # Check meters e.g. "1.76 m"
        ht_m_match = re.search(r'(?:\b(?:height|ht|stature)\b[:\s]*)([12]\.\d{1,2})\s*(?:m\b|meter|meters)', single_line_text, re.IGNORECASE)
        if ht_m_match:
            ht = float(ht_m_match.group(1)) * 100.0
            results["vitals"]["height"] = int(math.ceil(ht))
            results["snippets"]["height"] = ht_m_match.group(0).strip()
            results["confidence"]["height"] = "high"
        else:
            # Check imperial e.g. 5'10" or 5 ft 10 in
            ht_imp_match = re.search(r'(?:\b(?:height|ht)\b[:\s]*)([4-7])\s*(?:\'|ft|feet)\s*(\d{1,2})?\s*(?:\"|in|inches)?', single_line_text, re.IGNORECASE)
            if ht_imp_match:
                feet = float(ht_imp_match.group(1))
                inches = float(ht_imp_match.group(2) or 0)
                ht_cm = (feet * 12.0 + inches) * 2.54
                results["vitals"]["height"] = int(math.ceil(ht_cm))
                results["snippets"]["height"] = ht_imp_match.group(0).strip()
                results["confidence"]["height"] = "medium"

    # Weight: kg or lbs
    wt_match = re.search(r'(?:\b(?:weight|wt|body\s*weight|body\s*mass)\b[:\s]*)(\d{2,3}(?:\.\d+)?)\s*(?:kg|kgs|kilos?)?\b', single_line_text, re.IGNORECASE)
    if wt_match:
        wt = float(wt_match.group(1))
        if 30 <= wt <= 250:
            results["vitals"]["weight"] = int(math.ceil(wt))
            results["snippets"]["weight"] = wt_match.group(0).strip()
            results["confidence"]["weight"] = "high"
    else:
        # Check imperial lbs e.g. "185 lbs" or "185 pounds"
        wt_lbs_match = re.search(r'(?:\b(?:weight|wt|body\s*weight)\b[:\s]*)(\d{2,3}(?:\.\d+)?)\s*(?:lbs?|pounds?)\b', single_line_text, re.IGNORECASE)
        if wt_lbs_match:
            lbs = float(wt_lbs_match.group(1))
            kg = lbs * 0.45359237
            results["vitals"]["weight"] = int(math.ceil(kg))
            results["snippets"]["weight"] = wt_lbs_match.group(0).strip()
            results["confidence"]["weight"] = "medium"

    # -------------------------------------------------------------
    # 7. Smoking / Alcohol / Physical Activity
    # -------------------------------------------------------------
    if re.search(r'\b(?:smoker|smoking|tobacco\s*use|cigarettes|nicotine)\b', single_line_text, re.IGNORECASE):
        if not re.search(r'\b(?:non-smoker|non\s*smoker|no\s*smoking|denies\s*tobacco|never\s*smoked|tobacco\s*:\s*no)\b', single_line_text, re.IGNORECASE):
            results["vitals"]["smoke"] = 1
            results["snippets"]["smoke"] = "Document indicates tobacco/smoking history"
            results["confidence"]["smoke"] = "medium"
        else:
            results["vitals"]["smoke"] = 0
            results["snippets"]["smoke"] = "Document notes non-smoker / no tobacco"
            results["confidence"]["smoke"] = "high"

    if re.search(r'\b(?:alcohol|drinks|drinking|ethanol|etoh)\b', single_line_text, re.IGNORECASE):
        if not re.search(r'\b(?:denies\s*alcohol|non-drinker|non\s*drinker|no\s*alcohol|alcohol\s*:\s*no)\b', single_line_text, re.IGNORECASE):
            results["vitals"]["alco"] = 1
            results["snippets"]["alcohol"] = "Document indicates alcohol consumption"
            results["confidence"]["alcohol"] = "medium"
        else:
            results["vitals"]["alco"] = 0
            results["snippets"]["alcohol"] = "Document notes non-drinker"
            results["confidence"]["alcohol"] = "high"

    if re.search(r'\b(?:sedentary|inactive|no\s*exercise|rarely\s*exercises)\b', single_line_text, re.IGNORECASE):
        results["vitals"]["active"] = 0
        results["snippets"]["activity"] = "Document notes sedentary lifestyle"
        results["confidence"]["activity"] = "medium"
    elif re.search(r'\b(?:active|regular\s*exercise|daily\s*walk|exercises|gym|runner|jogging)\b', single_line_text, re.IGNORECASE):
        results["vitals"]["active"] = 1
        results["snippets"]["activity"] = "Document notes regular physical activity"
        results["confidence"]["activity"] = "medium"

    return results

def process_document_pipeline(files_data: List[Tuple[str, bytes, str]], user_symptoms: Optional[str] = None) -> Dict[str, Any]:
    """
    Main extraction pipeline:
    1. Runs OCR (RapidOCR for images, PyPDF for PDFs)
    2. Runs clinical regex & heuristics
    3. Merges text streams
    4. Returns consolidated vitals, text, and provenance
    """
    all_raw_text = []
    combined_vitals = {}
    combined_snippets = {}
    combined_confidence = {}

    for filename, content, mime_type in files_data:
        file_text = ""
        filename_lower = filename.lower()
        is_text = mime_type.startswith("text/") or filename_lower.endswith((".txt", ".csv", ".json", ".md"))
        is_pdf = mime_type == "application/pdf" or filename_lower.endswith(".pdf")
        
        if is_text:
            try:
                file_text = content.decode("utf-8", errors="replace")
            except Exception as e:
                logger.warning(f"Error decoding text document {filename}: {e}")
                file_text = ""
        elif is_pdf:
            pdf_text, _ = extract_text_from_pdf(content)
            file_text = pdf_text
        else:
            img_text, _ = extract_text_from_image(content)
            file_text = img_text
            
        if file_text:
            all_raw_text.append(f"=== File: {filename} ===\n{file_text}")
            parsed = parse_clinical_regex(file_text)
            
            # Merge vitals
            for k, v in parsed["vitals"].items():
                if k not in combined_vitals:
                    combined_vitals[k] = v
            for k, v in parsed["snippets"].items():
                if k not in combined_snippets:
                    combined_snippets[k] = v
            for k, v in parsed["confidence"].items():
                if k not in combined_confidence:
                    combined_confidence[k] = v

    full_text = "\n\n".join(all_raw_text)
    if user_symptoms:
        combined_vitals["symptoms"] = user_symptoms

    # Ensure all numerical vitals are rounded up to integer values
    for vk in ["age", "height", "weight", "ap_hi", "ap_lo", "cholesterol", "gluc", "smoke", "alco", "active"]:
        if vk in combined_vitals and combined_vitals[vk] is not None:
            try:
                combined_vitals[vk] = int(math.ceil(float(combined_vitals[vk])))
            except (ValueError, TypeError):
                pass

    return {
        "raw_text": full_text,
        "vitals": combined_vitals,
        "snippets": combined_snippets,
        "confidence": combined_confidence
    }
