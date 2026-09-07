import httpx
import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from .cache import get_cached_fda, set_cached_fda

logger = logging.getLogger(__name__)

OPENFDA_BASE = "https://api.fda.gov/drug/label.json"

def clean_label_text(text_list: Optional[List[str]], max_items: int = 3, max_chars: int = 500) -> List[str]:
    """Cleans raw FDA label text chunks into complete, readable clinical excerpts without trailing ellipsis."""
    if not text_list:
        return []
    
    cleaned_items = []
    for raw in text_list[:max_items]:
        if not raw:
            continue
        # Remove excessive section numbers like '1 INDICATIONS AND USAGE' or '[see Warnings and Precautions]'
        cleaned = re.sub(r'^\d+(\.\d+)?\s+[A-Z\s]+', '', raw.strip())
        cleaned = re.sub(r'\[see\s+[^\]]+\]', '', cleaned)
        # Remove any pre-existing ellipsis or unicode ellipsis
        cleaned = cleaned.replace("...", "").replace("…", "")
        cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip()
        
        # If longer than max_chars, cut at nearest sentence boundary without ellipsis
        if len(cleaned) > max_chars:
            period_idx = cleaned[:max_chars].rfind(". ")
            if period_idx > 80:
                cleaned = cleaned[:period_idx + 1].strip()
            else:
                cleaned = cleaned[:max_chars].rsplit(" ", 1)[0].strip()
                if not cleaned.endswith("."):
                    cleaned += "."
                    
        if cleaned and cleaned not in cleaned_items:
            cleaned_items.append(cleaned)
            
    return cleaned_items

async def fetch_fda_drug_monograph(drug_name: str, generic_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieves official FDA drug labeling from openFDA API.
    Extracts indications, contraindications, boxed warnings, adverse reactions, and dosages.
    """
    search_term = (generic_name or drug_name).lower().strip()
    cache_key = f"fda_monograph_{search_term}"
    cached = get_cached_fda(cache_key)
    if cached:
        return cached

    now_iso = datetime.now(timezone.utc).isoformat()
    # Simple single ingredient query
    clean_term = search_term.split("/")[0].split("(")[0].strip()
    url = f"{OPENFDA_BASE}?search=openfda.generic_name:\"{clean_term}\"+OR+openfda.brand_name:\"{clean_term}\"&limit=5"

    monograph: Dict[str, Any] = {
        "brand_name": None,
        "generic_name": clean_term,
        "indications": [],
        "contraindications": [],
        "warnings": [],
        "adverse_reactions": [],
        "dosage_information": [],
        "interactions": [],
        "sources": []
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                if results:
                    # Select best single-ingredient candidate over multi-ingredient combo products
                    selected_r = results[0]
                    for cand in results:
                        ofda = cand.get("openfda", {})
                        substances = ofda.get("substance_name", [])
                        gen_names = [g.upper() for g in ofda.get("generic_name", [])]
                        
                        # Check if single ingredient
                        is_single = len(substances) == 1 or not any(" AND " in g or " WITH " in g for g in gen_names)
                        if is_single:
                            selected_r = cand
                            break

                    r = selected_r
                    ofda = r.get("openfda", {})
                    brands = ofda.get("brand_name", [])
                    if brands:
                        monograph["brand_name"] = brands[0]
                    
                    # 1. Boxed Warnings & Warnings
                    boxed = r.get("boxed_warning", [])
                    general_warnings = r.get("warnings_and_precautions", []) or r.get("warnings", [])
                    all_warnings = []
                    if boxed:
                        all_warnings.extend([f"BOXED WARNING: {w}" for w in clean_label_text(boxed, max_items=1, max_chars=300)])
                    all_warnings.extend(clean_label_text(general_warnings, max_items=2, max_chars=280))
                    monograph["warnings"] = all_warnings

                    # 2. Indications & Usage
                    monograph["indications"] = clean_label_text(r.get("indications_and_usage", []), max_items=2, max_chars=300)

                    # 3. Contraindications
                    monograph["contraindications"] = clean_label_text(r.get("contraindications", []), max_items=2, max_chars=280)

                    # 4. Adverse Reactions
                    monograph["adverse_reactions"] = clean_label_text(r.get("adverse_reactions", []), max_items=2, max_chars=280)

                    # 5. Dosage & Administration
                    monograph["dosage_information"] = clean_label_text(r.get("dosage_and_administration", []), max_items=2, max_chars=280)

                    # 6. Drug Interactions
                    monograph["interactions"] = clean_label_text(r.get("drug_interactions", []), max_items=2, max_chars=250)

                    # Attributed Source
                    source_url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:\"{clean_term}\""
                    monograph["sources"].append({
                        "name": "FDA Approved Drug Labeling (openFDA)",
                        "url": source_url,
                        "source_type": "regulatory_label",
                        "retrieved_at": now_iso
                    })
    except Exception as e:
        logger.warning(f"openFDA label fetch failed for '{clean_term}': {e}")

    # Fallback to general reference citation if openFDA has no match
    if not monograph["sources"]:
        monograph["sources"].append({
            "name": "openFDA Drug Database (No label found)",
            "url": "https://open.fda.gov/apis/drug/label/",
            "source_type": "regulatory_label",
            "retrieved_at": now_iso
        })

    set_cached_fda(cache_key, monograph)
    return monograph
