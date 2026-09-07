from typing import TypedDict, List, Dict, Optional, Any
from schemas.drug_search import ConditionEntity, DrugEntity, SourceMetadata

class DrugSearchState(TypedDict, total=False):
    raw_query: str
    patient_context: Optional[Dict[str, Any]]
    role: Optional[str] # 'clinician' | 'trainee' | 'patient'
    intent: str # 'disease_to_drugs' | 'drug_info' | 'drug_class' | 'general'
    normalized_condition: Optional[Dict[str, str]] # name, normalized_name, identifier
    target_drug_term: Optional[str]
    retrieved_drugs: List[Dict[str, Any]]
    drug_monographs: List[Dict[str, Any]]
    safety_alerts: List[Dict[str, Any]]
    structured_json: Optional[Dict[str, Any]]
    generated_report: Optional[str]
    validated_citations: List[Dict[str, str]]
    limitations: List[str]
    errors: List[str]
    sources_used: List[Dict[str, str]]
