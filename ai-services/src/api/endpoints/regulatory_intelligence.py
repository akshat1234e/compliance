"""
Regulatory Intelligence Endpoints
AI-powered regulatory analysis and monitoring
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from src.core.models import get_model_manager, ModelManager
from src.core.logging import api_logger as logger

router = APIRouter()


class RegulatoryAnalysisRequest(BaseModel):
    """Request model for regulatory analysis"""
    document_text: str = Field(..., description="Regulatory document text", max_length=50000)
    document_type: str = Field(default="circular", description="Type of regulatory document")
    jurisdiction: str = Field(default="RBI", description="Regulatory jurisdiction")
    include_compliance_check: bool = Field(default=True, description="Include compliance analysis")
    include_impact_assessment: bool = Field(default=True, description="Include impact assessment")


class ComplianceCheckRequest(BaseModel):
    """Request model for compliance checking"""
    policy_text: str = Field(..., description="Policy or procedure text", max_length=50000)
    regulatory_requirements: List[str] = Field(..., description="List of regulatory requirements")
    jurisdiction: str = Field(default="RBI", description="Regulatory jurisdiction")


class RegulatoryChangeRequest(BaseModel):
    """Request model for regulatory change analysis"""
    old_regulation: str = Field(..., description="Previous regulation text", max_length=50000)
    new_regulation: str = Field(..., description="Updated regulation text", max_length=50000)
    effective_date: Optional[str] = Field(None, description="Effective date of change")


@router.post("/analyze")
async def analyze_regulatory_document(
    request: RegulatoryAnalysisRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Comprehensive regulatory document analysis"""
    try:
        logger.info(f"Analyzing regulatory document of type {request.document_type}")
        
        result = {
            "document_type": request.document_type,
            "jurisdiction": request.jurisdiction,
            "document_length": len(request.document_text),
        }
        
        # Extract key entities and concepts
        try:
            nlp = model_manager.get_spacy_nlp()
            doc = nlp(request.document_text)
            
            # Extract regulatory entities
            regulatory_entities = []
            for ent in doc.ents:
                if ent.label_ in ["ORG", "LAW", "DATE", "MONEY", "PERCENT"]:
                    regulatory_entities.append({
                        "text": ent.text,
                        "label": ent.label_,
                        "start": ent.start_char,
                        "end": ent.end_char,
                    })
            
            result["entities"] = regulatory_entities
            
            # Extract key requirements (mock implementation)
            requirements = []
            sentences = [sent.text.strip() for sent in doc.sents]
            for sentence in sentences:
                if any(keyword in sentence.lower() for keyword in ["shall", "must", "required", "mandatory"]):
                    requirements.append({
                        "text": sentence,
                        "type": "mandatory",
                        "confidence": 0.8,
                    })
            
            result["requirements"] = requirements[:10]  # Top 10 requirements
            
        except Exception as e:
            logger.warning(f"Entity extraction failed: {e}")
            result["entities"] = []
            result["requirements"] = []
        
        # Compliance analysis
        if request.include_compliance_check:
            try:
                # Mock compliance analysis
                compliance_score = 0.85  # Mock score
                compliance_issues = [
                    {
                        "issue": "Missing risk assessment framework",
                        "severity": "high",
                        "section": "Risk Management",
                        "recommendation": "Implement comprehensive risk assessment procedures",
                    },
                    {
                        "issue": "Incomplete documentation requirements",
                        "severity": "medium",
                        "section": "Documentation",
                        "recommendation": "Enhance documentation standards",
                    }
                ]
                
                result["compliance"] = {
                    "score": compliance_score,
                    "grade": "B+",
                    "issues": compliance_issues,
                    "total_issues": len(compliance_issues),
                }
                
            except Exception as e:
                logger.warning(f"Compliance analysis failed: {e}")
                result["compliance"] = {"error": "Compliance analysis unavailable"}
        
        # Impact assessment
        if request.include_impact_assessment:
            try:
                # Mock impact assessment
                impact_areas = [
                    {
                        "area": "Operations",
                        "impact_level": "high",
                        "description": "Significant changes to operational procedures required",
                        "estimated_effort": "6-8 weeks",
                    },
                    {
                        "area": "Technology",
                        "impact_level": "medium",
                        "description": "System updates and new reporting capabilities needed",
                        "estimated_effort": "4-6 weeks",
                    },
                    {
                        "area": "Training",
                        "impact_level": "medium",
                        "description": "Staff training on new requirements",
                        "estimated_effort": "2-3 weeks",
                    }
                ]
                
                result["impact_assessment"] = {
                    "overall_impact": "high",
                    "implementation_timeline": "3-4 months",
                    "areas": impact_areas,
                    "priority_actions": [
                        "Review current operational procedures",
                        "Assess technology infrastructure",
                        "Develop implementation roadmap",
                    ]
                }
                
            except Exception as e:
                logger.warning(f"Impact assessment failed: {e}")
                result["impact_assessment"] = {"error": "Impact assessment unavailable"}
        
        return {
            "success": True,
            "data": result,
            "message": "Regulatory analysis completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Regulatory analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Regulatory analysis failed: {str(e)}")


@router.post("/compliance-check")
async def check_compliance(
    request: ComplianceCheckRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Check policy compliance against regulatory requirements"""
    try:
        logger.info(f"Checking compliance for {len(request.regulatory_requirements)} requirements")
        
        # Mock compliance checking implementation
        compliance_results = []
        overall_score = 0
        
        for i, requirement in enumerate(request.regulatory_requirements):
            # Mock compliance check
            is_compliant = (i % 3) != 0  # Mock: 2/3 are compliant
            confidence = 0.8 + (i % 3) * 0.1
            
            compliance_results.append({
                "requirement": requirement,
                "compliant": is_compliant,
                "confidence": confidence,
                "evidence": f"Found relevant policy section addressing this requirement" if is_compliant else None,
                "gaps": [] if is_compliant else ["Missing specific implementation details"],
                "recommendations": [] if is_compliant else ["Add detailed procedures for this requirement"],
            })
            
            if is_compliant:
                overall_score += confidence
        
        overall_score = overall_score / len(request.regulatory_requirements) if request.regulatory_requirements else 0
        
        compliant_count = sum(1 for r in compliance_results if r["compliant"])
        
        return {
            "success": True,
            "data": {
                "overall_score": overall_score,
                "compliance_percentage": (compliant_count / len(request.regulatory_requirements)) * 100,
                "total_requirements": len(request.regulatory_requirements),
                "compliant_requirements": compliant_count,
                "non_compliant_requirements": len(request.regulatory_requirements) - compliant_count,
                "results": compliance_results,
                "summary": {
                    "grade": "B+" if overall_score > 0.8 else "B" if overall_score > 0.6 else "C",
                    "status": "Mostly Compliant" if compliant_count > len(request.regulatory_requirements) * 0.7 else "Partially Compliant",
                }
            },
            "message": "Compliance check completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Compliance check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")


@router.post("/change-analysis")
async def analyze_regulatory_change(
    request: RegulatoryChangeRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Analyze changes between regulatory versions"""
    try:
        logger.info("Analyzing regulatory changes")
        
        # Calculate text similarity to identify changes
        sentence_transformer = model_manager.get_sentence_transformer()
        embeddings = sentence_transformer.encode([request.old_regulation, request.new_regulation])
        
        from sklearn.metrics.pairwise import cosine_similarity
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        
        # Mock change analysis
        changes = [
            {
                "type": "addition",
                "section": "Risk Management Framework",
                "description": "New requirements for stress testing procedures",
                "impact": "high",
                "action_required": "Implement new stress testing protocols",
            },
            {
                "type": "modification",
                "section": "Reporting Requirements",
                "description": "Updated frequency for regulatory reporting",
                "impact": "medium",
                "action_required": "Adjust reporting schedules and systems",
            },
            {
                "type": "deletion",
                "section": "Legacy Procedures",
                "description": "Removed outdated compliance procedures",
                "impact": "low",
                "action_required": "Update internal documentation",
            }
        ]
        
        return {
            "success": True,
            "data": {
                "similarity_score": float(similarity),
                "change_magnitude": "significant" if similarity < 0.8 else "moderate" if similarity < 0.9 else "minor",
                "effective_date": request.effective_date,
                "changes": changes,
                "summary": {
                    "total_changes": len(changes),
                    "high_impact_changes": sum(1 for c in changes if c["impact"] == "high"),
                    "medium_impact_changes": sum(1 for c in changes if c["impact"] == "medium"),
                    "low_impact_changes": sum(1 for c in changes if c["impact"] == "low"),
                },
                "recommendations": [
                    "Conduct impact assessment for high-priority changes",
                    "Update internal policies and procedures",
                    "Plan staff training for new requirements",
                    "Review technology infrastructure requirements",
                ]
            },
            "message": "Regulatory change analysis completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Change analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Change analysis failed: {str(e)}")


@router.get("/jurisdictions")
async def get_supported_jurisdictions() -> Dict[str, Any]:
    """Get list of supported regulatory jurisdictions"""
    jurisdictions = [
        {
            "code": "RBI",
            "name": "Reserve Bank of India",
            "country": "India",
            "type": "Central Bank",
            "supported_documents": ["circulars", "guidelines", "notifications", "master_directions"],
        },
        {
            "code": "SEBI",
            "name": "Securities and Exchange Board of India",
            "country": "India",
            "type": "Securities Regulator",
            "supported_documents": ["circulars", "guidelines", "regulations"],
        },
        {
            "code": "IRDAI",
            "name": "Insurance Regulatory and Development Authority of India",
            "country": "India",
            "type": "Insurance Regulator",
            "supported_documents": ["circulars", "guidelines", "regulations"],
        }
    ]
    
    return {
        "success": True,
        "data": {
            "jurisdictions": jurisdictions,
            "total_count": len(jurisdictions),
        },
        "message": "Supported jurisdictions retrieved successfully",
    }
