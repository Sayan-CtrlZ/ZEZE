import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Established evidence benchmarks indexed by normalized generic name or class
EVIDENCE_DATABASE: Dict[str, Dict[str, Any]] = {
    "metformin": {
        "evidence": [
            "ADA Standards of Medical Care in Diabetes: Recommended as first-line pharmacologic agent for the treatment of type 2 diabetes in the absence of contraindications.",
            "UKPDS 34 Landmark Trial: Demonstrated significant reductions in all-cause mortality (36%) and myocardial infarction (39%) in overweight patients with type 2 diabetes."
        ],
        "guideline_sources": [
            {
                "name": "American Diabetes Association (ADA) Guidelines",
                "url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
                "source_type": "clinical_guideline"
            },
            {
                "name": "NLM DailyMed Drug Monograph",
                "url": "https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=metformin",
                "source_type": "regulatory_label"
            }
        ]
    },
    "empagliflozin": {
        "evidence": [
            "EMPA-REG OUTCOME Trial: Demonstrated a 38% relative risk reduction in cardiovascular death and 35% reduction in heart failure hospitalization in patients with type 2 diabetes and high ASCVD risk.",
            "ACC/AHA & ADA Guidelines: Recommended Class I add-on therapy for cardio-renal protection regardless of baseline HbA1c."
        ],
        "guideline_sources": [
            {
                "name": "New England Journal of Medicine (EMPA-REG)",
                "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa1504720",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "amlodipine": {
        "evidence": [
            "2017 ACC/AHA High Blood Pressure Clinical Practice Guidelines: Recommended as Class I first-line agent (monotherapy or dual therapy) for Stage 1 or 2 hypertension.",
            "ALLHAT Landmark Trial: Demonstrated equivalent primary coronary event reduction compared to diuretics and ACE inhibitors with superior stroke prevention."
        ],
        "guideline_sources": [
            {
                "name": "2017 ACC/AHA Hypertension Guidelines (Circulation)",
                "url": "https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "lisinopril": {
        "evidence": [
            "2017 ACC/AHA Hypertension Guidelines: First-line recommendation for hypertension, especially with concomitant diabetes, chronic kidney disease (albuminuria), or heart failure.",
            "GISSI-3 & ATLAS Trials: Documented significant improvements in post-MI survival and left ventricular remodeling suppression."
        ],
        "guideline_sources": [
            {
                "name": "ACC/AHA & KDIGO Practice Guidelines",
                "url": "https://kdigo.org/guidelines/blood-pressure-in-ckd/",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "atorvastatin": {
        "evidence": [
            "2018 AHA/ACC Cholesterol Clinical Practice Guidelines: High-intensity statin of choice recommended to achieve ≥50% LDL-C reduction in patients with clinical ASCVD or 10-year risk ≥20%.",
            "ASCOT-LLA & CARDS Trials: Demonstrated a 36% relative reduction in fatal coronary events and nonfatal MI in hypertensive and diabetic cohorts."
        ],
        "guideline_sources": [
            {
                "name": "2018 AHA/ACC Cholesterol Guidelines (Circulation)",
                "url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "semaglutide": {
        "evidence": [
            "ADA Standards of Medical Care in Diabetes: Level A recommendation for patients with T2DM and established ASCVD or high cardiovascular risk to reduce major adverse cardiovascular events (MACE).",
            "SUSTAIN-6 & PIONEER Trials: Demonstrated a 26% relative risk reduction in 3-point MACE (cardiovascular death, nonfatal myocardial infarction, or nonfatal stroke) and clinically significant weight reduction."
        ],
        "guideline_sources": [
            {
                "name": "American Diabetes Association (ADA) Guidelines",
                "url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
                "source_type": "clinical_guideline"
            },
            {
                "name": "New England Journal of Medicine (SUSTAIN-6)",
                "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa1607141",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "dapagliflozin": {
        "evidence": [
            "DAPA-HF & DAPA-CKD Landmark Trials: Demonstrated a 26% reduction in worsening heart failure or cardiovascular death in HFrEF regardless of diabetes status, and a 39% reduction in kidney disease progression/ESKD.",
            "ACC/AHA & ADA Guidelines: Quadruple guideline-directed medical therapy (GDMT) Class I recommendation for heart failure and cardio-renal risk reduction."
        ],
        "guideline_sources": [
            {
                "name": "New England Journal of Medicine (DAPA-HF)",
                "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa1911303",
                "source_type": "clinical_guideline"
            },
            {
                "name": "ACC/AHA Heart Failure Guidelines",
                "url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "glipizide": {
        "evidence": [
            "ADA Standards of Medical Care: Second-line oral secretagogue recommended when medication cost or financial access is a primary barrier to incretin-based or SGLT2i therapy.",
            "UKPDS Landmark Study: Established durable glycemic control and microvascular complication reduction; requires monitoring for hypoglycemia."
        ],
        "guideline_sources": [
            {
                "name": "American Diabetes Association (ADA) Standards of Care",
                "url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "losartan": {
        "evidence": [
            "RENAAL Landmark Trial: Demonstrated a 16% risk reduction in doubling of serum creatinine, end-stage renal disease, or death in patients with type 2 diabetes and nephropathy.",
            "ACC/AHA Hypertension Guidelines: Class I recommendation for hypertension in patients with microalbuminuria or diabetic kidney disease."
        ],
        "guideline_sources": [
            {
                "name": "New England Journal of Medicine (RENAAL)",
                "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa011161",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "spironolactone": {
        "evidence": [
            "RALES Landmark Trial: Demonstrated a 30% reduction in all-cause mortality and 35% reduction in heart failure hospitalization in patients with severe HFrEF.",
            "ACC/AHA Guidelines: Class I recommendation for mineralocorticoid receptor antagonist therapy in symptomatic HFrEF (EF ≤ 35%) and resistant hypertension."
        ],
        "guideline_sources": [
            {
                "name": "ACC/AHA Heart Failure Guidelines",
                "url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063",
                "source_type": "clinical_guideline"
            }
        ]
    },
    "sacubitril": {
        "evidence": [
            "PARADIGM-HF Landmark Trial: Demonstrated a 20% relative reduction in cardiovascular death or heart failure hospitalization compared to enalapril in HFrEF.",
            "ACC/AHA Guidelines: Class I recommendation to replace ACEi/ARB with ARNI (Sacubitril/Valsartan) in chronic symptomatic HFrEF."
        ],
        "guideline_sources": [
            {
                "name": "New England Journal of Medicine (PARADIGM-HF)",
                "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa1409077",
                "source_type": "clinical_guideline"
            }
        ]
    }
}

def retrieve_drug_evidence(generic_name: Optional[str], classes: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Retrieves clinical evidence, guideline citations, and DailyMed sources for a given drug concept.
    Always provides traceable DailyMed reference link even for unindexed drugs.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    clean = (generic_name or "").lower().strip()
    
    evidence_list: List[str] = []
    sources: List[Dict[str, str]] = []

    # Match in curated evidence database
    matched_entry = None
    for key, val in EVIDENCE_DATABASE.items():
        if key in clean or clean in key:
            matched_entry = val
            break

    if not matched_entry and classes:
        for c in classes:
            c_clean = c.lower()
            for key, val in EVIDENCE_DATABASE.items():
                if key in c_clean or c_clean in key:
                    matched_entry = val
                    break
            if matched_entry:
                break

    if matched_entry:
        evidence_list.extend(matched_entry["evidence"])
        for src in matched_entry["guideline_sources"]:
            sources.append({
                "name": src["name"],
                "url": src["url"],
                "source_type": src["source_type"],
                "retrieved_at": now_iso
            })

    # Always attach National Library of Medicine DailyMed source for traceability
    dailymed_url = f"https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query={clean or 'cardiovascular'}"
    sources.append({
        "name": "National Library of Medicine DailyMed",
        "url": dailymed_url,
        "source_type": "regulatory_label",
        "retrieved_at": now_iso
    })

    return {
        "evidence": evidence_list,
        "sources": sources
    }
