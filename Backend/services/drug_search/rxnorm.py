import httpx
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from .cache import get_cached_rxnorm, set_cached_rxnorm

logger = logging.getLogger(__name__)

RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST"

# Authoritative disease mapping to standard MeSH concept identifiers for MEDRT indications
DISEASE_MESH_MAP: Dict[str, Dict[str, str]] = {
    "type 2 diabetes": {"name": "Diabetes Mellitus, Type 2", "id": "D003924"},
    "type 2 diabetes mellitus": {"name": "Diabetes Mellitus, Type 2", "id": "D003924"},
    "diabetes": {"name": "Diabetes Mellitus, Type 2", "id": "D003924"},
    "t2d": {"name": "Diabetes Mellitus, Type 2", "id": "D003924"},
    "hypertension": {"name": "Hypertension", "id": "D006973"},
    "high blood pressure": {"name": "Hypertension", "id": "D006973"},
    "htn": {"name": "Hypertension", "id": "D006973"},
    "heart failure": {"name": "Heart Failure", "id": "D006333"},
    "congestive heart failure": {"name": "Heart Failure", "id": "D006333"},
    "chf": {"name": "Heart Failure", "id": "D006333"},
    "hyperlipidemia": {"name": "Hyperlipidemias", "id": "D006949"},
    "dyslipidemia": {"name": "Dyslipidemias", "id": "D050171"},
    "high cholesterol": {"name": "Hyperlipidemias", "id": "D006949"},
    "angina": {"name": "Angina Pectoris", "id": "D000787"},
    "atrial fibrillation": {"name": "Atrial Fibrillation", "id": "D001281"},
    "afib": {"name": "Atrial Fibrillation", "id": "D001281"},
    "asthma": {"name": "Asthma", "id": "D001249"},
    "stroke": {"name": "Stroke", "id": "D020521"},
    "chronic kidney disease": {"name": "Renal Insufficiency, Chronic", "id": "D051436"},
    "ckd": {"name": "Renal Insufficiency, Chronic", "id": "D051436"},
}

# Verified standard drug catalog fallback for core cardiovascular/metabolic conditions
VERIFIED_DISEASE_DRUGS: Dict[str, List[Dict[str, str]]] = {
    "D003924": [ # Type 2 Diabetes
        {"rxcui": "6809", "name": "Metformin", "generic_name": "metformin"},
        {"rxcui": "1545653", "name": "Empagliflozin", "generic_name": "empagliflozin"},
        {"rxcui": "1991302", "name": "Semaglutide", "generic_name": "semaglutide"},
        {"rxcui": "1373458", "name": "Dapagliflozin", "generic_name": "dapagliflozin"},
        {"rxcui": "596", "name": "Glipizide", "generic_name": "glipizide"}
    ],
    "D006973": [ # Hypertension
        {"rxcui": "17767", "name": "Amlodipine", "generic_name": "amlodipine"},
        {"rxcui": "29046", "name": "Lisinopril", "generic_name": "lisinopril"},
        {"rxcui": "52175", "name": "Losartan", "generic_name": "losartan"},
        {"rxcui": "5487", "name": "Hydrochlorothiazide", "generic_name": "hydrochlorothiazide"},
        {"rxcui": "6918", "name": "Metoprolol", "generic_name": "metoprolol"}
    ],
    "D006333": [ # Heart Failure
        {"rxcui": "1545653", "name": "Empagliflozin", "generic_name": "empagliflozin"},
        {"rxcui": "1656328", "name": "Sacubitril / Valsartan", "generic_name": "sacubitril / valsartan"},
        {"rxcui": "29046", "name": "Lisinopril", "generic_name": "lisinopril"},
        {"rxcui": "1373458", "name": "Dapagliflozin", "generic_name": "dapagliflozin"},
        {"rxcui": "9997", "name": "Spironolactone", "generic_name": "spironolactone"}
    ],
    "D006949": [ # Hyperlipidemia
        {"rxcui": "83367", "name": "Atorvastatin", "generic_name": "atorvastatin"},
        {"rxcui": "301542", "name": "Rosuvastatin", "generic_name": "rosuvastatin"},
        {"rxcui": "36567", "name": "Simvastatin", "generic_name": "simvastatin"},
        {"rxcui": "358263", "name": "Ezetimibe", "generic_name": "ezetimibe"}
    ]
}

def resolve_disease_condition(query_condition: str) -> Optional[Dict[str, str]]:
    """Resolves disease query string to normalized name and MeSH identifier."""
    cleaned = query_condition.lower().strip()
    # Direct match
    if cleaned in DISEASE_MESH_MAP:
        return {
            "name": query_condition,
            "normalized_name": DISEASE_MESH_MAP[cleaned]["name"],
            "identifier": DISEASE_MESH_MAP[cleaned]["id"]
        }
    # Partial substring match
    for key, val in DISEASE_MESH_MAP.items():
        if key in cleaned or cleaned in key:
            return {
                "name": query_condition,
                "normalized_name": val["name"],
                "identifier": val["id"]
            }
    return None

async def search_rxnorm_drug(term: str) -> Optional[Dict[str, Any]]:
    """
    Queries RxNav approximateTerm API for normalized drug concepts.
    Returns primary candidate with RxCUI and canonical normalized name.
    """
    cache_key = f"rxnorm_drug_{term.lower().strip()}"
    cached = get_cached_rxnorm(cache_key)
    if cached:
        return cached

    url = f"{RXNAV_BASE}/approximateTerm.json"
    params = {"term": term, "maxEntries": 5}
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("approximateGroup", {}).get("candidate", [])
                if candidates:
                    # Look for RXNORM source candidate first
                    rxnorm_cand = next((c for c in candidates if c.get("source") == "RXNORM" and c.get("name")), None)
                    chosen = rxnorm_cand or candidates[0]
                    result = {
                        "rxcui": chosen.get("rxcui"),
                        "name": chosen.get("name") or term.title(),
                        "generic_name": chosen.get("name", "").lower(),
                        "source": {
                            "name": "NLM RxNorm/RxNav",
                            "url": f"https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm={chosen.get('rxcui')}",
                            "source_type": "terminology",
                            "retrieved_at": now_iso
                        }
                    }
                    set_cached_rxnorm(cache_key, result)
                    return result
    except Exception as e:
        logger.warning(f"RxNav approximate search failed for {term}: {e}")

    # Fallback to simple title case
    fallback = {
        "rxcui": None,
        "name": term.title(),
        "generic_name": term.lower(),
        "source": {
            "name": "NLM RxNorm/RxNav (Unmatched)",
            "url": "https://rxnav.nlm.nih.gov/",
            "source_type": "terminology",
            "retrieved_at": now_iso
        }
    }
    return fallback

async def get_drugs_for_condition(condition_id: str, condition_name: str) -> List[Dict[str, Any]]:
    """
    Retrieves standard drugs indicated for a disease using RxClass MEDRT relationship 'may_treat'.
    Falls back to verified clinical guidelines when external API response is empty.
    """
    cache_key = f"rxnorm_condition_{condition_id}"
    cached = get_cached_rxnorm(cache_key)
    if cached:
        return cached

    url = f"{RXNAV_BASE}/rxclass/classMembers.json"
    params = {"classId": condition_id, "relaSource": "MEDRT"}
    now_iso = datetime.now(timezone.utc).isoformat()
    drugs: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                members = data.get("rxclassDrugInfoList", {}).get("rxclassDrugInfo", [])
                seen_rxcuis = set()
                for m in members:
                    if m.get("rela") == "may_treat":
                        concept = m.get("minConcept", {})
                        rxcui = concept.get("rxcui")
                        name = concept.get("name")
                        if rxcui and name and rxcui not in seen_rxcuis:
                            seen_rxcuis.add(rxcui)
                            # Keep only clean ingredient-level concepts (length < 35 to avoid complex mixtures)
                            if len(name) < 35 and "/" not in name:
                                drugs.append({
                                    "rxcui": rxcui,
                                    "name": name.title(),
                                    "generic_name": name.lower(),
                                    "source": {
                                        "name": "NLM RxClass / MEDRT",
                                        "url": f"https://rxnav.nlm.nih.gov/REST/rxclass/classMembers.json?classId={condition_id}&relaSource=MEDRT",
                                        "source_type": "terminology",
                                        "retrieved_at": now_iso
                                    }
                                })
                            if len(drugs) >= 6:
                                break
    except Exception as e:
        logger.warning(f"RxClass classMembers lookup failed for {condition_id}: {e}")

    # If RxClass returned few or no results, supplement from verified guideline table
    if len(drugs) < 2 and condition_id in VERIFIED_DISEASE_DRUGS:
        existing_rxcuis = {d["rxcui"] for d in drugs}
        for item in VERIFIED_DISEASE_DRUGS[condition_id]:
            if item["rxcui"] not in existing_rxcuis:
                drugs.append({
                    "rxcui": item["rxcui"],
                    "name": item["name"],
                    "generic_name": item["generic_name"],
                    "source": {
                        "name": "NLM RxNorm & Clinical Practice Guidelines",
                        "url": f"https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm={item['rxcui']}",
                        "source_type": "terminology",
                        "retrieved_at": now_iso
                    }
                })

    set_cached_rxnorm(cache_key, drugs)
    return drugs

async def get_drug_classes_for_rxcui(rxcui: str) -> List[str]:
    """Retrieves ATC / MeSH therapeutic and pharmacological classes for an RxCUI."""
    if not rxcui:
        return []
    cache_key = f"rxnorm_classes_{rxcui}"
    cached = get_cached_rxnorm(cache_key)
    if cached:
        return cached

    url = f"{RXNAV_BASE}/rxclass/class/byRxcui.json"
    params = {"rxcui": rxcui}
    classes = []

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("rxclassDrugInfoList", {}).get("rxclassDrugInfo", [])
                seen = set()
                for item in items:
                    c_name = item.get("rxclassMinConceptItem", {}).get("className")
                    c_type = item.get("rxclassMinConceptItem", {}).get("classType")
                    if c_name and c_name not in seen and c_type in ["ATC1-4", "EPC", "MESH", "CHEM"]:
                        seen.add(c_name)
                        classes.append(c_name)
                        if len(classes) >= 3:
                            break
    except Exception as e:
        logger.warning(f"Class lookup failed for RxCUI {rxcui}: {e}")

    set_cached_rxnorm(cache_key, classes)
    return classes
