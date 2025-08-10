"""
NLP Processing Engine
Advanced natural language processing for regulatory document analysis
"""

import re
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

import spacy
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.chunk import ne_chunk
from nltk.tag import pos_tag
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from src.core.models import get_spacy_nlp, get_sentence_transformer
from src.core.cache import cache_get, cache_set
from src.core.logging import nlp_logger as logger


@dataclass
class RegulatoryConcept:
    """Regulatory concept extracted from text"""
    text: str
    concept_type: str
    confidence: float
    start_pos: int
    end_pos: int
    context: str
    related_entities: List[str]


@dataclass
class ComplianceRequirement:
    """Compliance requirement extracted from regulatory text"""
    requirement_text: str
    requirement_type: str  # mandatory, optional, conditional
    deadline: Optional[datetime]
    applicable_entities: List[str]
    compliance_actions: List[str]
    severity: str  # high, medium, low
    confidence: float


@dataclass
class RegulatoryImpact:
    """Impact assessment of regulatory changes"""
    impact_areas: List[str]
    impact_level: str  # high, medium, low
    affected_processes: List[str]
    implementation_effort: str
    timeline_estimate: str
    cost_implications: str
    risk_factors: List[str]


class RegulatoryNLPEngine:
    """Advanced NLP engine for regulatory document processing"""
    
    def __init__(self):
        self.nlp = None
        self.sentence_transformer = None
        self.regulatory_patterns = self._load_regulatory_patterns()
        self.compliance_keywords = self._load_compliance_keywords()
        self.entity_patterns = self._load_entity_patterns()
        self.requirement_patterns = self._load_requirement_patterns()
        self.impact_indicators = self._load_impact_indicators()
        
        # Download required NLTK data
        self._download_nltk_data()
    
    async def initialize(self):
        """Initialize NLP models and resources"""
        try:
            logger.info("Initializing Regulatory NLP Engine...")
            
            # Load spaCy model
            self.nlp = get_spacy_nlp()
            
            # Load sentence transformer
            self.sentence_transformer = get_sentence_transformer()
            
            # Add custom regulatory pipeline components
            self._add_custom_components()
            
            logger.info("✅ Regulatory NLP Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize NLP Engine: {e}")
            raise
    
    def _download_nltk_data(self):
        """Download required NLTK data"""
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('averaged_perceptron_tagger', quiet=True)
            nltk.download('maxent_ne_chunker', quiet=True)
            nltk.download('words', quiet=True)
            nltk.download('vader_lexicon', quiet=True)
        except Exception as e:
            logger.warning(f"Failed to download some NLTK data: {e}")
    
    def _add_custom_components(self):
        """Add custom spaCy pipeline components for regulatory processing"""
        if not self.nlp:
            return
        
        # Add regulatory entity recognizer
        if "regulatory_ner" not in self.nlp.pipe_names:
            self.nlp.add_pipe("regulatory_ner", last=True)
        
        # Add compliance requirement extractor
        if "compliance_extractor" not in self.nlp.pipe_names:
            self.nlp.add_pipe("compliance_extractor", last=True)
    
    def _load_regulatory_patterns(self) -> Dict[str, List[str]]:
        """Load regulatory text patterns"""
        return {
            "mandatory_indicators": [
                r"\bshall\b", r"\bmust\b", r"\brequired\b", r"\bmandatory\b",
                r"\bobligatory\b", r"\bcompulsory\b", r"\bnecessary\b"
            ],
            "deadline_patterns": [
                r"by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
                r"within\s+(\d+)\s+(days?|weeks?|months?|years?)",
                r"not later than\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
                r"before\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})"
            ],
            "compliance_actions": [
                r"implement", r"establish", r"maintain", r"ensure", r"comply",
                r"report", r"submit", r"file", r"disclose", r"monitor"
            ],
            "regulatory_entities": [
                r"\bRBI\b", r"\bReserve Bank of India\b", r"\bSEBI\b",
                r"\bIRDAI\b", r"\bNPCI\b", r"\bCBDT\b", r"\bFIU\b"
            ]
        }
    
    def _load_compliance_keywords(self) -> Dict[str, List[str]]:
        """Load compliance-related keywords"""
        return {
            "risk_management": [
                "risk assessment", "risk mitigation", "risk monitoring",
                "credit risk", "operational risk", "market risk", "liquidity risk"
            ],
            "capital_adequacy": [
                "capital adequacy ratio", "tier 1 capital", "tier 2 capital",
                "capital conservation buffer", "CRAR", "leverage ratio"
            ],
            "governance": [
                "board oversight", "independent directors", "audit committee",
                "risk committee", "nomination committee", "governance framework"
            ],
            "reporting": [
                "regulatory reporting", "prudential returns", "statutory returns",
                "off-site surveillance", "DSB returns", "XBRL reporting"
            ],
            "customer_protection": [
                "customer grievance", "fair practices", "customer due diligence",
                "know your customer", "KYC", "customer protection measures"
            ]
        }
    
    def _load_entity_patterns(self) -> Dict[str, str]:
        """Load named entity recognition patterns"""
        return {
            "FINANCIAL_INSTITUTION": r"\b(bank|NBFC|financial institution|credit institution|lending institution)\b",
            "REGULATORY_BODY": r"\b(RBI|Reserve Bank|SEBI|IRDAI|NPCI|CBDT|FIU|regulatory authority)\b",
            "COMPLIANCE_TERM": r"\b(compliance|regulatory compliance|statutory compliance|prudential norms)\b",
            "FINANCIAL_RATIO": r"\b(CRAR|CAR|leverage ratio|liquidity ratio|NPA ratio)\b",
            "REGULATORY_DOCUMENT": r"\b(circular|notification|guideline|master direction|prudential framework)\b",
            "DEADLINE": r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|within \d+ (days?|weeks?|months?))\b",
            "MONETARY_AMOUNT": r"\b(₹|Rs\.?|INR)\s*\d+(?:,\d{3})*(?:\.\d{2})?\s*(crore|lakh|thousand|million|billion)?\b"
        }
    
    def _load_requirement_patterns(self) -> List[str]:
        """Load patterns for identifying compliance requirements"""
        return [
            r"banks? (?:shall|must|are required to|should) (.+?)(?:\.|;|$)",
            r"(?:it is|banks are) (?:mandatory|required|necessary) (?:to|that) (.+?)(?:\.|;|$)",
            r"(?:all|every) (?:bank|institution|entity) (?:shall|must|should) (.+?)(?:\.|;|$)",
            r"(?:the|such) (?:bank|institution) (?:shall|must|should) (.+?)(?:\.|;|$)"
        ]
    
    def _load_impact_indicators(self) -> Dict[str, List[str]]:
        """Load indicators for impact assessment"""
        return {
            "high_impact": [
                "significant changes", "major revision", "substantial modification",
                "comprehensive overhaul", "fundamental changes", "critical requirements"
            ],
            "medium_impact": [
                "moderate changes", "updates required", "adjustments needed",
                "enhancements", "improvements", "refinements"
            ],
            "low_impact": [
                "minor changes", "clarifications", "editorial changes",
                "cosmetic updates", "formatting changes", "typographical corrections"
            ],
            "operational_areas": [
                "risk management", "compliance", "audit", "operations",
                "technology", "human resources", "finance", "legal"
            ],
            "implementation_complexity": [
                "system changes", "process redesign", "staff training",
                "policy updates", "procedure modifications", "infrastructure upgrades"
            ]
        }
    
    async def extract_regulatory_concepts(self, text: str) -> List[RegulatoryConcept]:
        """Extract regulatory concepts from text"""
        try:
            # Check cache first
            cache_key = f"regulatory_concepts:{hash(text)}"
            cached_result = await cache_get(cache_key)
            if cached_result:
                return cached_result
            
            concepts = []
            doc = self.nlp(text)
            
            # Extract entities using spaCy
            for ent in doc.ents:
                if ent.label_ in ["ORG", "LAW", "DATE", "MONEY", "PERCENT"]:
                    concept = RegulatoryConcept(
                        text=ent.text,
                        concept_type=ent.label_,
                        confidence=0.9,  # Mock confidence
                        start_pos=ent.start_char,
                        end_pos=ent.end_char,
                        context=ent.sent.text if ent.sent else "",
                        related_entities=[]
                    )
                    concepts.append(concept)
            
            # Extract regulatory-specific entities using patterns
            for entity_type, pattern in self.entity_patterns.items():
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    concept = RegulatoryConcept(
                        text=match.group(),
                        concept_type=entity_type,
                        confidence=0.8,
                        start_pos=match.start(),
                        end_pos=match.end(),
                        context=self._get_context(text, match.start(), match.end()),
                        related_entities=[]
                    )
                    concepts.append(concept)
            
            # Cache results
            await cache_set(cache_key, concepts, ttl=3600)
            
            logger.info(f"Extracted {len(concepts)} regulatory concepts")
            return concepts
            
        except Exception as e:
            logger.error(f"Failed to extract regulatory concepts: {e}")
            return []
    
    async def extract_compliance_requirements(self, text: str) -> List[ComplianceRequirement]:
        """Extract compliance requirements from regulatory text"""
        try:
            cache_key = f"compliance_requirements:{hash(text)}"
            cached_result = await cache_get(cache_key)
            if cached_result:
                return cached_result
            
            requirements = []
            
            # Use requirement patterns to extract requirements
            for pattern in self.requirement_patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    requirement_text = match.group(1).strip()
                    
                    # Determine requirement type
                    req_type = self._classify_requirement_type(requirement_text)
                    
                    # Extract deadline if present
                    deadline = self._extract_deadline(requirement_text)
                    
                    # Identify applicable entities
                    applicable_entities = self._identify_applicable_entities(requirement_text)
                    
                    # Extract compliance actions
                    compliance_actions = self._extract_compliance_actions(requirement_text)
                    
                    # Assess severity
                    severity = self._assess_requirement_severity(requirement_text)
                    
                    requirement = ComplianceRequirement(
                        requirement_text=requirement_text,
                        requirement_type=req_type,
                        deadline=deadline,
                        applicable_entities=applicable_entities,
                        compliance_actions=compliance_actions,
                        severity=severity,
                        confidence=0.8
                    )
                    requirements.append(requirement)
            
            # Cache results
            await cache_set(cache_key, requirements, ttl=3600)
            
            logger.info(f"Extracted {len(requirements)} compliance requirements")
            return requirements
            
        except Exception as e:
            logger.error(f"Failed to extract compliance requirements: {e}")
            return []
    
    async def assess_regulatory_impact(self, old_text: str, new_text: str) -> RegulatoryImpact:
        """Assess impact of regulatory changes"""
        try:
            # Calculate text similarity
            similarity = await self._calculate_text_similarity(old_text, new_text)
            
            # Determine impact level based on similarity
            if similarity < 0.7:
                impact_level = "high"
            elif similarity < 0.85:
                impact_level = "medium"
            else:
                impact_level = "low"
            
            # Identify impact areas
            impact_areas = self._identify_impact_areas(new_text)
            
            # Identify affected processes
            affected_processes = self._identify_affected_processes(new_text)
            
            # Estimate implementation effort
            implementation_effort = self._estimate_implementation_effort(impact_level, impact_areas)
            
            # Estimate timeline
            timeline_estimate = self._estimate_timeline(impact_level, len(impact_areas))
            
            # Assess cost implications
            cost_implications = self._assess_cost_implications(impact_level, affected_processes)
            
            # Identify risk factors
            risk_factors = self._identify_risk_factors(new_text)
            
            impact = RegulatoryImpact(
                impact_areas=impact_areas,
                impact_level=impact_level,
                affected_processes=affected_processes,
                implementation_effort=implementation_effort,
                timeline_estimate=timeline_estimate,
                cost_implications=cost_implications,
                risk_factors=risk_factors
            )
            
            logger.info(f"Assessed regulatory impact: {impact_level} level")
            return impact
            
        except Exception as e:
            logger.error(f"Failed to assess regulatory impact: {e}")
            return RegulatoryImpact(
                impact_areas=[],
                impact_level="unknown",
                affected_processes=[],
                implementation_effort="unknown",
                timeline_estimate="unknown",
                cost_implications="unknown",
                risk_factors=[]
            )
    
    async def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts"""
        try:
            if self.sentence_transformer:
                embeddings = self.sentence_transformer.encode([text1, text2])
                similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                return float(similarity)
            else:
                # Fallback to TF-IDF similarity
                vectorizer = TfidfVectorizer()
                tfidf_matrix = vectorizer.fit_transform([text1, text2])
                similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                return float(similarity)
        except Exception as e:
            logger.warning(f"Failed to calculate text similarity: {e}")
            return 0.5  # Default similarity
    
    def _classify_requirement_type(self, text: str) -> str:
        """Classify requirement as mandatory, optional, or conditional"""
        mandatory_indicators = self.regulatory_patterns["mandatory_indicators"]
        
        for indicator in mandatory_indicators:
            if re.search(indicator, text, re.IGNORECASE):
                return "mandatory"
        
        if re.search(r"\bmay\b|\boptional\b|\bvoluntary\b", text, re.IGNORECASE):
            return "optional"
        
        if re.search(r"\bif\b|\bwhen\b|\bunless\b|\bprovided\b", text, re.IGNORECASE):
            return "conditional"
        
        return "mandatory"  # Default to mandatory for regulatory text
    
    def _extract_deadline(self, text: str) -> Optional[datetime]:
        """Extract deadline from requirement text"""
        deadline_patterns = self.regulatory_patterns["deadline_patterns"]
        
        for pattern in deadline_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # This is a simplified implementation
                # In practice, you'd use a more sophisticated date parser
                return datetime.now()  # Mock deadline
        
        return None
    
    def _identify_applicable_entities(self, text: str) -> List[str]:
        """Identify entities to which the requirement applies"""
        entities = []
        
        if re.search(r"\bbank", text, re.IGNORECASE):
            entities.append("banks")
        if re.search(r"\bNBFC", text, re.IGNORECASE):
            entities.append("NBFCs")
        if re.search(r"\bfinancial institution", text, re.IGNORECASE):
            entities.append("financial_institutions")
        
        return entities if entities else ["all_entities"]
    
    def _extract_compliance_actions(self, text: str) -> List[str]:
        """Extract compliance actions from requirement text"""
        actions = []
        action_patterns = self.regulatory_patterns["compliance_actions"]
        
        for pattern in action_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                actions.append(pattern)
        
        return actions
    
    def _assess_requirement_severity(self, text: str) -> str:
        """Assess severity of compliance requirement"""
        if re.search(r"\bcritical\b|\bimmediate\b|\burgent\b", text, re.IGNORECASE):
            return "high"
        elif re.search(r"\bimportant\b|\bsignificant\b", text, re.IGNORECASE):
            return "medium"
        else:
            return "low"
    
    def _identify_impact_areas(self, text: str) -> List[str]:
        """Identify areas impacted by regulatory changes"""
        areas = []
        
        for area, keywords in self.compliance_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text.lower():
                    areas.append(area)
                    break
        
        return list(set(areas))
    
    def _identify_affected_processes(self, text: str) -> List[str]:
        """Identify business processes affected by changes"""
        processes = []
        operational_areas = self.impact_indicators["operational_areas"]
        
        for area in operational_areas:
            if area.lower() in text.lower():
                processes.append(area)
        
        return processes
    
    def _estimate_implementation_effort(self, impact_level: str, impact_areas: List[str]) -> str:
        """Estimate implementation effort based on impact"""
        if impact_level == "high" or len(impact_areas) > 3:
            return "high"
        elif impact_level == "medium" or len(impact_areas) > 1:
            return "medium"
        else:
            return "low"
    
    def _estimate_timeline(self, impact_level: str, num_areas: int) -> str:
        """Estimate implementation timeline"""
        if impact_level == "high":
            return "6-12 months"
        elif impact_level == "medium":
            return "3-6 months"
        else:
            return "1-3 months"
    
    def _assess_cost_implications(self, impact_level: str, processes: List[str]) -> str:
        """Assess cost implications of changes"""
        if impact_level == "high" or len(processes) > 3:
            return "high"
        elif impact_level == "medium":
            return "medium"
        else:
            return "low"
    
    def _identify_risk_factors(self, text: str) -> List[str]:
        """Identify risk factors from regulatory text"""
        risk_factors = []
        
        if re.search(r"penalty|fine|sanction", text, re.IGNORECASE):
            risk_factors.append("regulatory_penalties")
        
        if re.search(r"system|technology|IT", text, re.IGNORECASE):
            risk_factors.append("technology_risks")
        
        if re.search(r"staff|training|competency", text, re.IGNORECASE):
            risk_factors.append("human_resource_risks")
        
        return risk_factors
    
    def _get_context(self, text: str, start: int, end: int, window: int = 100) -> str:
        """Get context around a text span"""
        context_start = max(0, start - window)
        context_end = min(len(text), end + window)
        return text[context_start:context_end]


# Global NLP engine instance
nlp_engine = RegulatoryNLPEngine()
