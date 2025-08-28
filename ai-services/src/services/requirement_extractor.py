"""
Requirement Extractor
NLP module to identify actionable compliance requirements from regulatory text
"""

import re
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

import spacy
from spacy.matcher import Matcher, PhraseMatcher
from spacy.tokens import Doc, Span
import pandas as pd

from src.core.models import get_spacy_nlp
from src.core.cache import cache_get, cache_set
from src.core.logging import nlp_logger as logger


class RequirementType(Enum):
    """Types of compliance requirements"""
    MANDATORY = "mandatory"
    OPTIONAL = "optional"
    CONDITIONAL = "conditional"
    REPORTING = "reporting"
    DISCLOSURE = "disclosure"
    CAPITAL = "capital"
    RISK_MANAGEMENT = "risk_management"
    GOVERNANCE = "governance"
    OPERATIONAL = "operational"
    TECHNOLOGY = "technology"


class RequirementPriority(Enum):
    """Priority levels for requirements"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class ComplianceRequirement:
    """Extracted compliance requirement"""
    id: str
    text: str
    requirement_type: RequirementType
    priority: RequirementPriority
    deadline: Optional[datetime]
    applicable_entities: List[str]
    compliance_actions: List[str]
    regulatory_reference: str
    section: str
    confidence_score: float
    keywords: List[str]
    dependencies: List[str]
    implementation_guidance: str
    penalties: List[str]
    exemptions: List[str]


@dataclass
class ExtractionResult:
    """Result of requirement extraction"""
    requirements: List[ComplianceRequirement]
    total_count: int
    by_type: Dict[str, int]
    by_priority: Dict[str, int]
    extraction_metadata: Dict[str, Any]


class RequirementExtractor:
    """Advanced requirement extraction from regulatory documents"""
    
    def __init__(self):
        self.nlp = None
        self.matcher = None
        self.phrase_matcher = None
        self.requirement_patterns = self._load_requirement_patterns()
        self.action_verbs = self._load_action_verbs()
        self.entity_patterns = self._load_entity_patterns()
        self.deadline_patterns = self._load_deadline_patterns()
        self.penalty_patterns = self._load_penalty_patterns()
        self.exemption_patterns = self._load_exemption_patterns()
    
    async def initialize(self):
        """Initialize the requirement extractor"""
        try:
            logger.info("Initializing Requirement Extractor...")
            
            self.nlp = get_spacy_nlp()
            self.matcher = Matcher(self.nlp.vocab)
            self.phrase_matcher = PhraseMatcher(self.nlp.vocab)
            
            # Add patterns to matchers
            self._add_requirement_patterns()
            self._add_phrase_patterns()
            
            logger.info("✅ Requirement Extractor initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Requirement Extractor: {e}")
            raise
    
    def _load_requirement_patterns(self) -> Dict[str, List[Dict]]:
        """Load spaCy patterns for requirement identification"""
        return {
            "mandatory_requirements": [
                [{"LOWER": {"IN": ["shall", "must", "required"}}],
                [{"LOWER": "banks"}, {"LOWER": {"IN": ["shall", "must", "should"]}}],
                [{"LOWER": "it"}, {"LOWER": "is"}, {"LOWER": {"IN": ["mandatory", "required"]}}],
                [{"LOWER": {"IN": ["mandatory", "compulsory", "obligatory"]}}],
            ],
            "reporting_requirements": [
                [{"LOWER": {"IN": ["report", "submit", "file"]}}, {"LOWER": {"IN": ["to", "with"]}}],
                [{"LOWER": "reporting"}, {"LOWER": {"IN": ["requirement", "obligation"]}}],
                [{"LOWER": {"IN": ["return", "returns"]}}, {"LOWER": {"IN": ["shall", "must"]}}],
            ],
            "capital_requirements": [
                [{"LOWER": {"IN": ["capital", "crar", "car"]}}, {"LOWER": {"IN": ["ratio", "adequacy"]}}],
                [{"LOWER": "tier"}, {"TEXT": {"REGEX": "[12]"}}, {"LOWER": "capital"}],
                [{"LOWER": "minimum"}, {"LOWER": "capital"}],
            ],
            "risk_requirements": [
                [{"LOWER": "risk"}, {"LOWER": {"IN": ["management", "assessment", "monitoring"]}}],
                [{"LOWER": {"IN": ["credit", "operational", "market", "liquidity"]}}, {"LOWER": "risk"}],
                [{"LOWER": "stress"}, {"LOWER": {"IN": ["test", "testing"]}}],
            ],
            "governance_requirements": [
                [{"LOWER": "board"}, {"LOWER": {"IN": ["oversight", "approval", "resolution"]}}],
                [{"LOWER": "independent"}, {"LOWER": "directors"}],
                [{"LOWER": {"IN": ["audit", "risk", "nomination"]}}, {"LOWER": "committee"}],
            ]
        }
    
    def _load_action_verbs(self) -> List[str]:
        """Load action verbs that indicate compliance actions"""
        return [
            "implement", "establish", "maintain", "ensure", "comply",
            "report", "submit", "file", "disclose", "monitor",
            "assess", "evaluate", "review", "update", "revise",
            "approve", "authorize", "validate", "verify", "confirm",
            "document", "record", "track", "measure", "calculate",
            "notify", "inform", "communicate", "publish", "display"
        ]
    
    def _load_entity_patterns(self) -> Dict[str, str]:
        """Load patterns for identifying applicable entities"""
        return {
            "banks": r"\b(bank|banks|banking company|banking companies)\b",
            "nbfcs": r"\b(NBFC|NBFCs|non-banking financial company|non-banking financial companies)\b",
            "financial_institutions": r"\b(financial institution|financial institutions|FI|FIs)\b",
            "credit_institutions": r"\b(credit institution|credit institutions|lending institution)\b",
            "all_entities": r"\b(all|every|each)\s+(bank|institution|entity|company)\b",
            "specific_categories": r"\b(scheduled commercial bank|cooperative bank|regional rural bank|payment bank|small finance bank)\b"
        }
    
    def _load_deadline_patterns(self) -> List[str]:
        """Load patterns for extracting deadlines"""
        return [
            r"by\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
            r"within\s+(\d+)\s+(days?|weeks?|months?|years?)",
            r"not later than\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
            r"before\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
            r"on or before\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
            r"effective\s+from\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
            r"with effect from\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})"
        ]
    
    def _load_penalty_patterns(self) -> List[str]:
        """Load patterns for identifying penalties"""
        return [
            r"penalty|fine|sanction|disciplinary action",
            r"monetary penalty|financial penalty",
            r"non-compliance.*penalty",
            r"violation.*fine",
            r"breach.*sanction"
        ]
    
    def _load_exemption_patterns(self) -> List[str]:
        """Load patterns for identifying exemptions"""
        return [
            r"exempt|exemption|exception",
            r"not applicable|does not apply",
            r"excluding|except for",
            r"waiver|waived",
            r"relaxation|relaxed"
        ]
    
    def _add_requirement_patterns(self):
        """Add requirement patterns to spaCy matcher"""
        for pattern_name, patterns in self.requirement_patterns.items():
            for i, pattern in enumerate(patterns):
                self.matcher.add(f"{pattern_name}_{i}", [pattern])
    
    def _add_phrase_patterns(self):
        """Add phrase patterns to phrase matcher"""
        # Add action verb phrases
        action_docs = [self.nlp(verb) for verb in self.action_verbs]
        self.phrase_matcher.add("ACTION_VERBS", action_docs)
    
    async def extract_requirements(self, text: str, document_metadata: Dict[str, Any] = None) -> ExtractionResult:
        """Extract compliance requirements from regulatory text"""
        try:
            cache_key = f"requirements:{hash(text)}"
            cached_result = await cache_get(cache_key)
            if cached_result:
                return cached_result
            
            logger.info(f"Extracting requirements from text of length {len(text)}")
            
            # Process text with spaCy
            doc = self.nlp(text)
            
            # Extract requirements using multiple methods
            requirements = []
            
            # Method 1: Pattern-based extraction
            pattern_requirements = self._extract_pattern_based_requirements(doc, document_metadata)
            requirements.extend(pattern_requirements)
            
            # Method 2: Sentence-based extraction
            sentence_requirements = self._extract_sentence_based_requirements(doc, document_metadata)
            requirements.extend(sentence_requirements)
            
            # Method 3: Context-based extraction
            context_requirements = self._extract_context_based_requirements(doc, document_metadata)
            requirements.extend(context_requirements)
            
            # Remove duplicates and merge similar requirements
            requirements = self._deduplicate_requirements(requirements)
            
            # Create extraction result
            result = ExtractionResult(
                requirements=requirements,
                total_count=len(requirements),
                by_type=self._count_by_type(requirements),
                by_priority=self._count_by_priority(requirements),
                extraction_metadata={
                    "document_length": len(text),
                    "sentences_processed": len(list(doc.sents)),
                    "extraction_methods": ["pattern_based", "sentence_based", "context_based"],
                    "timestamp": datetime.now().isoformat()
                }
            )
            
            # Cache results
            await cache_set(cache_key, result, ttl=3600)
            
            logger.info(f"Extracted {len(requirements)} requirements")
            return result
            
        except Exception as e:
            logger.error(f"Failed to extract requirements: {e}")
            return ExtractionResult(
                requirements=[],
                total_count=0,
                by_type={},
                by_priority={},
                extraction_metadata={"error": str(e)}
            )
    
    def _extract_pattern_based_requirements(self, doc: Doc, metadata: Dict[str, Any]) -> List[ComplianceRequirement]:
        """Extract requirements using spaCy patterns"""
        requirements = []
        matches = self.matcher(doc)
        
        for match_id, start, end in matches:
            span = doc[start:end]
            pattern_name = self.nlp.vocab.strings[match_id]
            
            # Extract full sentence containing the match
            sentence = span.sent
            
            # Determine requirement type based on pattern
            req_type = self._determine_requirement_type(pattern_name, sentence.text)
            
            # Extract other attributes
            deadline = self._extract_deadline_from_sentence(sentence.text)
            applicable_entities = self._extract_applicable_entities(sentence.text)
            compliance_actions = self._extract_compliance_actions(sentence.text)
            priority = self._determine_priority(sentence.text, req_type)
            
            requirement = ComplianceRequirement(
                id=f"req_{len(requirements)}_{hash(sentence.text) % 10000}",
                text=sentence.text.strip(),
                requirement_type=req_type,
                priority=priority,
                deadline=deadline,
                applicable_entities=applicable_entities,
                compliance_actions=compliance_actions,
                regulatory_reference=metadata.get("document_id", "unknown") if metadata else "unknown",
                section=metadata.get("section", "unknown") if metadata else "unknown",
                confidence_score=0.8,
                keywords=self._extract_keywords(sentence.text),
                dependencies=[],
                implementation_guidance="",
                penalties=self._extract_penalties(sentence.text),
                exemptions=self._extract_exemptions(sentence.text)
            )
            
            requirements.append(requirement)
        
        return requirements
    
    def _extract_sentence_based_requirements(self, doc: Doc, metadata: Dict[str, Any]) -> List[ComplianceRequirement]:
        """Extract requirements by analyzing individual sentences"""
        requirements = []
        
        for sent in doc.sents:
            sentence_text = sent.text.strip()
            
            # Check if sentence contains requirement indicators
            if self._is_requirement_sentence(sentence_text):
                req_type = self._classify_requirement_type(sentence_text)
                priority = self._determine_priority(sentence_text, req_type)
                
                requirement = ComplianceRequirement(
                    id=f"sent_{hash(sentence_text) % 10000}",
                    text=sentence_text,
                    requirement_type=req_type,
                    priority=priority,
                    deadline=self._extract_deadline_from_sentence(sentence_text),
                    applicable_entities=self._extract_applicable_entities(sentence_text),
                    compliance_actions=self._extract_compliance_actions(sentence_text),
                    regulatory_reference=metadata.get("document_id", "unknown") if metadata else "unknown",
                    section=metadata.get("section", "unknown") if metadata else "unknown",
                    confidence_score=0.7,
                    keywords=self._extract_keywords(sentence_text),
                    dependencies=[],
                    implementation_guidance="",
                    penalties=self._extract_penalties(sentence_text),
                    exemptions=self._extract_exemptions(sentence_text)
                )
                
                requirements.append(requirement)
        
        return requirements
    
    def _extract_context_based_requirements(self, doc: Doc, metadata: Dict[str, Any]) -> List[ComplianceRequirement]:
        """Extract requirements using contextual analysis"""
        requirements = []
        
        # Look for numbered lists and bullet points
        numbered_requirements = self._extract_numbered_requirements(doc.text, metadata)
        requirements.extend(numbered_requirements)
        
        # Look for table-based requirements
        table_requirements = self._extract_table_requirements(doc.text, metadata)
        requirements.extend(table_requirements)
        
        return requirements
    
    def _is_requirement_sentence(self, sentence: str) -> bool:
        """Check if a sentence contains a compliance requirement"""
        requirement_indicators = [
            "shall", "must", "required", "mandatory", "obligatory",
            "should", "need to", "have to", "ought to",
            "report", "submit", "file", "disclose", "maintain",
            "implement", "establish", "ensure", "comply"
        ]
        
        sentence_lower = sentence.lower()
        return any(indicator in sentence_lower for indicator in requirement_indicators)
    
    def _classify_requirement_type(self, text: str) -> RequirementType:
        """Classify the type of requirement"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["report", "submit", "file", "return"]):
            return RequirementType.REPORTING
        elif any(word in text_lower for word in ["disclose", "publish", "display"]):
            return RequirementType.DISCLOSURE
        elif any(word in text_lower for word in ["capital", "crar", "tier"]):
            return RequirementType.CAPITAL
        elif any(word in text_lower for word in ["risk", "stress test"]):
            return RequirementType.RISK_MANAGEMENT
        elif any(word in text_lower for word in ["board", "committee", "governance"]):
            return RequirementType.GOVERNANCE
        elif any(word in text_lower for word in ["system", "technology", "it"]):
            return RequirementType.TECHNOLOGY
        elif any(word in text_lower for word in ["shall", "must", "mandatory"]):
            return RequirementType.MANDATORY
        elif any(word in text_lower for word in ["may", "optional", "voluntary"]):
            return RequirementType.OPTIONAL
        elif any(word in text_lower for word in ["if", "when", "provided", "subject to"]):
            return RequirementType.CONDITIONAL
        else:
            return RequirementType.OPERATIONAL
    
    def _determine_requirement_type(self, pattern_name: str, text: str) -> RequirementType:
        """Determine requirement type from pattern name and text"""
        if "mandatory" in pattern_name:
            return RequirementType.MANDATORY
        elif "reporting" in pattern_name:
            return RequirementType.REPORTING
        elif "capital" in pattern_name:
            return RequirementType.CAPITAL
        elif "risk" in pattern_name:
            return RequirementType.RISK_MANAGEMENT
        elif "governance" in pattern_name:
            return RequirementType.GOVERNANCE
        else:
            return self._classify_requirement_type(text)
    
    def _determine_priority(self, text: str, req_type: RequirementType) -> RequirementPriority:
        """Determine priority of requirement"""
        text_lower = text.lower()
        
        # Critical indicators
        if any(word in text_lower for word in ["immediate", "urgent", "critical", "penalty"]):
            return RequirementPriority.CRITICAL
        
        # High priority indicators
        if any(word in text_lower for word in ["shall", "must", "mandatory", "capital", "risk"]):
            return RequirementPriority.HIGH
        
        # Medium priority indicators
        if any(word in text_lower for word in ["should", "reporting", "disclosure"]):
            return RequirementPriority.MEDIUM
        
        # Default based on requirement type
        if req_type in [RequirementType.MANDATORY, RequirementType.CAPITAL, RequirementType.RISK_MANAGEMENT]:
            return RequirementPriority.HIGH
        elif req_type in [RequirementType.REPORTING, RequirementType.DISCLOSURE]:
            return RequirementPriority.MEDIUM
        else:
            return RequirementPriority.LOW
    
    def _extract_deadline_from_sentence(self, text: str) -> Optional[datetime]:
        """Extract deadline from sentence text"""
        for pattern in self.deadline_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Simplified date parsing - in production, use proper date parser
                return datetime.now() + timedelta(days=90)  # Mock 90-day deadline
        return None
    
    def _extract_applicable_entities(self, text: str) -> List[str]:
        """Extract entities to which requirement applies"""
        entities = []
        
        for entity_type, pattern in self.entity_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                entities.append(entity_type)
        
        return entities if entities else ["all_entities"]
    
    def _extract_compliance_actions(self, text: str) -> List[str]:
        """Extract compliance actions from text"""
        actions = []
        text_lower = text.lower()
        
        for verb in self.action_verbs:
            if verb in text_lower:
                actions.append(verb)
        
        return actions
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from requirement text"""
        doc = self.nlp(text)
        keywords = []
        
        for token in doc:
            if (token.pos_ in ["NOUN", "ADJ"] and 
                not token.is_stop and 
                not token.is_punct and 
                len(token.text) > 2):
                keywords.append(token.lemma_.lower())
        
        return list(set(keywords))[:10]  # Top 10 unique keywords
    
    def _extract_penalties(self, text: str) -> List[str]:
        """Extract penalty information from text"""
        penalties = []
        
        for pattern in self.penalty_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                penalties.append(pattern.replace("|", " or "))
        
        return penalties
    
    def _extract_exemptions(self, text: str) -> List[str]:
        """Extract exemption information from text"""
        exemptions = []
        
        for pattern in self.exemption_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                exemptions.append(pattern.replace("|", " or "))
        
        return exemptions
    
    def _extract_numbered_requirements(self, text: str, metadata: Dict[str, Any]) -> List[ComplianceRequirement]:
        """Extract requirements from numbered lists"""
        requirements = []
        
        # Pattern for numbered items
        numbered_pattern = r'(\d+\.|\([a-z]\)|\([i-v]+\))\s+(.+?)(?=\d+\.|\([a-z]\)|\([i-v]+\)|$)'
        matches = re.finditer(numbered_pattern, text, re.DOTALL | re.IGNORECASE)
        
        for match in matches:
            item_text = match.group(2).strip()
            
            if self._is_requirement_sentence(item_text):
                req_type = self._classify_requirement_type(item_text)
                priority = self._determine_priority(item_text, req_type)
                
                requirement = ComplianceRequirement(
                    id=f"num_{hash(item_text) % 10000}",
                    text=item_text,
                    requirement_type=req_type,
                    priority=priority,
                    deadline=self._extract_deadline_from_sentence(item_text),
                    applicable_entities=self._extract_applicable_entities(item_text),
                    compliance_actions=self._extract_compliance_actions(item_text),
                    regulatory_reference=metadata.get("document_id", "unknown") if metadata else "unknown",
                    section=metadata.get("section", "unknown") if metadata else "unknown",
                    confidence_score=0.75,
                    keywords=self._extract_keywords(item_text),
                    dependencies=[],
                    implementation_guidance="",
                    penalties=self._extract_penalties(item_text),
                    exemptions=self._extract_exemptions(item_text)
                )
                
                requirements.append(requirement)
        
        return requirements
    
    def _extract_table_requirements(self, text: str, metadata: Dict[str, Any]) -> List[ComplianceRequirement]:
        """Extract requirements from table-like structures"""
        # This is a simplified implementation
        # In practice, you'd use more sophisticated table detection
        requirements = []
        
        # Look for table-like patterns with pipes or tabs
        table_pattern = r'(\|[^|\n]+\||\t[^\t\n]+\t)'
        matches = re.finditer(table_pattern, text)
        
        for match in matches:
            row_text = match.group().strip()
            
            if self._is_requirement_sentence(row_text):
                req_type = self._classify_requirement_type(row_text)
                priority = self._determine_priority(row_text, req_type)
                
                requirement = ComplianceRequirement(
                    id=f"table_{hash(row_text) % 10000}",
                    text=row_text,
                    requirement_type=req_type,
                    priority=priority,
                    deadline=self._extract_deadline_from_sentence(row_text),
                    applicable_entities=self._extract_applicable_entities(row_text),
                    compliance_actions=self._extract_compliance_actions(row_text),
                    regulatory_reference=metadata.get("document_id", "unknown") if metadata else "unknown",
                    section=metadata.get("section", "unknown") if metadata else "unknown",
                    confidence_score=0.6,
                    keywords=self._extract_keywords(row_text),
                    dependencies=[],
                    implementation_guidance="",
                    penalties=self._extract_penalties(row_text),
                    exemptions=self._extract_exemptions(row_text)
                )
                
                requirements.append(requirement)
        
        return requirements
    
    def _deduplicate_requirements(self, requirements: List[ComplianceRequirement]) -> List[ComplianceRequirement]:
        """Remove duplicate and similar requirements"""
        unique_requirements = []
        seen_texts = set()
        
        for req in requirements:
            # Simple deduplication based on text similarity
            text_hash = hash(req.text.lower().strip())
            
            if text_hash not in seen_texts:
                seen_texts.add(text_hash)
                unique_requirements.append(req)
        
        return unique_requirements
    
    def _count_by_type(self, requirements: List[ComplianceRequirement]) -> Dict[str, int]:
        """Count requirements by type"""
        counts = {}
        for req in requirements:
            req_type = req.requirement_type.value
            counts[req_type] = counts.get(req_type, 0) + 1
        return counts
    
    def _count_by_priority(self, requirements: List[ComplianceRequirement]) -> Dict[str, int]:
        """Count requirements by priority"""
        counts = {}
        for req in requirements:
            priority = req.priority.value
            counts[priority] = counts.get(priority, 0) + 1
        return counts


# Global requirement extractor instance
requirement_extractor = RequirementExtractor()
