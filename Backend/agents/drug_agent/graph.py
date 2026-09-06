"""
Drug Search & Information LangGraph Pipeline.

Orchestrates:
START -> query_analyzer
      -> drug_retriever
      -> drug_information_retriever
      -> evidence_retriever
      -> safety_filter
      -> result_structurer
      -> report_generator
      -> citation_validator
      -> END
"""

import logging
from langgraph.graph import StateGraph, START, END

from .state import DrugSearchState
from .nodes import (
    query_analyzer,
    drug_retriever,
    drug_information_retriever,
    evidence_retriever,
    safety_filter,
    result_structurer,
    report_generator,
    citation_validator,
)

logger = logging.getLogger(__name__)

def create_drug_search_graph():
    """Builds and compiles the Drug Search StateGraph."""
    workflow = StateGraph(DrugSearchState)

    # 1. Register Nodes
    workflow.add_node("query_analyzer", query_analyzer)
    workflow.add_node("drug_retriever", drug_retriever)
    workflow.add_node("drug_information_retriever", drug_information_retriever)
    workflow.add_node("evidence_retriever", evidence_retriever)
    workflow.add_node("safety_filter", safety_filter)
    workflow.add_node("result_structurer", result_structurer)
    workflow.add_node("report_generator", report_generator)
    workflow.add_node("citation_validator", citation_validator)

    # 2. Add Sequential Edges
    workflow.add_edge(START, "query_analyzer")
    workflow.add_edge("query_analyzer", "drug_retriever")
    workflow.add_edge("drug_retriever", "drug_information_retriever")
    workflow.add_edge("drug_information_retriever", "evidence_retriever")
    workflow.add_edge("evidence_retriever", "safety_filter")
    workflow.add_edge("safety_filter", "result_structurer")
    workflow.add_edge("result_structurer", "report_generator")
    workflow.add_edge("report_generator", "citation_validator")
    workflow.add_edge("citation_validator", END)

    # 3. Compile
    return workflow.compile()

drug_search_graph = create_drug_search_graph()
