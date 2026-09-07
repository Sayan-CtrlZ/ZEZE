from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SourceMetadata(BaseModel):
    name: str = Field(..., description="Name of the authoritative source, e.g. RxNorm/RxNav, openFDA, DailyMed")
    url: Optional[str] = Field(None, description="Direct URL or API endpoint for verification")
    source_type: str = Field(..., description="'terminology' | 'regulatory_label' | 'clinical_guideline'")
    retrieved_at: str = Field(..., description="ISO 8601 timestamp of retrieval")

class ConditionEntity(BaseModel):
    name: str = Field(..., description="Query condition name")
    normalized_name: Optional[str] = Field(None, description="Normalized MeSH or MEDRT term name")
    identifier: Optional[str] = Field(None, description="MeSH ID or Concept Identifier (e.g. D003924)")

class DrugEntity(BaseModel):
    name: str = Field(..., description="Display name / Brand or Generic name")
    generic_name: Optional[str] = Field(None, description="Normalized generic compound name")
    rxnorm_id: Optional[str] = Field(None, description="RxNorm Concept Unique Identifier (RxCUI)")
    drug_class: List[str] = Field(default_factory=list, description="Pharmacological or therapeutic classes")
    indications: List[str] = Field(default_factory=list, description="FDA-approved indications or MEDRT treatment relations")
    contraindications: List[str] = Field(default_factory=list, description="Documented contraindications from FDA labeling")
    warnings: List[str] = Field(default_factory=list, description="Boxed warnings and key safety warnings")
    adverse_reactions: List[str] = Field(default_factory=list, description="Common and serious adverse reactions")
    dosage_information: List[str] = Field(default_factory=list, description="Dosage and administration excerpts where available")
    interactions: List[str] = Field(default_factory=list, description="Documented drug-drug or drug-class interactions")
    evidence: List[str] = Field(default_factory=list, description="Authoritative clinical guidance or trial evidence")
    sources: List[SourceMetadata] = Field(default_factory=list, description="Exact source provenance and citations")

class DrugSearchRequest(BaseModel):
    query: str = Field(..., description="User query, e.g. 'drugs used for type 2 diabetes' or 'tell me about metformin'")
    patient_context: Optional[Dict[str, Any]] = Field(None, description="Optional patient biomarkers, diseases, or vitals for safety review")
    role: Optional[str] = Field("clinician", description="User role: 'clinician', 'trainee', or 'patient'")

class DrugSearchResponse(BaseModel):
    query: str
    condition: Optional[ConditionEntity] = None
    drugs: List[DrugEntity] = Field(default_factory=list)
    report: str = Field(..., description="Human-readable clinical information report generated from verified retrieved data")
    limitations: List[str] = Field(default_factory=list, description="Data availability limitations or missing evidence flags")
    retrieval_metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata regarding sources queried, timestamps, and query intent")
