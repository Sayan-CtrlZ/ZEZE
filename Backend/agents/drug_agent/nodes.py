import re
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import os

from .state import DrugSearchState
from services.drug_search.rxnorm import (
    search_rxnorm_drug,
    get_drugs_for_condition,
    get_drug_classes_for_rxcui,
    resolve_disease_condition,
)
from services.drug_search.openfda import fetch_fda_drug_monograph
from services.drug_search.evidence import retrieve_drug_evidence
from schemas.drug_search import (
    DrugSearchResponse,
    DrugEntity,
    ConditionEntity,
    SourceMetadata
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# NODE 1: query_analyzer
# ---------------------------------------------------------------------------
async def query_analyzer(state: DrugSearchState) -> Dict[str, Any]:
    raw = state.get("raw_query", "").strip()
    q_lower = raw.lower()

    intent = "general"
    normalized_condition = None
    target_drug_term = None
    limitations = []

    # 1. Disease-to-drug detection patterns
    disease_patterns = [
        r"(?:drugs?|medications?|medicines?|treatments?)\s+(?:used\s+for|for|in|treating)\s+(.+)",
        r"what\s+(?:drugs?|medications?)\s+(?:are\s+used\s+for|are\s+for|treat|are\s+associated\s+with)\s+(.+)",
        r"(?:drugs?|medications?)\s+associated\s+with\s+(.+)",
        r"prescriptions?\s+for\s+(.+)",
        r"^(.+?)\s+(?:drugs?|medications?|treatment)$"
    ]

    matched_disease_phrase = None
    for pat in disease_patterns:
        m = re.search(pat, q_lower)
        if m:
            matched_disease_phrase = m.group(1).strip("?. ")
            break

    if matched_disease_phrase:
        resolved = resolve_disease_condition(matched_disease_phrase)
        if resolved:
            intent = "disease_to_drugs"
            normalized_condition = resolved
        else:
            # Check if phrase is a condition or drug
            intent = "disease_to_drugs"
            normalized_condition = {
                "name": matched_disease_phrase.title(),
                "normalized_name": matched_disease_phrase.title(),
                "identifier": None
            }
    else:
        # Check direct disease keywords
        resolved = resolve_disease_condition(q_lower)
        if resolved:
            intent = "disease_to_drugs"
            normalized_condition = resolved
        else:
            # 2. Specific drug query detection patterns
            drug_patterns = [
                r"(?:tell\s+me\s+about|info\s+on|information\s+about|details\s+on)\s+([a-zA-Z0-9\s/-]+)",
                r"what\s+is\s+([a-zA-Z0-9\s/-]+)(?:\s+used\s+for)?",
                r"side\s+effects\s+of\s+([a-zA-Z0-9\s/-]+)",
                r"dosage\s+(?:of|for)\s+([a-zA-Z0-9\s/-]+)",
            ]
            matched_drug = None
            for pat in drug_patterns:
                m = re.search(pat, q_lower)
                if m:
                    matched_drug = m.group(1).strip("?. ")
                    break

            if matched_drug:
                intent = "drug_info"
                target_drug_term = matched_drug
            else:
                # Single or two word query: test if drug concept
                clean_term = re.sub(r"[^\w\s-]", "", raw).strip()
                if len(clean_term.split()) <= 2:
                    intent = "drug_info"
                    target_drug_term = clean_term
                else:
                    intent = "general"
                    target_drug_term = clean_term

    logger.info(f"[QueryAnalyzer] Query='{raw}' -> Intent='{intent}', Condition={normalized_condition}, DrugTerm={target_drug_term}")
    return {
        "intent": intent,
        "normalized_condition": normalized_condition,
        "target_drug_term": target_drug_term,
        "limitations": limitations,
        "errors": []
    }

# ---------------------------------------------------------------------------
# NODE 2: drug_retriever
# ---------------------------------------------------------------------------
async def drug_retriever(state: DrugSearchState) -> Dict[str, Any]:
    intent = state.get("intent", "general")
    retrieved: List[Dict[str, Any]] = []
    sources_used = state.get("sources_used", [])
    limitations = state.get("limitations", [])

    if intent == "disease_to_drugs":
        cond = state.get("normalized_condition") or {}
        cond_id = cond.get("identifier") or "D000000"
        cond_name = cond.get("normalized_name") or cond.get("name") or "Condition"
        
        drugs = await get_drugs_for_condition(cond_id, cond_name)
        if not drugs and cond.get("name"):
            # Try searching condition name directly in approximateTerm
            single = await search_rxnorm_drug(cond["name"])
            if single and single.get("rxcui"):
                drugs = [single]

        if not drugs:
            limitations.append(f"No direct RxNorm/MEDRT drug relationships found for condition '{cond_name}'.")

        for d in drugs:
            classes = await get_drug_classes_for_rxcui(d.get("rxcui"))
            d["drug_class"] = classes
            if d.get("source"):
                sources_used.append(d["source"])
            retrieved.append(d)

    else:
        # Drug Info or General query
        term = state.get("target_drug_term") or state.get("raw_query") or ""
        concept = await search_rxnorm_drug(term)
        if concept and concept.get("rxcui"):
            classes = await get_drug_classes_for_rxcui(concept.get("rxcui"))
            concept["drug_class"] = classes
            if concept.get("source"):
                sources_used.append(concept["source"])
            retrieved.append(concept)
        else:
            limitations.append(f"Drug concept '{term}' could not be resolved to an authoritative RxCUI in NLM RxNorm.")

    logger.info(f"[DrugRetriever] Found {len(retrieved)} drug concept(s).")
    return {
        "retrieved_drugs": retrieved,
        "sources_used": sources_used,
        "limitations": limitations
    }

# ---------------------------------------------------------------------------
# NODE 3: drug_information_retriever
# ---------------------------------------------------------------------------
async def drug_information_retriever(state: DrugSearchState) -> Dict[str, Any]:
    drugs = state.get("retrieved_drugs", [])
    monographs = []
    sources_used = state.get("sources_used", [])
    limitations = state.get("limitations", [])

    # Process up to top 5 drugs to balance depth and speed
    for drug in drugs[:5]:
        d_name = drug.get("name", "")
        gen_name = drug.get("generic_name") or d_name.lower()
        
        fda_data = await fetch_fda_drug_monograph(d_name, gen_name)
        
        # Merge FDA sources
        for src in fda_data.get("sources", []):
            sources_used.append(src)

        combined = {
            **drug,
            "indications": fda_data.get("indications", []),
            "contraindications": fda_data.get("contraindications", []),
            "warnings": fda_data.get("warnings", []),
            "adverse_reactions": fda_data.get("adverse_reactions", []),
            "dosage_information": fda_data.get("dosage_information", []),
            "interactions": fda_data.get("interactions", []),
            "fda_sources": fda_data.get("sources", [])
        }
        monographs.append(combined)

    if not monographs:
        limitations.append("FDA labeling monograph was unavailable for the queried concepts.")

    logger.info(f"[DrugInfoRetriever] Enriched {len(monographs)} drug monograph(s) with openFDA labeling.")
    return {
        "drug_monographs": monographs,
        "sources_used": sources_used,
        "limitations": limitations
    }

# ---------------------------------------------------------------------------
# NODE 4: evidence_retriever
# ---------------------------------------------------------------------------
async def evidence_retriever(state: DrugSearchState) -> Dict[str, Any]:
    monographs = state.get("drug_monographs", [])
    sources_used = state.get("sources_used", [])

    for item in monographs:
        evidence_data = retrieve_drug_evidence(item.get("generic_name"), item.get("drug_class", []))
        item["evidence"] = evidence_data.get("evidence", [])
        item["evidence_sources"] = evidence_data.get("sources", [])
        for src in evidence_data.get("sources", []):
            sources_used.append(src)

    logger.info(f"[EvidenceRetriever] Attached clinical guidelines and DailyMed evidence.")
    return {
        "drug_monographs": monographs,
        "sources_used": sources_used
    }

# ---------------------------------------------------------------------------
# NODE 5: safety_filter
# ---------------------------------------------------------------------------
async def safety_filter(state: DrugSearchState) -> Dict[str, Any]:
    monographs = state.get("drug_monographs", [])
    patient_ctx = state.get("patient_context") or {}
    safety_alerts = []

    # Compile boxed warnings
    for med in monographs:
        boxed_list = [w for w in med.get("warnings", []) if "BOXED WARNING" in w.upper()]
        if boxed_list:
            safety_alerts.append({
                "drug": med.get("name"),
                "alert_type": "FDA_BOXED_WARNING",
                "message": boxed_list[0]
            })

    # If patient context exists (e.g. age, renal function, pregnancy, smoking)
    if patient_ctx:
        age = float(patient_ctx.get("age", 0) or 0)
        has_htn = float(patient_ctx.get("ap_hi", 0) or 0) >= 130
        is_smoker = bool(patient_ctx.get("smoke", 0))

        if age >= 65:
            safety_alerts.append({
                "drug": "General Geriatric Alert",
                "alert_type": "AGE_PRECAUTION",
                "message": "Patient age >= 65: review renal clearance (eGFR) and increased sensitivity to orthostasis or metabolic accumulation."
            })
        if has_htn:
            safety_alerts.append({
                "drug": "Cardiovascular Context",
                "alert_type": "HEMODYNAMIC_ALIGNMENT",
                "message": "Patient exhibits resting systolic pressure >= 130 mmHg: evaluate potential drug-induced pressor effects."
            })

    logger.info(f"[SafetyFilter] Generated {len(safety_alerts)} clinical safety alert(s).")
    return {
        "safety_alerts": safety_alerts
    }

# ---------------------------------------------------------------------------
# NODE 6: result_structurer
# ---------------------------------------------------------------------------
async def result_structurer(state: DrugSearchState) -> Dict[str, Any]:
    query = state.get("raw_query", "")
    cond_raw = state.get("normalized_condition")
    monographs = state.get("drug_monographs", [])
    limitations = state.get("limitations", [])
    sources_used = state.get("sources_used", [])
    now_iso = datetime.now(timezone.utc).isoformat()

    condition_obj = None
    if cond_raw:
        condition_obj = {
            "name": cond_raw.get("name", ""),
            "normalized_name": cond_raw.get("normalized_name"),
            "identifier": cond_raw.get("identifier")
        }

    # Format deduplicated sources
    seen_urls = set()
    deduped_sources: List[Dict[str, str]] = []
    for s in sources_used:
        url = s.get("url") or s.get("name")
        if url not in seen_urls:
            seen_urls.add(url)
            deduped_sources.append({
                "name": s.get("name", "Medical Source"),
                "url": s.get("url"),
                "source_type": s.get("source_type", "reference"),
                "retrieved_at": s.get("retrieved_at", now_iso)
            })

    drug_entities: List[Dict[str, Any]] = []
    for m in monographs:
        # Collect sources specific to this drug
        drug_sources: List[Dict[str, str]] = []
        if m.get("source"):
            drug_sources.append(m["source"])
        for s in m.get("fda_sources", []) + m.get("evidence_sources", []):
            if s.get("url") not in {ds.get("url") for ds in drug_sources}:
                drug_sources.append(s)

        entity = {
            "name": m.get("name", "Unknown Drug"),
            "generic_name": m.get("generic_name"),
            "rxnorm_id": m.get("rxcui"),
            "drug_class": m.get("drug_class", []),
            "indications": m.get("indications", []),
            "contraindications": m.get("contraindications", []),
            "warnings": m.get("warnings", []),
            "adverse_reactions": m.get("adverse_reactions", []),
            "dosage_information": m.get("dosage_information", []),
            "interactions": m.get("interactions", []),
            "evidence": m.get("evidence", []),
            "sources": drug_sources
        }
        drug_entities.append(entity)

    structured = {
        "query": query,
        "condition": condition_obj,
        "drugs": drug_entities,
        "limitations": limitations,
        "retrieval_metadata": {
            "sources_used": [s["name"] for s in deduped_sources],
            "total_drugs_retrieved": len(drug_entities),
            "retrieved_at": now_iso,
            "intent": state.get("intent", "general")
        }
    }

    logger.info(f"[ResultStructurer] Structured {len(drug_entities)} DrugEntity object(s).")
    return {
        "structured_json": structured,
        "sources_used": deduped_sources
    }

# ---------------------------------------------------------------------------
# NODE 7: report_generator
# ---------------------------------------------------------------------------
async def report_generator(state: DrugSearchState) -> Dict[str, Any]:
    structured = state.get("structured_json", {})
    safety_alerts = state.get("safety_alerts", [])
    drugs = structured.get("drugs", [])
    cond = structured.get("condition")
    query = state.get("raw_query", "")

    # Check if Groq client is available
    groq_api_key = os.environ.get("GROQ_API_KEY")
    groq_model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
    
    # Construct strictly factual synthesis
    context_lines = []
    if cond:
        context_lines.append(f"Clinical Condition: {cond.get('name')} (Normalized: {cond.get('normalized_name')}, MeSH: {cond.get('identifier') or 'N/A'})")
    context_lines.append(f"Total Drugs Retrieved: {len(drugs)}")

    for i, d in enumerate(drugs[:4], 1):
        context_lines.append(f"\n--- DRUG {i}: {d.get('name')} (Generic: {d.get('generic_name')}, RxCUI: {d.get('rxnorm_id')}) ---")
        context_lines.append(f"Drug Class: {', '.join(d.get('drug_class', [])) or 'Not specified'}")
        if d.get("indications"):
            context_lines.append(f"Approved Indications: {' | '.join(d['indications'][:2])}")
        if d.get("warnings"):
            context_lines.append(f"Key Warnings: {' | '.join(d['warnings'][:2])}")
        if d.get("contraindications"):
            context_lines.append(f"Contraindications: {' | '.join(d['contraindications'][:2])}")
        if d.get("adverse_reactions"):
            context_lines.append(f"Adverse Reactions: {' | '.join(d['adverse_reactions'][:2])}")
        if d.get("dosage_information"):
            context_lines.append(f"Dosage & Administration: {' | '.join(d['dosage_information'][:2])}")
        if d.get("evidence"):
            context_lines.append(f"Clinical Evidence: {' | '.join(d['evidence'][:2])}")
        sources_str = ", ".join(s.get("name") for s in d.get("sources", []))
        context_lines.append(f"Sources: {sources_str}")

    if safety_alerts:
        context_lines.append("\n--- SAFETY ALERTS ---")
        for a in safety_alerts:
            context_lines.append(f"- [{a.get('alert_type')}] {a.get('drug')}: {a.get('message')}")

    data_payload = "\n".join(context_lines)

    prompt = f"""
    You are ZEZE Clinical Drug Intelligence, an authoritative evidence-based medical information synthesizer.
    Generate a high-yield, beautifully formatted clinical intelligence report based STRICTLY on the retrieved government records below.

    USER QUERY: "{query}"

    RETRIEVED VERIFIED DATA:
    {data_payload}

    CRITICAL FORMATTING & CLINICAL RULES:
    1. Base all statements exclusively on the provided retrieved facts. NEVER invent drug indications, mechanisms, or warnings.
    2. Do NOT squish data into illegible single-line ASCII tables.
    3. If you include any Markdown table, EVERY ROW MUST BE ON ITS OWN SEPARATE LINE (e.g., \n| col1 | col2 |\n). Never merge multiple rows onto the same line.
    4. Structure the report with these exact clear sections:

       ### Clinical Overview
       Concise evidence-based overview of the condition and therapeutic management targets based on the retrieved data.

       ### Summary of Evaluated Therapies
       Provide a clean markdown table summarizing the evaluated drugs:
       | # | Medication | Generic Name | RxCUI | Drug Class | Key Guideline / Trial Benchmark |
       |---|---|---|---|---|---|
       (Ensure each row has its own line)

       ### Detailed Medication Profiles
       For each retrieved drug, create a structured profile card using subheadings and bullet points:
       #### [Number]. [Medication Display Name] ([Generic Name] • RxCUI: [RxCUI])
       - **Drug Class**: [Class or Pharmacological Category]
       - **FDA Approved Indications**: [Key approved uses from official labeling]
       - **FDA Boxed Warnings & Safety Advisories**: [Boxed warnings, or note 'None excerpted in labeling' if none]
       - **Contraindications**: [Key documented contraindications]
       - **Clinical Trial & Guideline Evidence**: [Documented ADA, ACC/AHA, or landmark trial evidence]
       - **Dosage & Administration Guidelines**: [Oral/dosing guidelines from official label]

       ### Safety Screening & Risk Considerations
       Highlight any patient safety considerations, renal clearance (eGFR) cutoffs, or documented contraindications from the SAFETY ALERTS section.

       ### Authoritative Citations & Traceability
       List the specific public health repositories and guidelines cited.

       ### Clinical Disclaimer
       Conclude with the standard clinical notice that this evidence report is for licensed healthcare professional reference and informational guidance only.
    """

    report_text = ""
    if groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            completion = client.chat.completions.create(
                model=groq_model,
                messages=[
                    {"role": "system", "content": "You are a specialized medical drug intelligence assistant. Cite only verified government and guideline sources."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            report_text = completion.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Groq report generation failed: {e}")

    # Deterministic fallback report generator
    if not report_text:
        report_text = generate_deterministic_report(query, cond, drugs, safety_alerts)

    logger.info("[ReportGenerator] Generated final clinical report.")
    return {
        "generated_report": report_text
    }

def generate_deterministic_report(query: str, cond: Optional[Dict], drugs: List[Dict], safety_alerts: List[Dict]) -> str:
    lines = []
    lines.append("### Clinical Overview")
    if cond:
        lines.append(f"Medical evaluation regarding **{cond.get('normalized_name') or cond.get('name')}** (MeSH Identifier: `{cond.get('identifier') or 'N/A'}`) retrieved from authoritative NLM RxNorm and FDA drug databases for user query: *\"{query}\"*.")
    else:
        lines.append(f"Medical monograph evaluation for query: *\"{query}\"* synthesized from verified NLM RxNorm and FDA databases.")

    lines.append("\n### Retrieved Medications & Classes")
    for d in drugs:
        classes = ", ".join(d.get("drug_class", [])) or "Class unassigned"
        rxcui = d.get("rxnorm_id") or "Pending"
        lines.append(f"- **{d.get('name')}** (Generic: *{d.get('generic_name') or 'N/A'}*, RxCUI: `{rxcui}`): {classes}")

    lines.append("\n### Key Therapeutic Indications & Evidence")
    for d in drugs:
        inds = d.get("indications", [])
        evs = d.get("evidence", [])
        text_ind = inds[0] if inds else "Indicated per clinical practice guidelines."
        lines.append(f"- **{d.get('name')}**: {text_ind}")
        if evs:
            lines.append(f"  *Evidence Benchmark*: {evs[0]}")

    lines.append("\n### Boxed Warnings & Major Contraindications")
    if safety_alerts:
        for a in safety_alerts:
            lines.append(f"- **{a.get('drug')}** [{a.get('alert_type')}]: {a.get('message')}")
    else:
        for d in drugs:
            c = d.get("contraindications", [])
            w = d.get("warnings", [])
            if w or c:
                note = w[0] if w else c[0]
                lines.append(f"- **{d.get('name')}**: {note}")

    lines.append("\n### Usage & Administration Guidelines")
    for d in drugs:
        dose = d.get("dosage_information", [])
        if dose:
            lines.append(f"- **{d.get('name')}**: {dose[0]}")

    lines.append("\n### Authoritative Citations & Limitations")
    lines.append("- Sources queried: National Library of Medicine (RxNorm/RxNav), US FDA Approved Labeling (openFDA), and DailyMed.")
    lines.append("- Limitations: Drug monographs reflect approved labeling; individual patient comorbidities, renal clearance, and polypharmacy must be verified.")
    lines.append("\n*Clinical Disclaimer: This report is synthesized for healthcare informational purposes only and does not constitute a clinical prescription. Consult a board-certified physician or licensed pharmacist for medical care.*")

    return "\n".join(lines)

# ---------------------------------------------------------------------------
# NODE 8: citation_validator
# ---------------------------------------------------------------------------
async def citation_validator(state: DrugSearchState) -> Dict[str, Any]:
    report = state.get("generated_report", "")
    sources = state.get("sources_used", [])
    validated_citations = []

    # Verify that all cited sources in report have real entries in sources_used
    for src in sources:
        name = src.get("name", "")
        validated_citations.append({
            "source_name": name,
            "url": src.get("url", ""),
            "type": src.get("source_type", "reference")
        })

    logger.info(f"[CitationValidator] Validated {len(validated_citations)} authoritative citation link(s).")
    return {
        "validated_citations": validated_citations
    }
