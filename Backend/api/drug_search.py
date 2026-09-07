"""
Drug Search & Intelligence API Router.

Endpoints:
- POST /api/drugs/search: Executes the full LangGraph pipeline to retrieve, verify, safety-filter, and synthesize authoritative drug information.
- GET  /api/drugs/{name_or_rxcui}: Direct drug monograph lookup from RxNorm & openFDA.
"""

import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Path

from schemas.drug_search import (
    DrugSearchRequest,
    DrugSearchResponse,
    DrugEntity,
    ConditionEntity,
    SourceMetadata
)
from agents.drug_agent import drug_search_graph
from services.drug_search.rxnorm import (
    search_rxnorm_drug,
    get_drug_classes_for_rxcui,
)
from services.drug_search.openfda import fetch_fda_drug_monograph
from services.drug_search.evidence import retrieve_drug_evidence

logger = logging.getLogger("zeze-drug-search")
router = APIRouter()


@router.post("/search", response_model=DrugSearchResponse, summary="Search drugs by condition or name")
async def search_drugs(request: DrugSearchRequest):
    """
    Executes the multi-agent LangGraph workflow:
    1. Query Analyzer: identifies condition vs drug name and extracts intent.
    2. Drug Retriever: queries RxNorm / RxClass / MED-RT for authoritative concepts.
    3. Drug Information Retriever: queries openFDA for boxed warnings, contraindications, and dosages.
    4. Evidence Retriever: retrieves clinical guideline citations (ADA, ACC/AHA, KDIGO, DailyMed).
    5. Safety Filter: screens against patient context and highlights critical safety considerations.
    6. Result Structurer: formats into strict validated schema.
    7. Report Generator: synthesizes clear medical intelligence report (zero hallucinations).
    8. Citation Validator: audits all links against verifiable government / guideline sources.
    """
    query_str = (request.query or "").strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    logger.info(f"[DrugSearchRouter] Incoming search query: '{query_str}'")

    try:
        initial_state = {
            "raw_query": query_str,
            "patient_context": request.patient_context,
            "role": request.role or "clinician",
            "intent": "general",
            "candidate_drugs": [],
            "drug_monographs": [],
            "evidence_links": [],
            "safety_alerts": [],
            "limitations": [],
            "sources_used": []
        }

        final_state = await drug_search_graph.ainvoke(initial_state)

        structured = final_state.get("structured_json") or {}
        report = final_state.get("generated_report", "")

        # Attach final report to the structured response
        structured["report"] = report

        # Ensure fallback fields exist
        if "query" not in structured:
            structured["query"] = query_str
        if "drugs" not in structured:
            structured["drugs"] = []
        if "limitations" not in structured:
            structured["limitations"] = final_state.get("limitations", [])

        return DrugSearchResponse(**structured)

    except Exception as e:
        logger.error(f"[DrugSearchRouter] Pipeline error for query '{query_str}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error executing drug intelligence pipeline: {str(e)}"
        )


@router.get("/{name_or_rxcui}", response_model=DrugEntity, summary="Retrieve authoritative drug monograph")
async def get_drug_details(
    name_or_rxcui: str = Path(..., description="Drug brand/generic name or RxNorm RxCUI")
):
    """
    Direct lookup for a single drug entity using RxNorm and openFDA labeling.
    """
    clean_term = name_or_rxcui.strip()
    if not clean_term:
        raise HTTPException(status_code=400, detail="Drug identifier cannot be empty.")

    try:
        # Check if numeric RxCUI or name
        rxcui = None
        drug_name = clean_term
        if clean_term.isdigit():
            rxcui = clean_term
        else:
            rx_result = await search_rxnorm_drug(clean_term)
            if rx_result:
                rxcui = rx_result.get("rxcui")
                drug_name = rx_result.get("name", clean_term)

        # Retrieve FDA monograph
        monograph = await fetch_fda_drug_monograph(drug_name)

        # If RxCUI found, retrieve drug classes
        classes = []
        if rxcui:
            classes = await get_drug_classes_for_rxcui(rxcui)

        # Evidence references
        evidence = retrieve_drug_evidence(drug_name, classes)

        # Build drug entity
        drug_sources = []
        if monograph.get("source"):
            drug_sources.append(monograph["source"])
        drug_sources.extend(evidence.get("sources", []))

        return DrugEntity(
            name=drug_name.capitalize(),
            generic_name=monograph.get("generic_name") or drug_name,
            rxnorm_id=rxcui,
            drug_class=classes or monograph.get("drug_class", []),
            indications=monograph.get("indications", []),
            contraindications=monograph.get("contraindications", []),
            warnings=monograph.get("warnings", []),
            adverse_reactions=monograph.get("adverse_reactions", []),
            dosage_information=monograph.get("dosage_information", []),
            interactions=monograph.get("interactions", []),
            evidence=evidence.get("guidelines", []),
            sources=drug_sources
        )

    except Exception as e:
        logger.error(f"[DrugSearchRouter] Error retrieving drug '{name_or_rxcui}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve drug monograph: {str(e)}")
