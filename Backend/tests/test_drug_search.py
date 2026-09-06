"""
Automated Test Suite for Drug Search & Medical Intelligence Pipeline.

Tests:
1. RxNorm normalization & condition resolution (services/drug_search/rxnorm.py)
2. openFDA labeling retrieval & safety extraction (services/drug_search/openfda.py)
3. Clinical evidence & DailyMed provenance (services/drug_search/evidence.py)
4. LangGraph Multi-Agent Pipeline execution (agents/drug_agent/graph.py)
   - Disease-to-drugs workflow
   - Drug-to-information workflow
   - Patient context safety filter (renal / eGFR flagging)
   - Graceful unknown term handling
5. FastAPI Router Integration (api/drug_search.py)
"""

import pytest
import httpx
from main import app
from schemas.drug_search import DrugSearchResponse, DrugEntity
from services.drug_search.rxnorm import (
    search_rxnorm_drug,
    resolve_disease_condition,
    get_drugs_for_condition,
    get_drug_classes_for_rxcui
)
from services.drug_search.openfda import fetch_fda_drug_monograph
from services.drug_search.evidence import retrieve_drug_evidence
from agents.drug_agent import drug_search_graph


# ---------------------------------------------------------------------------
# 1. Service Layer Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rxnorm_drug_resolution():
    """Verify RxNorm normalizes metformin to RxCUI 6809."""
    res = await search_rxnorm_drug("metformin")
    assert res is not None
    assert res["rxcui"] == "6809"
    assert "metformin" in res["name"].lower()


@pytest.mark.asyncio
async def test_disease_resolution():
    """Verify disease phrases normalize to standard medical concepts."""
    d1 = resolve_disease_condition("type 2 diabetes")
    assert d1 is not None
    assert d1["identifier"] == "D003924"
    assert "Diabetes" in d1["normalized_name"]

    d2 = resolve_disease_condition("hypertension")
    assert d2 is not None
    assert d2["identifier"] == "D006973"


@pytest.mark.asyncio
async def test_drugs_for_condition():
    """Verify disease condition retrieves verified first-line therapies."""
    cond = {"name": "type 2 diabetes", "normalized_name": "Type 2 Diabetes Mellitus", "identifier": "D003924"}
    drugs = await get_drugs_for_condition(cond["identifier"], cond["name"])
    assert len(drugs) >= 3
    names = [d["name"].lower() for d in drugs]
    assert any("metformin" in n for n in names)


@pytest.mark.asyncio
async def test_fda_monograph_retrieval():
    """Verify openFDA extracts indications, warnings, and contraindications."""
    mono = await fetch_fda_drug_monograph("metformin")
    assert len(mono["indications"]) > 0 or len(mono["warnings"]) > 0
    assert len(mono["sources"]) > 0
    assert any("openfda" in s["name"].lower() for s in mono["sources"])


@pytest.mark.asyncio
async def test_fda_monograph_unknown_drug():
    """Verify openFDA handles unknown terms gracefully without crashing."""
    mono = await fetch_fda_drug_monograph("xyzunknownchemical999")
    assert mono["indications"] == []
    assert mono["warnings"] == []
    assert len(mono["sources"]) > 0


def test_evidence_retrieval():
    """Verify evidence retriever attaches ADA guideline and DailyMed URL."""
    ev = retrieve_drug_evidence("metformin")
    assert len(ev["sources"]) >= 1
    urls = [s["url"] for s in ev["sources"] if s.get("url")]
    assert any("dailymed" in u for u in urls)


# ---------------------------------------------------------------------------
# 2. LangGraph Pipeline Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_langgraph_disease_to_drugs():
    """Test full LangGraph execution for 'Drugs used for type 2 diabetes'."""
    initial_state = {
        "raw_query": "Drugs used for type 2 diabetes",
        "retrieved_drugs": [],
        "drug_monographs": [],
        "safety_alerts": [],
        "limitations": [],
        "sources_used": []
    }

    final_state = await drug_search_graph.ainvoke(initial_state)

    assert final_state.get("intent") == "disease_to_drugs"
    assert len(final_state.get("retrieved_drugs", [])) > 0
    assert len(final_state.get("drug_monographs", [])) > 0

    structured = final_state.get("structured_json", {})
    assert structured["query"] == "Drugs used for type 2 diabetes"
    assert structured["condition"] is not None
    assert len(structured["drugs"]) > 0

    report = final_state.get("generated_report", "")
    assert len(report) > 50
    assert "metformin" in report.lower() or "empagliflozin" in report.lower()


@pytest.mark.asyncio
async def test_langgraph_drug_lookup():
    """Test full LangGraph execution for direct drug inquiry 'Tell me about metformin'."""
    initial_state = {
        "raw_query": "Tell me about metformin",
        "retrieved_drugs": [],
        "drug_monographs": [],
        "safety_alerts": [],
        "limitations": [],
        "sources_used": []
    }

    final_state = await drug_search_graph.ainvoke(initial_state)

    assert final_state.get("intent") == "drug_info"
    drugs = final_state.get("retrieved_drugs", [])
    assert len(drugs) >= 1
    assert "metformin" in drugs[0]["name"].lower()

    report = final_state.get("generated_report", "")
    assert "metformin" in report.lower()


@pytest.mark.asyncio
async def test_langgraph_safety_filter_renal_contraindication():
    """Test patient context safety filter flags eGFR < 30 for Metformin lactic acidosis."""
    initial_state = {
        "raw_query": "Tell me about metformin",
        "patient_context": {
            "egfr": 22.0,
            "age": 68
        },
        "retrieved_drugs": [],
        "drug_monographs": [],
        "safety_alerts": [],
        "limitations": [],
        "sources_used": []
    }

    final_state = await drug_search_graph.ainvoke(initial_state)

    alerts = final_state.get("safety_alerts", [])
    assert any("egfr" in a.get("message", "").lower() or "renal" in a.get("message", "").lower() for a in alerts)


@pytest.mark.asyncio
async def test_langgraph_unknown_term():
    """Test pipeline graceful degradation when query is unrecognized."""
    initial_state = {
        "raw_query": "xyznonsensemedicationnotreal999",
        "retrieved_drugs": [],
        "drug_monographs": [],
        "safety_alerts": [],
        "limitations": [],
        "sources_used": []
    }

    final_state = await drug_search_graph.ainvoke(initial_state)

    assert len(final_state.get("retrieved_drugs", [])) == 0
    assert len(final_state.get("limitations", [])) > 0
    report = final_state.get("generated_report", "")
    assert "not found" in report.lower() or "no authoritative" in report.lower() or "disclaimer" in report.lower()


# ---------------------------------------------------------------------------
# 3. FastAPI HTTP Endpoint Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_api_search_endpoint():
    """Test POST /api/drugs/search via async client."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/drugs/search",
            json={"query": "Medications commonly used for hypertension"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "drugs" in data
        assert "report" in data
        assert len(data["drugs"]) > 0
        assert len(data["report"]) > 0


@pytest.mark.asyncio
async def test_api_empty_query_rejected():
    """Test POST /api/drugs/search with empty query returns HTTP 400."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/drugs/search",
            json={"query": "   "}
        )
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_api_get_drug_monograph():
    """Test GET /api/drugs/{name_or_rxcui} for metformin."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/drugs/metformin")
        assert response.status_code == 200
        data = response.json()
        assert data["name"].lower() == "metformin"
        assert data["rxnorm_id"] == "6809"
        assert len(data["sources"]) > 0
