"""
Tests for Document Intelligence Service
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock
from PIL import Image
import io

from src.services.document_intelligence import DocumentIntelligenceService


@pytest.fixture
def doc_intelligence():
    """Create DocumentIntelligenceService instance"""
    return DocumentIntelligenceService()


@pytest.fixture
def sample_text():
    """Sample regulatory text for testing"""
    return """
    Reserve Bank of India
    RBI/2023-24/123
    Master Circular on Prudential Norms
    
    This circular consolidates the instructions on prudential norms for banks.
    All scheduled commercial banks are advised to comply with these guidelines.
    
    The risk management framework should include:
    1. Credit risk assessment
    2. Operational risk controls
    3. Market risk monitoring
    
    Effective Date: April 1, 2024
    """


@pytest.fixture
def sample_pdf_content():
    """Mock PDF content"""
    return b"%PDF-1.4 mock pdf content"


@pytest.fixture
def sample_image():
    """Create a sample image for OCR testing"""
    # Create a simple test image with text
    img = Image.new('RGB', (200, 100), color='white')
    return img


class TestDocumentIntelligenceService:
    """Test cases for DocumentIntelligenceService"""
    
    def test_initialization(self, doc_intelligence):
        """Test service initialization"""
        assert doc_intelligence is not None
        assert hasattr(doc_intelligence, 'regulatory_patterns')
        assert 'rbi_circular' in doc_intelligence.regulatory_patterns
    
    @pytest.mark.asyncio
    async def test_extract_text_from_plain_text(self, doc_intelligence):
        """Test text extraction from plain text"""
        content = b"This is a test document"
        result = await doc_intelligence.extract_text_from_file(
            content, "text/plain", "test.txt"
        )
        
        assert result["extracted_text"] == "This is a test document"
        assert result["confidence"] == 1.0
        assert result["method"] == "direct_text"
        assert result["word_count"] == 5
    
    @pytest.mark.asyncio
    async def test_classify_rbi_circular(self, doc_intelligence, sample_text):
        """Test classification of RBI circular"""
        result = await doc_intelligence.classify_document(sample_text)
        
        assert result["predicted_category"] == "rbi_circular"
        assert result["confidence"] > 0.5
        assert result["method"] == "pattern_matching"
        assert len(result["all_scores"]) > 0
    
    @pytest.mark.asyncio
    async def test_classify_risk_management_document(self, doc_intelligence):
        """Test classification of risk management document"""
        text = """
        Risk Management Framework
        This document outlines the credit risk assessment procedures
        and operational risk controls for the organization.
        Basel III compliance requirements are detailed herein.
        """
        
        result = await doc_intelligence.classify_document(text)
        
        assert result["predicted_category"] == "risk_management"
        assert result["confidence"] > 0.3
    
    @pytest.mark.asyncio
    async def test_classify_empty_text(self, doc_intelligence):
        """Test classification with empty text"""
        result = await doc_intelligence.classify_document("")
        
        assert result["predicted_category"] == "unknown"
        assert result["confidence"] == 0.0
        assert result["method"] == "no_text"
    
    @pytest.mark.asyncio
    async def test_analyze_document_structure(self, doc_intelligence, sample_text):
        """Test document structure analysis"""
        result = await doc_intelligence.analyze_document_structure(sample_text)
        
        assert "total_lines" in result
        assert "total_paragraphs" in result
        assert "potential_headers" in result
        assert "extracted_dates" in result
        assert "extracted_references" in result
        assert result["total_lines"] > 0
        assert len(result["extracted_references"]) > 0  # Should find RBI/2023-24/123
    
    @pytest.mark.asyncio
    @patch('src.services.document_intelligence.PyPDF2.PdfReader')
    async def test_extract_from_pdf_direct(self, mock_pdf_reader, doc_intelligence, sample_pdf_content):
        """Test PDF text extraction (direct method)"""
        # Mock PDF reader
        mock_page = Mock()
        mock_page.extract_text.return_value = "Sample PDF text content"
        mock_reader = Mock()
        mock_reader.pages = [mock_page]
        mock_pdf_reader.return_value = mock_reader
        
        text, confidence, method = await doc_intelligence._extract_from_pdf(sample_pdf_content)
        
        assert text == "Sample PDF text content"
        assert confidence == 0.95
        assert method == "pdf_direct"
    
    @pytest.mark.asyncio
    @patch('src.services.document_intelligence.Document')
    async def test_extract_from_word(self, mock_document, doc_intelligence):
        """Test Word document text extraction"""
        # Mock Word document
        mock_paragraph = Mock()
        mock_paragraph.text = "Sample paragraph text"
        mock_doc = Mock()
        mock_doc.paragraphs = [mock_paragraph]
        mock_doc.tables = []
        mock_document.return_value = mock_doc
        
        content = b"mock word content"
        text, confidence, method = await doc_intelligence._extract_from_word(content)
        
        assert text == "Sample paragraph text"
        assert confidence == 0.98
        assert method == "word_direct"
    
    @pytest.mark.asyncio
    @patch('src.services.document_intelligence.pytesseract.image_to_string')
    @patch('src.services.document_intelligence.pytesseract.image_to_data')
    async def test_extract_from_image_ocr(self, mock_image_to_data, mock_image_to_string, doc_intelligence):
        """Test OCR text extraction from image"""
        # Mock OCR results
        mock_image_to_string.return_value = "OCR extracted text"
        mock_image_to_data.return_value = {
            'conf': ['85', '90', '88', '92']
        }
        
        # Create mock image content
        img = Image.new('RGB', (100, 50), color='white')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_content = img_bytes.getvalue()
        
        text, confidence, method = await doc_intelligence._extract_from_image(img_content)
        
        assert text == "OCR extracted text"
        assert confidence > 0.8  # Average of mock confidences
        assert method == "ocr_image"
    
    def test_enhance_image_for_ocr(self, doc_intelligence):
        """Test image enhancement for OCR"""
        # Create a test image
        img = Image.new('RGB', (100, 50), color='gray')
        
        enhanced = doc_intelligence._enhance_image_for_ocr(img)
        
        assert enhanced is not None
        assert enhanced.mode == 'L'  # Should be grayscale
    
    @pytest.mark.asyncio
    async def test_extract_text_unsupported_format(self, doc_intelligence):
        """Test extraction with unsupported file format"""
        content = b"some content"
        
        with pytest.raises(ValueError, match="Unsupported file type"):
            await doc_intelligence.extract_text_from_file(
                content, "application/unknown", "test.unknown"
            )
    
    @pytest.mark.asyncio
    async def test_classification_with_custom_categories(self, doc_intelligence):
        """Test classification with custom categories"""
        text = "This is a compliance guideline document"
        custom_categories = ["custom_category", "another_category"]
        
        result = await doc_intelligence.classify_document(text, custom_categories)
        
        # Should still use pattern matching, not custom categories
        assert result["predicted_category"] == "compliance_guideline"
        assert result["method"] == "pattern_matching"
    
    @pytest.mark.asyncio
    async def test_structure_analysis_with_dates_and_references(self, doc_intelligence):
        """Test structure analysis with various date formats and references"""
        text = """
        Document Title
        Reference: RBI/2023-24/456
        Date: 15/03/2024
        Another date: 2024-03-15
        
        This is paragraph one.
        
        This is paragraph two with reference 2024/789.
        """
        
        result = await doc_intelligence.analyze_document_structure(text)
        
        assert len(result["extracted_dates"]) >= 2
        assert len(result["extracted_references"]) >= 2
        assert result["total_paragraphs"] >= 2
        assert "Document Title" in result["potential_headers"]


if __name__ == "__main__":
    pytest.main([__file__])
